/**
 * One-time data fix:
 * When `target_role` column was added via migration, all pre-existing rows
 * got the default value of 'customer'. This script corrects them by setting
 * the right target_role based on the notification type.
 *
 * Run: node scripts/fix-notification-target-roles.mjs
 */
import postgres from 'postgres';

const DATABASE_URL =
  'postgresql://postgres.zhafnwjqkhhoorzpxvhs:YusXuAyKgM3KJeDC@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

const sql = postgres(DATABASE_URL, { max: 1 });

try {
  // 1. Admin types: NEW_ORDER
  const adminFix = await sql`
    UPDATE notifications
    SET    target_role = 'admin'
    WHERE  type = 'NEW_ORDER'
      AND  target_role != 'admin'
    RETURNING id, type, target_role
  `;
  console.log(`✅ Fixed ${adminFix.length} NEW_ORDER row(s) → target_role = 'admin'`);

  // 2. Customer types: NEW_ARRIVAL, ORDER_CONFIRMED, DELIVERY_UPDATE, security
  const customerFix = await sql`
    UPDATE notifications
    SET    target_role = 'customer'
    WHERE  type IN ('NEW_ARRIVAL', 'ORDER_CONFIRMED', 'DELIVERY_UPDATE', 'security')
      AND  target_role != 'customer'
    RETURNING id, type, target_role
  `;
  console.log(`✅ Fixed ${customerFix.length} customer-type row(s) → target_role = 'customer'`);

  // 3. Show current distribution
  const summary = await sql`
    SELECT target_role, type, COUNT(*) AS count
    FROM   notifications
    GROUP  BY target_role, type
    ORDER  BY target_role, type
  `;
  console.log('\n📊 Current notifications table:');
  console.table(summary);
} catch (err) {
  console.error('❌ Fix failed:', err.message);
  process.exit(1);
} finally {
  await sql.end();
}
