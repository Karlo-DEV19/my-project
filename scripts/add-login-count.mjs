/**
 * add-login-count.mjs
 *
 * Idempotent — safe to re-run at any time.
 * Adds login_count (integer NOT NULL DEFAULT 0) to public.users
 * and notifies PostgREST to reload its schema cache.
 *
 * Run with:  node scripts/add-login-count.mjs
 */

import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

try {
    await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS login_count integer NOT NULL DEFAULT 0
    `;
    console.log('✅  login_count column added (or already existed).');

    await sql`NOTIFY pgrst, 'reload schema'`;
    console.log('✅  PostgREST schema cache reload signal sent.');
} catch (err) {
    console.error('❌  Failed:', err.message);
    process.exit(1);
} finally {
    await sql.end();
}
