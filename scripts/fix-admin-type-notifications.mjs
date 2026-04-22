import postgres from 'postgres';

const sql = postgres(
  'postgresql://postgres.zhafnwjqkhhoorzpxvhs:YusXuAyKgM3KJeDC@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
  { max: 1 }
);

try {
  // Old code stored type='admin' for new-order notifications.
  // These must be tagged target_role='admin' so they stop leaking into the customer feed.
  const fixed = await sql`
    UPDATE notifications
    SET    target_role = 'admin'
    WHERE  type = 'admin'
      AND  target_role != 'admin'
    RETURNING id, type, target_role
  `;
  console.log(`✅ Fixed ${fixed.length} row(s): type='admin' → target_role='admin'`);

  // Verify final state
  const summary = await sql`
    SELECT target_role, type, COUNT(*) AS count
    FROM   notifications
    GROUP  BY target_role, type
    ORDER  BY target_role, type
  `;
  console.log('\n📊 Notifications after fix:');
  console.table(summary);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
} finally {
  await sql.end();
}
