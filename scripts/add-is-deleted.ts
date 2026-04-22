/**
 * One-time migration: add is_deleted column to blinds_products for soft delete.
 * Run with:  npx tsx scripts/add-is-deleted.ts
 */
import { config } from "dotenv";
import path from "path";

// Load .env.local synchronously before anything else
config({ path: path.resolve(process.cwd(), ".env.local") });

// Use require so it resolves AFTER dotenv has populated process.env
// eslint-disable-next-line @typescript-eslint/no-require-imports
const postgres = require("postgres");

async function run() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("❌ DATABASE_URL not found in .env.local");
        process.exit(1);
    }

    const sql = postgres(url, { ssl: "require", max: 1 });

    try {
        console.log("▶ Adding is_deleted column to blinds_products...");
        await sql`
            ALTER TABLE blinds_products
            ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false
        `;
        console.log("✅ Migration complete — is_deleted column added (or already existed).");
    } finally {
        await sql.end();
    }
}

run()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Migration failed:", err.message ?? err);
        process.exit(1);
    });
