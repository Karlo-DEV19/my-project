/**
 * One-shot script: runs the product_options migration directly.
 * Usage: node scripts/run-migration.mjs
 */
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

const migrationSQL = readFileSync(
  resolve(__dirname, '../drizzle/migrations/0006_add_product_options_table.sql'),
  'utf8'
);

try {
  console.log('▶ Running migration 0006...');
  await sql.unsafe(migrationSQL);
  console.log('✅ Migration applied: product_options table created.');
} catch (err) {
  if (err.code === '42P07') {
    console.log('ℹ️  Table already exists — skipping.');
  } else {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
} finally {
  await sql.end();
}
