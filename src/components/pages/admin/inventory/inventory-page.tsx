"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import AdminPageHeader from "@/components/pages/admin/components/admin-page-header";
import { Badge } from "@/components/ui/badge";
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

type InventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";

type InventoryItem = {
  id: string;
  name: string;
  stockQty: number;
  status: InventoryStatus;
};

const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: "INV-1101",
    name: "Evergreen Blackout Blinds",
    stockQty: 32,
    status: "In Stock",
  },
  {
    id: "INV-1102",
    name: "Sunrise Sheer Curtains",
    stockQty: 9,
    status: "Low Stock",
  },
  {
    id: "INV-1103",
    name: "Phantom Roller Shades",
    stockQty: 0,
    status: "Out of Stock",
  },
  {
    id: "INV-1104",
    name: "Modern Daylight Shades",
    stockQty: 18,
    status: "In Stock",
  },
  {
    id: "INV-1105",
    name: "Blackout Premium Panels",
    stockQty: 4,
    status: "Low Stock",
  },
];

const statusStyles: Record<InventoryStatus, string> = {
  "In Stock": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "Low Stock": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
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

export default function InventoryPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | "All">(
    "All"
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_INVENTORY.filter((item) => {
      const matchesQuery = !q || item.name.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  return (
    <section className="min-h-screen bg-background/60">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <AdminPageHeader
          title="Inventory Management"
          description="Monitor product stock levels. Search and filters are UI-only for now."
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                className="h-11 rounded-none pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as InventoryStatus | "All")}
            >
              <SelectTrigger className="h-11 w-full rounded-none border-border bg-transparent text-sm sm:w-[240px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                {FILTER_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="rounded-none">
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

        <div className="overflow-hidden rounded-xl border border-border bg-card/80 shadow-sm">
          <Table className="min-w-[950px]">
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Product Name
                  </span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Stock Quantity
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
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {item.id}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm font-semibold text-foreground">
                    {item.stockQty}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <InventoryStatusBadge status={item.status} />
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-4 h-px w-12 bg-border" />
                      <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        No inventory items found
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground/70">
                        Try adjusting your search or filter.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}

