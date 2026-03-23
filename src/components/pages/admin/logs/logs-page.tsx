"use client";

import React, { useState, useMemo, useCallback } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LogStatus = "Success" | "Error";

type SystemLog = {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  status: LogStatus;
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

const ALL_LOGS: SystemLog[] = [
  { id: "LOG-9001", timestamp: "2026-03-18 10:14:32", action: "Product Created",   user: "Admin", status: "Success" },
  { id: "LOG-9002", timestamp: "2026-03-18 10:22:01", action: "Order Updated",     user: "Staff", status: "Success" },
  { id: "LOG-9003", timestamp: "2026-03-18 10:33:47", action: "User Login",        user: "Admin", status: "Success" },
  { id: "LOG-9004", timestamp: "2026-03-18 10:41:09", action: "Order Updated",     user: "Admin", status: "Error"   },
  { id: "LOG-9005", timestamp: "2026-03-18 10:56:18", action: "Product Created",   user: "Admin", status: "Success" },
  { id: "LOG-9006", timestamp: "2026-03-18 11:03:55", action: "User Logout",       user: "Staff", status: "Success" },
  { id: "LOG-9007", timestamp: "2026-03-18 11:11:22", action: "Product Deleted",   user: "Admin", status: "Error"   },
  { id: "LOG-9008", timestamp: "2026-03-18 11:20:47", action: "Order Created",     user: "Staff", status: "Success" },
  { id: "LOG-9009", timestamp: "2026-03-18 11:29:14", action: "Password Reset",    user: "Admin", status: "Success" },
  { id: "LOG-9010", timestamp: "2026-03-18 11:37:39", action: "Bulk Import",       user: "Admin", status: "Error"   },
  { id: "LOG-9011", timestamp: "2026-03-18 11:45:02", action: "Order Cancelled",   user: "Staff", status: "Success" },
  { id: "LOG-9012", timestamp: "2026-03-18 11:53:27", action: "Product Updated",   user: "Admin", status: "Success" },
  { id: "LOG-9013", timestamp: "2026-03-18 12:01:44", action: "User Login",        user: "Staff", status: "Error"   },
  { id: "LOG-9014", timestamp: "2026-03-18 12:10:09", action: "Report Generated",  user: "Admin", status: "Success" },
  { id: "LOG-9015", timestamp: "2026-03-18 12:18:33", action: "Settings Updated",  user: "Admin", status: "Success" },
  { id: "LOG-9016", timestamp: "2026-03-18 12:26:58", action: "Order Refunded",    user: "Staff", status: "Success" },
  { id: "LOG-9017", timestamp: "2026-03-18 12:35:21", action: "Product Created",   user: "Staff", status: "Error"   },
  { id: "LOG-9018", timestamp: "2026-03-18 12:43:46", action: "Webhook Triggered", user: "Admin", status: "Success" },
  { id: "LOG-9019", timestamp: "2026-03-18 12:52:10", action: "Email Sent",        user: "Admin", status: "Error"   },
  { id: "LOG-9020", timestamp: "2026-03-18 13:00:35", action: "Inventory Synced",  user: "Admin", status: "Success" },
];

const PAGE_LIMIT = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPagination(page: number, limit: number, total: number): Pagination {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const statusStyles: Record<LogStatus, string> = {
  Success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Error:   "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

function LogStatusBadge({ status }: { status: LogStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
        statusStyles[status]
      )}
    >
      {status}
    </Badge>
  );
}

function PaginationBar({ pagination, onPageChange }: { pagination: Pagination; onPageChange: (p: number) => void }) {
  const { page, totalPages, hasPrevPage, hasNextPage, total, limit } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  // Build page numbers to show (max 5 slots)
  const pages: (number | "…")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3)           pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}–{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span> logs
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={!hasPrevPage}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground select-none">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "secondary" : "ghost"}
              size="icon"
              className={cn("h-7 w-7 text-xs", p === page && "pointer-events-none font-semibold")}
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </Button>
          )
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={!hasNextPage}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | LogStatus>("All");
  const [page,         setPage]         = useState(1);

  // Filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_LOGS.filter((log) => {
      const matchesStatus = statusFilter === "All" || log.status === statusFilter;
      const matchesSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.user.toLowerCase().includes(q)   ||
        log.id.toLowerCase().includes(q)     ||
        log.timestamp.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter]);

  // Pagination
  const pagination = useMemo(
    () => buildPagination(page, PAGE_LIMIT, filtered.length),
    [page, filtered.length]
  );

  const pageLogs = useMemo(
    () => filtered.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT),
    [filtered, page]
  );

  // Reset to page 1 whenever filters change
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleStatusFilter = useCallback((val: string) => {
    setStatusFilter(val as "All" | LogStatus);
    setPage(1);
  }, []);

  return (
    <section className="min-h-screen bg-background/60">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <AdminPageHeader
          title="Logs"
          description="System activity logs for quick troubleshooting and monitoring."
        />

        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by action, user, ID…"
              value={search}
              onChange={handleSearch}
              className="pl-8 text-sm"
            />
          </div>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-36 text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              <SelectItem value="Success">Success</SelectItem>
              <SelectItem value="Error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-xl border border-border bg-card/80 shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead className="px-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Timestamp
                    </span>
                  </TableHead>
                  <TableHead className="px-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Action
                    </span>
                  </TableHead>
                  <TableHead className="px-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      User
                    </span>
                  </TableHead>
                  <TableHead className="px-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Status
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                      No logs match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {log.timestamp}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm font-medium text-foreground">
                        {log.action}
                        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground/70">
                          {log.id}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {log.user}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <LogStatusBadge status={log.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          <div className="border-t border-border">
            <PaginationBar pagination={pagination} onPageChange={setPage} />
          </div>
        </div>
      </div>
    </section>
  );
}