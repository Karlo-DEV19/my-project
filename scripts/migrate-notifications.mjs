// scripts/migrate-notifications.mjs
// Run with: node scripts/migrate-notifications.mjs
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local manually ──────────────────────────────────────────────────
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      const key = line.slice(0, idx).trim();
      const raw = line.slice(idx + 1).trim();
      const value = raw.replace(/^['"]|['"]$/g, "");
      return [key, value];
    })
);

const DATABASE_URL = env["DATABASE_URL"];
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

try {
  console.log("⏳  Checking notifications table columns...");

  const rows = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'notifications'
      AND column_name IN ('user_id', 'type')
  `;

  const existing = rows.map((r) => r.column_name);
  const needsUserId = !existing.includes("user_id");
  const needsType   = !existing.includes("type");

  if (!needsUserId && !needsType) {
    console.log("✅  Both columns already exist — no action needed.");
  } else {
    if (needsUserId) {
      console.log("➕  Adding 'user_id' column to notifications...");
      await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID`;
      console.log("✅  user_id added.");
    }
    if (needsType) {
      console.log("➕  Adding 'type' column to notifications...");
      await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'system'`;
      console.log("✅  type added.");
    }
    console.log("🎉  Migration complete!");
  }
} catch (err) {
  console.error("❌  Migration failed:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
