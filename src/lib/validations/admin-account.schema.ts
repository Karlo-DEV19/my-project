import { z } from 'zod';

// Used by the Admin Accounts page "Add Account" modal.
// Intentionally separate from the customer-facing account.schema.ts.
export const adminAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

export type AdminAccountFormValues = z.infer<typeof adminAccountSchema>;

// ─── GET /api/v1/users query params ───────────────────────────────────────────

export const MONTH_FILTERS = ['all', 'this_month', 'last_month'] as const;
export type MonthFilter = (typeof MONTH_FILTERS)[number];

export const getUsersQuerySchema = z.object({
  // Optional free-text search — matched against name and email (case-insensitive).
  search: z.string().optional(),
  // Optional month filter on created_at. 'all' means no date filter.
  month: z.enum(MONTH_FILTERS).optional(),
  // Pagination
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;

// ─── POST /api/v1/users/sync ──────────────────────────────────────────────────
// Used after Magic Link login — upserts a customer by email.
// id:   Supabase auth user UUID — used as the row PK on insert.
// name: optional, sourced from Supabase user_metadata when available.

export const syncUserSchema = z.object({
  id:    z.string().uuid().optional(),
  email: z.string().email('Invalid email address'),
  name:  z.string().min(1).optional(),
});

export type SyncUserPayload = z.infer<typeof syncUserSchema>;
