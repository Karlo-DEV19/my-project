// src/app/api/controllers/activity-logs.ts
import { db } from "@/lib/supabase/db";
import { activityLogs } from "@/schema/activity-logs/activity-logs";
import { admins } from "@/schema/admin/admins";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { Context } from "hono";

// ---------------------------------------------------------------------------
// Shared error helper
// ---------------------------------------------------------------------------

function errorResponse(c: Context, status: any, message: string): Response {
    return c.json({ success: false, message }, status);
}

// ---------------------------------------------------------------------------
// GET /api/v1/activity-logs
//
// Query params:
//   page    – 1-based page number           (default 1)
//   limit   – rows per page, max 100        (default 20)
//   search  – substring match across action, module, description (case-insensitive)
//   module  – exact module name             (case-insensitive, e.g. "medicines")
//   from    – ISO 8601 lower-bound for createdAt
//
// All string comparisons use lower() on both sides so "Medicines" == "medicines".
// ---------------------------------------------------------------------------

export async function getAllActivityLogs(c: Context): Promise<Response> {
    // ── Parse & clamp params ───────────────────────────────────────────────

    const page  = Math.max(1, Number(c.req.query("page")  ?? 1));
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") ?? 20)));
    const offset = (page - 1) * limit;

    // Normalise every string filter to lowercase so that case in the DB or in
    // the URL never causes a mismatch ("Medicines" = "medicines" = "MEDICINES").
    const search = (c.req.query("search") ?? "").trim().toLowerCase();
    const module = (c.req.query("module") ?? "").trim().toLowerCase();

    // Validate `from` — silently ignore malformed dates
    const fromDate: Date | undefined = (() => {
        const raw = c.req.query("from");
        if (!raw) return undefined;
        const d = new Date(raw);
        return isNaN(d.getTime()) ? undefined : d;
    })();

    try {
        // ── Build filter clauses ─────────────────────────────────────────
        //
        // We call lower() on both the column and the pattern so we don't rely
        // solely on ilike's collation rules — this works on any Postgres locale.

        const searchFilter = search
            ? sql`(
                lower(${activityLogs.action})      like ${"%" + search + "%"}
             or lower(${activityLogs.module})      like ${"%" + search + "%"}
             or lower(${activityLogs.description}) like ${"%" + search + "%"}
            )`
            : undefined;

        // Exact module equality — lower() on both sides
        const moduleFilter = module
            ? sql`lower(${activityLogs.module}) = ${module}`
            : undefined;

        // Date lower-bound
        const dateFilter = fromDate
            ? gte(activityLogs.createdAt, fromDate)
            : undefined;

        // AND-compose; drizzle `and()` safely ignores undefined operands
        const whereClause = and(searchFilter, moduleFilter, dateFilter);

        // ── Single round-trip fetch with window COUNT ─────────────────────

        const rows = await db
            .select({
                id:          activityLogs.id,
                action:      activityLogs.action,
                module:      activityLogs.module,
                referenceId: activityLogs.referenceId,
                description: activityLogs.description,
                createdAt:   activityLogs.createdAt,

                // Actor resolved via LEFT JOIN — no N+1
                userId:    activityLogs.userId,
                actorName: sql<string | null>`
                    case
                        when ${admins.firstName} is not null
                        then concat(${admins.firstName}, ' ', ${admins.lastName})
                        else null
                    end
                `,
                actorEmail: admins.email,
                actorRole:  admins.role,

                // Total matching rows in one pass — no second query
                _total: sql<number>`cast(count(*) over() as integer)`,
            })
            .from(activityLogs)
            .leftJoin(admins, eq(activityLogs.userId, admins.id))
            .where(whereClause)
            .orderBy(desc(activityLogs.createdAt))
            .limit(limit)
            .offset(offset);  // (page - 1) * limit — always correct

        const total      = rows[0]?._total ?? 0;
        const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

        // Strip the internal window-count column before serialising
        const data = rows.map(({ _total, ...rest }) => rest);

        return c.json({
            success: true,
            data,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems:  total,
                perPage:     limit,
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