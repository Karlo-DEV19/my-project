/**
 * One-time migration: add user_id and type columns to the
 * existing notifications table.
 *
 * Run with:  npx tsx scripts/migrate-notifications.ts
 */
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

import { db } from "@/lib/supabase/db";
import { sql } from "drizzle-orm";

async function run() {
    console.log("▶ Adding user_id and type columns to notifications table...");

    await db.execute(sql`
        ALTER TABLE notifications
            ADD COLUMN IF NOT EXISTS user_id  UUID,
            ADD COLUMN IF NOT EXISTS type     TEXT NOT NULL DEFAULT 'system';
    `);

    console.log("✅ Migration complete.");
    process.exit(0);
}

run().catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
