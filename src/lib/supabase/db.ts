// src/lib/supabase/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

// Import all your blinds schema tables using @ alias
//products/blinds
import { blindsProducts } from "@/schema/products/blinds/blinds-product";
import { blindsProductImages } from "@/schema/products/blinds/blinds-product-image";
import { blindsProductColors } from "@/schema/products/blinds/blinds-product-colors";
import * as blindsRelations from "@/schema/products/blinds/blinds-product-relations";
//admin/admins
import { admins } from "@/schema/admin/admins";

// Create Postgres client
const client = postgres(process.env.DATABASE_URL!, { ssl: "require" });

// Export Drizzle DB client
// Including schema allows you to use the relations queries: db.query.blindsProducts.findMany({ with: { images: true, colors: true } })
export const db = drizzle(client, {
  schema: {
    //products/blinds
    blindsProducts,
    blindsProductImages,
    blindsProductColors,
    ...blindsRelations,
    //admins
    admins
  },
});

// Supabase client for admin operations
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);