// src/lib/supabase/db.ts
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { createClient } from "@supabase/supabase-js"

const client = postgres(process.env.DATABASE_URL!, { ssl: "require" })
export const db = drizzle(client)

// Optional: Export Supabase client for reuse
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