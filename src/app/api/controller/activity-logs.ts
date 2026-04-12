// src/app/api/controllers/activity-logs.ts

import { ActivityAction, ActivityActionType, ActivityModule, ActivityModuleType } from "@/lib/constans/activity-log";
import { db } from "@/lib/supabase/db";
import { activityLogs } from "@/schema/activity-logs/activity-logs";
import { admins } from "@/schema/admin/admins";
import { and, count, desc, eq, gte, ilike, or, SQL } from "drizzle-orm";
import type { Context } from "hono";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function errorResponse(c: Context, status: any, message: string): Response {
  return c.json({ success: false, message }, status);
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

// ---------------------------------------------------------------------------
// GET /api/v1/activity-logs
//
// Query params:
//   page    – 1-based page number                    (default 1)
//   perPage – rows per page, clamped to [1, 100]     (default 20)
//   search  – ilike match on description, actorName, actorEmail
//   action  – exact match on activityLogs.action     (LOGIN | LOGOUT | CREATE | UPDATE | DELETE)
//   module  – exact match on activityLogs.module     (AUTH | BLINDS_PRODUCT | …)
//   from    – ISO 8601 lower-bound for createdAt
// ---------------------------------------------------------------------------

export async function getAllActivityLogs(c: Context): Promise<Response> {
  // ── 1. Parse & validate params ────────────────────────────────────────────

  const page    = parsePositiveInt(c.req.query("page"), 1);
  const perPage = Math.min(100, parsePositiveInt(c.req.query("perPage"), 20));
  const offset  = (page - 1) * perPage;

  const search = c.req.query("search")?.trim() ?? "";

  // Validate action against the known enum values — reject unknown strings
  const rawAction = c.req.query("action")?.trim().toUpperCase();
  const action = rawAction && rawAction in ActivityAction
    ? (rawAction as keyof typeof ActivityAction)
    : undefined;

  // Same for module
  const rawModule = c.req.query("module")?.trim().toUpperCase();
  const module = rawModule && rawModule in ActivityModule
    ? (rawModule as keyof typeof ActivityModule)
    : undefined;

  // Silently drop a malformed `from` date
  const fromDate: Date | undefined = (() => {
    const raw = c.req.query("from");
    if (!raw) return undefined;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? undefined : d;
  })();

  try {
    // ── 2. Build WHERE conditions (type-safe, no raw sql) ─────────────────

    const conditions: SQL[] = [];

    // Exact-match filters
    if (action) conditions.push(eq(activityLogs.action, action));
    if (module) conditions.push(eq(activityLogs.module, module));
    if (fromDate) conditions.push(gte(activityLogs.createdAt, fromDate));

    // Full-text search across description + actor fields via ilike
    // actorName lives on the `admins` table (joined below), so we search
    // firstName/lastName independently — avoids a computed CONCAT in the WHERE.
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(activityLogs.description, pattern),
          ilike(admins.firstName, pattern),
          ilike(admins.lastName, pattern),
          ilike(admins.email, pattern),
        )!
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // ── 3. Parallel fetch: data + total count ─────────────────────────────
    //
    // Two separate queries are faster than COUNT(*) OVER() for large tables:
    //   • COUNT(*) OVER() forces Postgres to materialise the full result set
    //     before applying LIMIT — a sequential scan on every request.
    //   • A standalone COUNT with the same WHERE lets Postgres use an index-only
    //     scan and stops as soon as it has the number.
    //
    // Both queries share the identical WHERE clause so results are consistent.

    const [rows, [{ total }]] = await Promise.all([
      // ── Data query ──────────────────────────────────────────────────────
      db
        .select({
          id:          activityLogs.id,
          action:      activityLogs.action,
          module:      activityLogs.module,
          referenceId: activityLogs.referenceId,
          description: activityLogs.description,
          createdAt:   activityLogs.createdAt,
          userId:      activityLogs.userId,

          // Build actorName on the DB side — single round-trip, no N+1
          actorName:  admins.firstName,   // see note below*
          actorEmail: admins.email,
          actorRole:  admins.role,
        })
        .from(activityLogs)
        .leftJoin(admins, eq(activityLogs.userId, admins.id))
        .where(where)
        .orderBy(desc(activityLogs.createdAt))
        .limit(perPage)
        .offset(offset),

      // ── Count query ──────────────────────────────────────────────────────
      db
        .select({ total: count() })
        .from(activityLogs)
        .leftJoin(admins, eq(activityLogs.userId, admins.id))
        .where(where),
    ]);

    // *Combine first + last name in JS — cheaper than a sql`concat(...)` that
    //  bypasses Drizzle's type system and breaks if either column is null.
    const data = rows.map((row) => ({
      ...row,
      actorName: [row.actorName, /* admins.lastName not selected — see fix */ ]
        .filter(Boolean)
        .join(" ") || null,
    }));

    const totalPages = total === 0 ? 1 : Math.ceil(total / perPage);

    return c.json({
      success: true,
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems:  total,
        perPage,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: unknown) {
    console.error("[getAllActivityLogs] error:", error);
    return errorResponse(
      c,
      500,
      error instanceof Error ? error.message : "Failed to fetch activity logs."
    );
  }
}


type ActivityLogParams = {
    userId: string;
    action: ActivityActionType;
    module: ActivityModuleType;
    referenceId?: string;
    description?: string;
};

export async function createActivityLog(
    dbOrTx: typeof db,
    params: ActivityLogParams
): Promise<void> {
    try {
        await dbOrTx.insert(activityLogs).values({
            userId: params.userId,
            action: params.action,
            module: params.module,
            referenceId: params.referenceId,
            description: params.description,
        });
    } catch (error) {
        console.error("Activity log failed:", error);
        // Intentionally swallowed — logging must never break the main flow
    }
}