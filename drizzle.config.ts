// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import path from "path";

// Load environment variables
config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
    schema: [
        "./src/schema/admin/admins.ts",
        "./src/schema/products/blinds/blinds-product.ts",
        "./src/schema/products/blinds/blinds-product-image.ts",
        "./src/schema/products/blinds/blinds-product-colors.ts",
        "./src/schema/products/blinds/blinds-product-relations.ts",
        "./src/schema/otp/otp-code.ts",
        "./src/schema/orders/orders.ts",
        "./src/schema/orders/payment-history/payment-history.ts",
        "./src/schema/activity-logs/activity-logs.ts",
        "./src/schema/notifications/notifications.schema.ts",
        "./src/schema/compositions/compositions.ts",
        "./src/schema/product-options/product-options.ts",
    ],
    out: "./drizzle/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL ?? "",
    },
    verbose: true,
    strict: true,
});