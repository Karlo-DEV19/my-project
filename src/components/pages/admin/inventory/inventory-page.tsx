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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type InventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";

type InventoryItem = {
  id: string;
  name: string;
  stockQty: number;
  status: InventoryStatus;
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

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "INV-1101", name: "Evergreen Blackout Blinds",  stockQty: 32, status: "In Stock"     },
  { id: "INV-1102", name: "Sunrise Sheer Curtains",     stockQty: 9,  status: "Low Stock"    },
  { id: "INV-1103", name: "Phantom Roller Shades",      stockQty: 0,  status: "Out of Stock" },
  { id: "INV-1104", name: "Modern Daylight Shades",     stockQty: 18, status: "In Stock"     },
  { id: "INV-1105", name: "Blackout Premium Panels",    stockQty: 4,  status: "Low Stock"    },
  { id: "INV-1106", name: "Velvet Drape Curtains",      stockQty: 22, status: "In Stock"     },
  { id: "INV-1107", name: "Bamboo Roman Shades",        stockQty: 7,  status: "Low Stock"    },
  { id: "INV-1108", name: "Arctic White Roller Blinds", stockQty: 0,  status: "Out of Stock" },
  { id: "INV-1109", name: "Linen Sheer Panels",         stockQty: 14, status: "In Stock"     },
  { id: "INV-1110", name: "Charcoal Blackout Curtains", stockQty: 3,  status: "Low Stock"    },
  { id: "INV-1111", name: "Ivory Cellular Shades",      stockQty: 25, status: "In Stock"     },
  { id: "INV-1112", name: "Nautical Stripe Drapes",     stockQty: 0,  status: "Out of Stock" },
];

const ITEMS_PER_PAGE = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPagination(total: number, page: number, limit: number): Pagination {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage   = Math.min(Math.max(1, page), totalPages);
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

const statusStyles: Record<InventoryStatus, string> = {
  "In Stock":     "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "Low Stock":    "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "Out of Stock": "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
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

const FILTER_OPTIONS: Array<InventoryStatus | "All"> = [
  "All",
  "In Stock",
  "Low Stock",
  "Out of Stock",
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [query, setQuery]               = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | "All">("All");
  const [page, setPage]                 = useState(1);

  // 1. Filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_INVENTORY.filter((item) => {
      const matchesQuery  = !q || item.name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  // 2. Build pagination object
  const pagination = useMemo<Pagination>(
    () => buildPagination(filtered.length, page, ITEMS_PER_PAGE),
    [filtered.length, page]
  );

  // 3. Slice for current page
  const paginated = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filtered.slice(start, start + pagination.limit);
  }, [filtered, pagination.page, pagination.limit]);

  // Reset to page 1 whenever filters change
  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setPage(1);
  }

  function handleStatusChange(v: string) {
    setStatusFilter(v as InventoryStatus | "All");
    setPage(1);
  }

  return (
    // ── Full-width page wrapper ──────────────────────────────────────────
    <div className="w-full min-h-screen bg-background">
      <div className="w-full max-w-[1400px] mx-auto px-6 py-8 space-y-6">

        {/* ── Page Header ── */}
        <AdminPageHeader
          title="Inventory Management"
          description="Monitor product stock levels. Search and filters are UI-only for now."
        />

        {/* ── Filters row ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={handleQueryChange}
                placeholder="Search products…"
                className="h-9 rounded-none pl-10 text-sm"
              />
            </div>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-9 w-full rounded-none border-border bg-transparent text-sm sm:w-44">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                {FILTER_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="rounded-none text-sm">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {filtered.length} item{filtered.length === 1 ? "" : "s"}
          </p>
        </div>

        {/* ── Table card ── */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[600px] w-full">

              <TableHeader className="bg-muted/50">
                <TableRow>
                  {["Product", "Stock Qty", "Status"].map((h) => (
                    <TableHead key={h} className="px-5 py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {h}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    {/* Name + ID */}
                    <TableCell className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {item.id}
                        </p>
                      </div>
                    </TableCell>

                    {/* Stock qty with inline stock bar */}
                    <TableCell className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold tabular-nums text-foreground w-6">
                          {item.stockQty}
                        </span>
                        {/* Mini stock bar */}
                        <div className="h-1.5 w-24 rounded-full bg-border overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              item.status === "In Stock"     && "bg-emerald-500",
                              item.status === "Low Stock"    && "bg-amber-400",
                              item.status === "Out of Stock" && "bg-rose-400"
                            )}
                            style={{
                              width: `${Math.min((item.stockQty / 32) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    {/* Status badge */}
                    <TableCell className="px-5 py-3.5">
                      <InventoryStatusBadge status={item.status} />
                    </TableCell>
                  </TableRow>
                ))}

                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="px-6 py-20">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="mb-4 h-px w-10 bg-border" />
                        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          No inventory items found
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground/60">
                          Try adjusting your search or filter.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

            </Table>
          </div>

          {/* ── Pagination Footer ── */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3.5">

              {/* Left: range */}
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
                items
              </p>

              {/* Right: controls */}
              <div className="flex items-center gap-1">
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
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
    </div>
  );
}