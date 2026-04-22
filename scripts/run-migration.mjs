import postgres from 'postgres';

const DATABASE_URL = 'postgresql://postgres.zhafnwjqkhhoorzpxvhs:YusXuAyKgM3KJeDC@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

const sql = postgres(DATABASE_URL, { max: 1 });

try {
  console.log('Adding target_role column to notifications...');
  await sql`
    ALTER TABLE "notifications"
    ADD COLUMN IF NOT EXISTS "target_role" text NOT NULL DEFAULT 'customer'
  `;
  console.log('✅ Done! target_role column added (or already existed).');
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
} finally {
  await sql.end();
}
