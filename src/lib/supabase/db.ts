// src/lib/supabase/db.ts
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { createClient } from "@supabase/supabase-js"

// ── Products ──────────────────────────────────────────────────
import { blindsProducts } from "@/schema/products/blinds/blinds-product"
import { blindsProductImages } from "@/schema/products/blinds/blinds-product-image"
import { blindsProductColors } from "@/schema/products/blinds/blinds-product-colors"
import * as blindsRelations from "@/schema/products/blinds/blinds-product-relations"

// ── Auth / Staff ──────────────────────────────────────────────
import { admins } from "@/schema/admin/admins"
import { employees } from "@/schema/employees/employees"
import { employeesRelations } from "@/schema/employees/employees"
import { otpCodes } from "@/schema/otp/otp-code"

// ─────────────────────────────────────────────────────────────
// Postgres client
// ssl: "require" is needed for Supabase's pooled connection.
// ─────────────────────────────────────────────────────────────
const client = postgres(process.env.DATABASE_URL!, { ssl: "require" })

// ─────────────────────────────────────────────────────────────
// Drizzle DB instance
// Every table that you want to query with db.query.* MUST be
// listed here. Missing entries cause "relation not found" errors.
// ─────────────────────────────────────────────────────────────
export const db = drizzle(client, {
  schema: {
    // Products / Blinds
    blindsProducts,
    blindsProductImages,
    blindsProductColors,
    ...blindsRelations,

    // Staff
    admins,
    employees,
    employeesRelations,

    // OTP
    otpCodes,
  },
})

// ─────────────────────────────────────────────────────────────
// Supabase Admin client
// Only used for privileged server-side operations (e.g. creating
// auth users from an admin panel). Never expose to the client.
// ─────────────────────────────────────────────────────────────
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)