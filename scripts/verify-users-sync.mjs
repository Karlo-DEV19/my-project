/**
 * verify-users-sync.mjs
 *
 * Checks the public.users table structure, looks for duplicates,
 * adds a unique index on email if missing, then does live upsert tests.
 *
 * Run with:  node scripts/verify-users-sync.mjs
 */

import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

const SEPARATOR = '─'.repeat(60);
const ok  = (msg) => console.log(`  ✅  ${msg}`);
const err = (msg) => console.error(`  ❌  ${msg}`);
const info = (msg) => console.log(`  ℹ️   ${msg}`);
const section = (title) => console.log(`\n${SEPARATOR}\n  ${title}\n${SEPARATOR}`);

try {
    // ── 1. Column existence ───────────────────────────────────────────────────
    section('1. Column check — users.email / users.last_login');

    const cols = await sql`
        SELECT column_name, data_type, is_nullable
        FROM   information_schema.columns
        WHERE  table_schema = 'public'
          AND  table_name   = 'users'
          AND  column_name  IN ('id','email','name','created_at','last_login')
        ORDER BY ordinal_position
    `;

    if (cols.length === 0) {
        err('public.users table not found or has no expected columns!');
        process.exit(1);
    }

    for (const c of cols) {
        info(`${c.column_name.padEnd(14)} ${c.data_type.padEnd(22)} nullable=${c.is_nullable}`);
    }

    // ── 2. Existing constraints / indexes on email ────────────────────────────
    section('2. Unique constraints / indexes on users.email');

    const indexes = await sql`
        SELECT indexname, indexdef
        FROM   pg_indexes
        WHERE  tablename = 'users'
          AND  indexdef ILIKE '%email%'
    `;

    if (indexes.length === 0) {
        info('No unique constraint or index on email found yet.');
    } else {
        for (const idx of indexes) {
            info(`${idx.indexname}: ${idx.indexdef}`);
        }
    }

    const hasEmailUnique = indexes.some(
        (i) => i.indexdef.toLowerCase().includes('unique') && i.indexdef.toLowerCase().includes('email')
    );

    // ── 3. Duplicate email check ──────────────────────────────────────────────
    section('3. Duplicate email scan');

    const dupes = await sql`
        SELECT lower(email) AS email, count(*) AS cnt
        FROM   users
        GROUP  BY lower(email)
        HAVING count(*) > 1
    `;

    if (dupes.length > 0) {
        err('Duplicate emails found — NOT adding unique index. Resolve manually first:');
        for (const d of dupes) {
            console.log(`       ${d.email}  (${d.cnt} rows)`);
        }
        // Report but continue — the index step will be skipped
    } else {
        ok('No duplicate emails found.');
    }

    // ── 4. Add unique index if safe ───────────────────────────────────────────
    section('4. Add unique index on users(email)');

    if (dupes.length > 0) {
        info('Skipping index creation due to duplicates above.');
    } else if (hasEmailUnique) {
        ok('Unique index/constraint on email already exists — nothing to do.');
    } else {
        await sql`
            CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
            ON users (email)
        `;
        // Notify PostgREST to reload so it recognises the new constraint
        await sql`NOTIFY pgrst, 'reload schema'`;
        ok('Created unique index users_email_unique_idx on users(email).');
        ok('PostgREST schema cache reload signal sent.');
    }

    // ── 5. Verify upsert does NOT overwrite existing id ───────────────────────
    section('5. Upsert id-preservation check');

    // Fetch one real row to test against
    const [sample] = await sql`
        SELECT id, email, name, created_at, last_login
        FROM   users
        LIMIT  1
    `;

    if (!sample) {
        info('No existing users — skipping id-preservation test (table is empty).');
    } else {
        const originalId = sample.id;
        info(`Testing with existing user: ${sample.email}  id=${originalId}`);

        // Simulate what the controller does: upsert with a NEW random id but same email
        const fakeId = crypto.randomUUID();
        const now    = new Date().toISOString();

        const [after] = await sql`
            INSERT INTO users (id, email, name, created_at, last_login)
            VALUES (${fakeId}, ${sample.email}, ${sample.name}, ${now}, ${now})
            ON CONFLICT (email)
            DO UPDATE SET last_login = EXCLUDED.last_login
            RETURNING id, email, last_login
        `;

        if (after.id === originalId) {
            ok(`id preserved correctly: ${after.id}`);
            ok(`last_login updated to:  ${after.last_login}`);
        } else {
            err(`id was OVERWRITTEN!  was=${originalId}  now=${after.id}`);
            // Restore
            await sql`UPDATE users SET id=${originalId} WHERE email=${sample.email}`;
            err('Rolled back id to original — DO UPDATE in controller must not include id in the SET clause.');
        }
    }

    // ── 6. Live HTTP test against the running dev server ─────────────────────
    section('6. Live /api/v1/users/sync tests (requires dev server on :3000)');

    const BASE = 'http://localhost:3000/api/v1/users';

    async function syncCall(payload) {
        try {
            const res = await fetch(`${BASE}/sync`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload),
            });
            const json = await res.json();
            return { status: res.status, json };
        } catch {
            return null;   // dev server not running
        }
    }

    // Test A — existing email (should update, not create)
    if (sample) {
        const r = await syncCall({ email: sample.email });
        if (!r) {
            info('Dev server not reachable — skipping live HTTP tests.');
        } else {
            info(`[existing] status=${r.status}  created=${r.json.created}  data.email=${r.json.data?.email}`);
            if (r.json.success && r.json.created === false) {
                ok('Existing user: upsert updated correctly, no duplicate created.');
            } else if (r.json.success && r.json.created === true) {
                err('Existing user was treated as new — possible id-overwrite scenario!');
            } else {
                err(`Unexpected response: ${JSON.stringify(r.json)}`);
            }
        }
    }

    // Test B — brand new email
    const testEmail = `sync-test-${Date.now()}@mjdecors-verify.local`;
    const r2 = await syncCall({ email: testEmail });
    if (r2) {
        info(`[new user] status=${r2.status}  created=${r2.json.created}  data.email=${r2.json.data?.email}`);
        if (r2.json.success && r2.json.created === true) {
            ok('New user: inserted correctly.');
            // Clean up test row
            await sql`DELETE FROM users WHERE email = ${testEmail}`;
            ok('Test row cleaned up.');
        } else if (r2.json.success && r2.json.created === false) {
            info('Row existed already (previous test run?) — upsert still succeeded.');
            await sql`DELETE FROM users WHERE email = ${testEmail}`;
        } else {
            err(`New-user sync failed: ${JSON.stringify(r2.json)}`);
        }
    }

    // ── 7. admin/accounts endpoint smoke-check ────────────────────────────────
    section('7. /api/v1/users smoke-check (admin accounts list)');

    try {
        const res = await fetch(`${BASE}?page=1&limit=5`);
        const json = await res.json();
        if (json.success) {
            ok(`GET /api/v1/users returned ${json.data.length} rows, total=${json.pagination?.total}`);
        } else {
            err(`GET /api/v1/users failed: ${json.message}`);
        }
    } catch {
        info('Dev server not reachable — skipping admin list check.');
    }

    section('Done');
    console.log('');

} catch (e) {
    console.error('\nFatal error:', e.message);
    process.exit(1);
} finally {
    await sql.end();
}
