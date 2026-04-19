// scripts/add-stock-column.mjs
// Run with: node scripts/add-stock-column.mjs
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
      // Strip surrounding quotes (single or double)
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
  console.log("⏳  Checking if 'stock' column already exists...");

  const [row] = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'blinds_products'
      AND column_name = 'stock'
  `;

  if (row) {
    console.log("✅  Column 'stock' already exists — no action needed.");
  } else {
    console.log("➕  Adding 'stock' column to blinds_products...");
    await sql`ALTER TABLE blinds_products ADD COLUMN stock integer NOT NULL DEFAULT 0`;
    console.log("✅  Column 'stock' added successfully!");
  }
} catch (err) {
  console.error("❌  Migration failed:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
