import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

try {
    await sql`ALTER TABLE blinds_products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false`;
    console.log('✅ SUCCESS: is_deleted column added to blinds_products (or already existed)');
} catch (err) {
    console.error('❌ ERROR:', err.message);
    process.exit(1);
} finally {
    await sql.end();
}
