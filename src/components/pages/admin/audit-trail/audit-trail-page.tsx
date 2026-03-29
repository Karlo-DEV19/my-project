"use client";

import React, { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import AdminPageHeader from "@/components/pages/admin/components/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuditEvent = {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  severity: "Info" | "Warning";
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_AUDIT: AuditEvent[] = [
  { id: "AUD-3001", action: "Admin deleted product",          user: "Admin", timestamp: "2026-03-18 09:12:04", severity: "Warning" },
  { id: "AUD-3002", action: "Admin updated price",            user: "Admin", timestamp: "2026-03-18 09:26:41", severity: "Info"    },
  { id: "AUD-3003", action: "Staff updated stock quantity",   user: "Staff", timestamp: "2026-03-18 09:44:10", severity: "Info"    },
  { id: "AUD-3004", action: "Admin updated product details",  user: "Admin", timestamp: "2026-03-18 10:03:29", severity: "Info"    },
  { id: "AUD-3005", action: "Admin deleted product image",    user: "Admin", timestamp: "2026-03-18 10:18:55", severity: "Warning" },
  { id: "AUD-3006", action: "Staff added new product",        user: "Staff", timestamp: "2026-03-18 10:35:12", severity: "Info"    },
  { id: "AUD-3007", action: "Admin changed user permissions", user: "Admin", timestamp: "2026-03-18 11:00:00", severity: "Warning" },
  { id: "AUD-3008", action: "Staff updated product images",   user: "Staff", timestamp: "2026-03-18 11:14:33", severity: "Info"    },
  { id: "AUD-3009", action: "Admin bulk deleted orders",      user: "Admin", timestamp: "2026-03-18 11:29:08", severity: "Warning" },
  { id: "AUD-3010", action: "Staff updated shipping details", user: "Staff", timestamp: "2026-03-18 11:45:50", severity: "Info"    },
  { id: "AUD-3011", action: "Admin exported customer data",   user: "Admin", timestamp: "2026-03-18 12:02:17", severity: "Warning" },
  { id: "AUD-3012", action: "Staff closed support ticket",    user: "Staff", timestamp: "2026-03-18 12:18:44", severity: "Info"    },
];

const ITEMS_PER_PAGE = 5;

const SEVERITY_OPTIONS: Array<AuditEvent["severity"] | "All"> = ["All", "Info", "Warning"];
const USER_OPTIONS = ["All", "Admin", "Staff"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPagination(total: number, page: number, limit: number): Pagination {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    page: safePage,
    limit,
    total,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const severityStyles: Record<AuditEvent["severity"], string> = {
  Info:    "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  Warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

function SeverityBadge({ severity }: { severity: AuditEvent["severity"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
        severityStyles[severity]
      )}
    >
      {severity}
    </Badge>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuditTrailPage() {
  const [query, setQuery]                   = useState("");
  const [severityFilter, setSeverityFilter] = useState<AuditEvent["severity"] | "All">("All");
  const [userFilter, setUserFilter]         = useState("All");
  const [page, setPage]                     = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_AUDIT.filter((event) => {
      const matchesQuery    = !q || event.action.toLowerCase().includes(q) || event.id.toLowerCase().includes(q);
      const matchesSeverity = severityFilter === "All" || event.severity === severityFilter;
      const matchesUser     = userFilter === "All" || event.user === userFilter;
      return matchesQuery && matchesSeverity && matchesUser;
    });
  }, [query, severityFilter, userFilter]);

  const pagination = useMemo<Pagination>(
    () => buildPagination(filtered.length, page, ITEMS_PER_PAGE),
    [filtered.length, page]
  );

  const paginated = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filtered.slice(start, start + pagination.limit);
  }, [filtered, pagination.page, pagination.limit]);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setPage(1);
  }

  function handleSeverityChange(v: string) {
    setSeverityFilter(v as AuditEvent["severity"] | "All");
    setPage(1);
  }

  function handleUserChange(v: string) {
    setUserFilter(v);
    setPage(1);
  }

  return (
    <section className="flex min-h-screen w-full flex-col bg-background/60">
      <div className="flex flex-1 flex-col gap-6 px-6 py-6 xl:px-10">
        <AdminPageHeader
          title="Audit Trail"
          description="High-signal record of important admin actions. Mock data only for now."
        />

        {/* ── Filters ── */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={handleQueryChange}
                placeholder="Search actions or ID…"
                className="h-11 rounded-none pl-10"
              />
            </div>

            {/* Severity filter */}
            <Select value={severityFilter} onValueChange={handleSeverityChange}>
              <SelectTrigger className="h-11 w-full rounded-none border-border bg-transparent text-sm sm:w-[180px]">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                {SEVERITY_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="rounded-none">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* User filter */}
            <Select value={userFilter} onValueChange={handleUserChange}>
              <SelectTrigger className="h-11 w-full rounded-none border-border bg-transparent text-sm sm:w-[180px]">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                {USER_OPTIONS.map((u) => (
                  <SelectItem key={u} value={u} className="rounded-none">{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {filtered.length} event{filtered.length === 1 ? "" : "s"}
          </p>
        </div>

        {/* ── Timeline Card ── */}
        <div className="w-full rounded-xl border border-border bg-card/80 p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Activity Timeline
            </h2>
            <p className="text-xs text-muted-foreground">
              Actions are ordered from newest to oldest.
            </p>
          </div>

          <div className="mt-6">
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 h-px w-12 bg-border" />
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  No audit events found
                </p>
                <p className="mt-2 text-xs text-muted-foreground/70">
                  Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              <ol className="relative ml-3 space-y-6 border-l border-border pl-6">
                {paginated.map((event) => (
                  <li key={event.id} className="relative">
                    <div className="absolute -left-[29px] top-1.5 h-3 w-3 rounded-full border border-border bg-background shadow-sm" />

                    <div className="rounded-lg border border-border bg-background/40 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {event.action}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/80">
                              {event.user}
                            </span>
                            <span className="text-muted-foreground/60">•</span>
                            <span className="font-mono">{event.timestamp}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={event.severity} />
                          <span className="font-mono text-[11px] text-muted-foreground/70">
                            {event.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* ── Pagination Footer ── */}
          {pagination.total > 0 && (
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>
                {" "}–{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>
                {" "}of{" "}
                <span className="font-semibold text-foreground">
                  {pagination.total}
                </span>{" "}
                events
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-none"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        "h-8 w-8 rounded-none text-xs font-semibold transition-colors",
                        p === pagination.page
                          ? "bg-primary text-primary-foreground"
                          : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-none"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}