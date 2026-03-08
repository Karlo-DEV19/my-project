// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import path from "path";

// Load environment variables
config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
    schema: [
        "./src/schema/admin/admins.ts",

    ],
    out: "./drizzle/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL ?? "",
    },
    verbose: true,
    strict: true,
});