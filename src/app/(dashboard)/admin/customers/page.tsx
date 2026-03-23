'use client';

import React, { useMemo, useState } from 'react';
import { Search, Trash2, UserRound, MoreHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import AdminPageHeader from '@/components/pages/admin/components/admin-page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  dateJoined: string;
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

const MOCK_CUSTOMERS: Customer[] = [
  { id: 'C-1001', name: 'Jane Doe',      email: 'jane.doe@email.com',    phone: '0917 694 8888', totalOrders: 5,  dateJoined: '2025-11-18' },
  { id: 'C-1002', name: 'John Smith',    email: 'john.smith@email.com',  phone: '0999 123 4567', totalOrders: 2,  dateJoined: '2026-01-09' },
  { id: 'C-1003', name: 'MJ Interiors',  email: 'orders@mjinteriors.com',phone: '0922 555 0000', totalOrders: 12, dateJoined: '2024-08-03' },
  { id: 'C-1004', name: 'Andrea Cruz',   email: 'andrea.cruz@email.com', phone: '0918 222 3344', totalOrders: 1,  dateJoined: '2026-02-20' },
  { id: 'C-1005', name: 'Mark Reyes',    email: 'mark.reyes@email.com',  phone: '0908 111 2233', totalOrders: 7,  dateJoined: '2025-06-14' },
  { id: 'C-1006', name: 'Sofia Lim',     email: 'sofia.lim@email.com',   phone: '0917 333 4455', totalOrders: 3,  dateJoined: '2025-09-01' },
  { id: 'C-1007', name: 'Carlos Tan',    email: 'carlos.tan@email.com',  phone: '0921 444 5566', totalOrders: 9,  dateJoined: '2024-12-20' },
  { id: 'C-1008', name: 'Anna Villanueva',email: 'anna.v@email.com',     phone: '0933 666 7788', totalOrders: 4,  dateJoined: '2026-03-05' },
  { id: 'C-1009', name: 'Rico Santos',   email: 'rico.s@email.com',      phone: '0945 777 8899', totalOrders: 6,  dateJoined: '2025-07-22' },
  { id: 'C-1010', name: 'Pia Garcia',    email: 'pia.garcia@email.com',  phone: '0956 888 9900', totalOrders: 0,  dateJoined: '2026-02-01' },
  { id: 'C-1011', name: 'Luis Mendoza',  email: 'luis.m@email.com',      phone: '0967 999 0011', totalOrders: 11, dateJoined: '2024-10-10' },
  { id: 'C-1012', name: 'Karen Bautista',email: 'karen.b@email.com',     phone: '0978 000 1122', totalOrders: 2,  dateJoined: '2025-03-18' },
];

const PER_PAGE_OPTIONS = [5, 10, 20];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPagination(total: number, page: number, limit: number): Pagination {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage   = Math.min(Math.max(1, page), totalPages);
  return {
    page:        safePage,
    limit,
    total,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CustomerActionsDropdown({ customer }: { customer: Customer }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44 rounded-none border-border">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {customer.name}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem className="cursor-pointer gap-2 rounded-none text-sm">
          <UserRound className="h-4 w-4" />
          View Profile
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem className="cursor-pointer gap-2 rounded-none text-sm text-destructive focus:bg-destructive/10 focus:text-destructive">
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Pagination UI ────────────────────────────────────────────────────────────

function TablePagination({
  pagination,
  onPageChange,
  onLimitChange,
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  const { page, limit, total, totalPages, hasNextPage, hasPrevPage } = pagination;

  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd   = Math.min(page * limit, total);

  // Build page number pills — show at most 5 around current page
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, page - delta);
      i <= Math.min(totalPages, page + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  }, [page, totalPages]);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: showing range + per-page selector */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground">
          Showing{' '}
          <span className="font-semibold text-foreground">{rangeStart}</span>
          {' '}–{' '}
          <span className="font-semibold text-foreground">{rangeEnd}</span>
          {' '}of{' '}
          <span className="font-semibold text-foreground">{total}</span>{' '}
          customer{total === 1 ? '' : 's'}
        </p>

        <Select
          value={String(limit)}
          onValueChange={(v) => onLimitChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-[90px] rounded-none border-border bg-transparent text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            {PER_PAGE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)} className="rounded-none text-xs">
                {n} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right: page controls */}
      <div className="flex items-center gap-1">
        {/* First */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-none"
          disabled={!hasPrevPage}
          onClick={() => onPageChange(1)}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Prev */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-none"
          disabled={!hasPrevPage}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Leading ellipsis */}
        {pageNumbers[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="h-8 w-8 rounded-none text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              1
            </button>
            {pageNumbers[0] > 2 && (
              <span className="flex h-8 w-6 items-end justify-center pb-1 text-xs text-muted-foreground">
                …
              </span>
            )}
          </>
        )}

        {/* Page number pills */}
        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'h-8 w-8 rounded-none text-xs font-semibold transition-colors',
              p === page
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {p}
          </button>
        ))}

        {/* Trailing ellipsis */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="flex h-8 w-6 items-end justify-center pb-1 text-xs text-muted-foreground">
                …
              </span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="h-8 w-8 rounded-none text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-none"
          disabled={!hasNextPage}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-none"
          disabled={!hasNextPage}
          onClick={() => onPageChange(totalPages)}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [query, setQuery]   = useState('');
  const [page, setPage]     = useState(1);
  const [limit, setLimit]   = useState(5);

  // 1. Filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_CUSTOMERS;
    return MOCK_CUSTOMERS.filter(
      (c) =>
        c.name.toLowerCase().includes(q)  ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [query]);

  // 2. Build pagination object (your exact format)
  const pagination = useMemo<Pagination>(
    () => buildPagination(filtered.length, page, limit),
    [filtered.length, page, limit]
  );

  // 3. Slice for current page
  const paged = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filtered.slice(start, start + pagination.limit);
  }, [filtered, pagination.page, pagination.limit]);

  function handleLimitChange(n: number) {
    setLimit(n);
    setPage(1);
  }

  return (
    <section className="min-h-screen bg-background/60">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <AdminPageHeader
          title="Customers"
          description="View customer profiles and purchase activity."
        />

        {/* ── Search + Count ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search customers…"
              className="h-11 rounded-none pl-10"
            />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {filtered.length} customer{filtered.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-xl border border-border bg-card/80 shadow-sm">
          <Table className="min-w-[950px]">
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Customer Name</span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Email</span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Phone</span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total Orders</span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Date Joined</span>
                </TableHead>
                <TableHead className="px-4 text-right">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paged.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{c.id}</p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">{c.phone}</TableCell>
                  <TableCell className="px-4 py-3 text-sm font-semibold text-foreground">{c.totalOrders}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">{c.dateJoined}</TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <CustomerActionsDropdown customer={c} />
                  </TableCell>
                </TableRow>
              ))}

              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-4 h-px w-12 bg-border" />
                      <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        No customers found
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground/70">
                        Try a different search query.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* ── Pagination ── */}
          <TablePagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
          />
        </div>
      </div>
    </section>
  );
}