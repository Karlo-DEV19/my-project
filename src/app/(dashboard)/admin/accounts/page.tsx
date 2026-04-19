'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from 'lucide-react';
import { AccountsHeader } from '@/components/pages/admin/accounts/accounts-header';
import { AccountsTable } from '@/components/pages/admin/accounts/accounts-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetUsers, useDeleteUser } from '@/app/api/hooks/use-users-api';
import type { MonthFilter } from '@/lib/validations/admin-account.schema';
import type { Account } from '@/components/pages/admin/accounts/account-row';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PER_PAGE_OPTIONS = [5, 10, 20] as const;

type MonthOption = { value: MonthFilter; label: string };
const MONTH_OPTIONS: MonthOption[] = [
  { value: 'all', label: 'All Time' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-6 border-b border-border px-5 py-3.5 last:border-0">
      <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
      <div className="h-3.5 w-48 animate-pulse rounded bg-muted" />
      <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
      <div className="h-7 w-7 animate-pulse rounded bg-muted" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-6 border-b border-border bg-muted/50 px-5 py-3">
        {['w-16', 'w-20', 'w-24', 'w-16'].map((w, i) => (
          <div key={i} className={`h-2.5 animate-pulse rounded bg-muted-foreground/20 ${w}`} />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

// ─── Pagination UI ─────────────────────────────────────────────────────────────

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
};

function TablePagination({
  page, totalPages, total, limit, onPageChange, onLimitChange,
}: PaginationProps) {
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i);
    }
    return range;
  }, [page, totalPages]);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      {/* Range + per-page selector */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground">
          Showing{' '}
          <span className="font-semibold text-foreground">{rangeStart}</span>
          {' '}–{' '}
          <span className="font-semibold text-foreground">{rangeEnd}</span>
          {' '}of{' '}
          <span className="font-semibold text-foreground">{total}</span>{' '}
          user{total === 1 ? '' : 's'}
        </p>

        <Select value={String(limit)} onValueChange={(v) => onLimitChange(Number(v))}>
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

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline" size="icon"
          className="h-8 w-8 rounded-none"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline" size="icon"
          className="h-8 w-8 rounded-none"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="h-8 w-8 rounded-none text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              1
            </button>
            {pageNumbers[0] > 2 && (
              <span className="flex h-8 w-6 items-end justify-center pb-1 text-xs text-muted-foreground">…</span>
            )}
          </>
        )}

        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={[
              'h-8 w-8 rounded-none text-xs font-semibold transition-colors',
              p === page
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            ].join(' ')}
          >
            {p}
          </button>
        ))}

        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="flex h-8 w-6 items-end justify-center pb-1 text-xs text-muted-foreground">…</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="h-8 w-8 rounded-none text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {totalPages}
            </button>
          </>
        )}

        <Button
          variant="outline" size="icon"
          className="h-8 w-8 rounded-none"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline" size="icon"
          className="h-8 w-8 rounded-none"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Map API row → Account type ───────────────────────────────────────────────

function toAccount(row: { id: string; name: string; email: string; created_at: string }): Account {
  return {
    id: String(row.id),
    name: row.name ?? '',
    email: row.email ?? '',
    createdAt: row.created_at ? String(row.created_at).split('T')[0] : '',
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  // ── Filter / pagination state ──────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState<MonthFilter>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Debounce search — 400 ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1); // reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to page 1 when month filter changes
  const handleMonthChange = (value: string) => {
    setMonthFilter(value as MonthFilter);
    setPage(1);
  };

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { users, pagination, isLoading } = useGetUsers({
    search: debouncedSearch,
    month: monthFilter,
    page,
    limit,
  });
  const { mutate: deleteUser } = useDeleteUser();

  const accounts: Account[] = users.map(toAccount);

  // Use server-returned total when available, otherwise fall back to visible count
  const total = pagination?.total ?? accounts.length;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="w-full max-w-[1400px] mx-auto px-6 py-8 space-y-6">

        {/* ── Page Header ── */}
        <AccountsHeader />

        {/* ── Search + Filter + Count ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="user-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email…"
                className="h-9 rounded-none pl-10 text-sm"
              />
            </div>

            {/* Month filter */}
            <Select value={monthFilter} onValueChange={handleMonthChange}>
              <SelectTrigger className="h-9 w-full rounded-none border-border bg-transparent text-xs sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                {MONTH_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value} className="rounded-none text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Result count */}
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground shrink-0">
            {total} user{total === 1 ? '' : 's'}
          </p>
        </div>

        {/* ── Accounts table + Pagination ── */}
        {isLoading ? (
          <SkeletonTable />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <AccountsTable data={accounts} onDelete={(id) => deleteUser(id)} />
            {totalPages > 1 && (
              <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(n) => { setLimit(n); setPage(1); }}
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
}

