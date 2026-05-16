import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

try {
    // 1. Add the column if it doesn't already exist
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login timestamptz`;
    console.log('✅  last_login column added (or already existed).');

    // 2. Signal PostgREST to reload its schema cache so the new column is visible
    //    to supabaseAdmin.from('users') without restarting the Supabase service.
    await sql`NOTIFY pgrst, 'reload schema'`;
    console.log('✅  PostgREST schema cache reload signal sent.');
} catch (err) {
    console.error('❌  Failed:', err.message);
    process.exit(1);
} finally {
    await sql.end();
}
