"use client";

import React, { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Pencil, Check, X, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosApiClient } from "@/app/api/axiosApiClient";
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

type BlindProduct = {
  id: string;
  name: string;
  stock: number | null;
};

type ProductsApiResponse = {
  blinds: BlindProduct[];
  pagination: {
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

const ITEMS_PER_PAGE = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveStatus(stockQty: number): InventoryStatus {
  if (stockQty === 0) return "Out of Stock";
  if (stockQty <= 10) return "Low Stock";
  return "In Stock";
}

function mapToInventoryItem(product: BlindProduct): InventoryItem {
  const stockQty = product.stock ?? 0;
  return {
    id: product.id,
    name: product.name,
    stockQty,
    status: deriveStatus(stockQty),
  };
}

// ✅ FIXED: fetch ALL products with a high limit so inventory shows everything
async function fetchInventory(): Promise<InventoryItem[]> {
  const res = await fetch("/api/v1/product-blinds?limit=1000&page=1");
  if (!res.ok) {
    throw new Error(`Failed to fetch inventory (${res.status} ${res.statusText})`);
  }
  const json: ProductsApiResponse = await res.json();
  return json.blinds.map(mapToInventoryItem);
}

async function patchStock(id: string, stock: number): Promise<void> {
  try {
    await axiosApiClient.patch(`/product-blinds/${id}`, {
      stock,
    });
  } catch (error) {
    throw error;
  }
}

async function deleteInventoryItem(id: string): Promise<void> {
  try {
    await axiosApiClient.delete(`/product-blinds/${id}`);
  } catch (error) {
    throw error;
  }
}

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

// ─── Inline Stock Editor ──────────────────────────────────────────────────────

type StockEditorProps = {
  item: InventoryItem;
  onSave: (id: string, stock: number) => void;
  isSaving: boolean;
};

function StockEditor({ item, onSave, isSaving }: StockEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(item.stockQty));
  const [error, setError] = useState("");

  function handleOpen() {
    setValue(String(item.stockQty));
    setError("");
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
    setError("");
  }

  function handleConfirm() {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || value.trim() === "") {
      setError("Must be a whole number ≥ 0");
      return;
    }
    onSave(item.id, parsed);
    setEditing(false);
    setError("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") handleCancel();
  }

  if (!editing) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 rounded-none px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={handleOpen}
      >
        <Pencil className="h-3 w-3" />
        Edit
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-7 w-20 rounded-none px-2 text-sm tabular-nums"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-none text-emerald-600 hover:text-emerald-700"
          onClick={handleConfirm}
          disabled={isSaving}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-none text-rose-500 hover:text-rose-600"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {error && <p className="text-[11px] text-rose-500">{error}</p>}
    </div>
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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | "All">("All");
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const {
    data: inventory = [],
    isLoading,
    isError,
    error,
  } = useQuery<InventoryItem[], Error>({
    queryKey: ["inventory"],
    queryFn: fetchInventory,
  });

  // ── Stock mutation ─────────────────────────────────────────────────────────
  const { mutate: updateStock, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      patchStock(id, stock),
    // ✅ Optimistic update — agad na nagbabago ang UI bago pa mag-refetch
    onMutate: async ({ id, stock }) => {
      await queryClient.cancelQueries({ queryKey: ["inventory"] });
      const previous = queryClient.getQueryData<InventoryItem[]>(["inventory"]);
      queryClient.setQueryData<InventoryItem[]>(["inventory"], (old = []) =>
        old.map((item) =>
          item.id === id
            ? { ...item, stockQty: stock, status: deriveStatus(stock) }
            : item
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // ✅ I-rollback kung may error
      if (context?.previous) {
        queryClient.setQueryData(["inventory"], context.previous);
      }
    },
    onSettled: () => {
      // ✅ I-refetch para masync sa DB
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  // ── Delete mutation ────────────────────────────────────────────────────────
  const { mutate: deleteItem, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteInventoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inventory.filter((item) => {
      const matchesQuery = !q || item.name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [inventory, query, statusFilter]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const pagination = useMemo<Pagination>(
    () => buildPagination(filtered.length, page, ITEMS_PER_PAGE),
    [filtered.length, page]
  );

  const paginated = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filtered.slice(start, start + pagination.limit);
  }, [filtered, pagination.page, pagination.limit]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setPage(1);
  }

  function handleStatusChange(v: string) {
    setStatusFilter(v as InventoryStatus | "All");
    setPage(1);
  }

  function handleDelete(id: string) {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteItem(id);
    }
  }

  const maxStock = useMemo(
    () => Math.max(1, ...inventory.map((i) => i.stockQty)),
    [inventory]
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen bg-background">
      <div className="w-full max-w-[1400px] mx-auto px-6 py-8 space-y-6">

        {/* ── Page Header ── */}
        <AdminPageHeader
          title="Inventory Management"
          description="Monitor and update product stock levels."
        />

        {/* ── Loading state ── */}
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading inventory…</p>
        )}

        {/* ── Error state ── */}
        {isError && (
          <p className="text-sm text-rose-600 dark:text-rose-400">
            {error?.message ?? "An unexpected error occurred while fetching inventory."}
          </p>
        )}

        {/* ── Main content ── */}
        {!isLoading && !isError && (
          <>
            {/* ── Filters row ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="Search products…"
                    className="h-9 rounded-none pl-10 text-sm"
                  />
                </div>

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
                <Table className="min-w-[700px] w-full">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      {["Product", "Stock Qty", "Status", "Actions"].map((h) => (
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

                        {/* Stock qty + bar */}
                        <TableCell className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold tabular-nums text-foreground w-6">
                              {item.stockQty}
                            </span>
                            <div className="h-1.5 w-24 rounded-full bg-border overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  item.status === "In Stock" && "bg-emerald-500",
                                  item.status === "Low Stock" && "bg-amber-400",
                                  item.status === "Out of Stock" && "bg-rose-400"
                                )}
                                style={{
                                  width: `${Math.min((item.stockQty / maxStock) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        {/* Status badge */}
                        <TableCell className="px-5 py-3.5">
                          <InventoryStatusBadge status={item.status} />
                        </TableCell>

                        {/* Edit stock and delete */}
                        <TableCell className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <StockEditor
                              item={item}
                              isSaving={isUpdating}
                              onSave={(id, stock) => updateStock({ id, stock })}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1.5 rounded-none px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                              onClick={() => handleDelete(item.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {paginated.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="px-6 py-20">
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
          </>
        )}
      </div>
    </div>
  );
}