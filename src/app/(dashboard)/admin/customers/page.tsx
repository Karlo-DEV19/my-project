'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { axiosApiClient } from '@/app/api/axiosApiClient';
import AdminPageHeader from '@/components/pages/admin/components/admin-page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiPayment = {
  paymentType: string;
  status: string;
  amountPaid: string | null;
  amountDue: string | null;
  paidAt: string | null;
};

type ApiOrder = {
  id: string;
  trackingNumber: string;
  referenceNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: string;
  createdAt: string;
  payments: ApiPayment[];
};

type Customer = {
  email: string;
  fullName: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate: string;
  orders: ApiOrder[];
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PER_PAGE_OPTIONS = [5, 10, 20];

type CustomerFilter = 'all' | 'high_spenders' | 'repeat_customers';

const CUSTOMER_FILTER_OPTIONS: { value: CustomerFilter; label: string }[] = [
  { value: 'all', label: 'All Customers' },
  { value: 'high_spenders', label: 'High Spenders' },
  { value: 'repeat_customers', label: 'Repeat Customers' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

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

function groupOrdersIntoCustomers(orders: ApiOrder[]): Customer[] {
  const map = new Map<string, Customer>();

  for (const order of orders) {
    const key = order.customerEmail.toLowerCase();
    const orderSpent = order.payments.reduce(
      (sum, p) => sum + parseFloat(p.amountPaid ?? p.amountDue ?? '0'),
      0
    );

    const existing = map.get(key);
    if (existing) {
      existing.totalOrders += 1;
      existing.totalSpent += orderSpent;
      existing.orders.push(order);
      if (order.createdAt < existing.firstOrderDate) {
        existing.firstOrderDate = order.createdAt;
      }
    } else {
      map.set(key, {
        email: order.customerEmail,
        fullName: `${order.customerFirstName} ${order.customerLastName}`,
        phone: order.customerPhone,
        totalOrders: 1,
        totalSpent: orderSpent,
        firstOrderDate: order.createdAt,
        orders: [order],
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.firstOrderDate).getTime() - new Date(a.firstOrderDate).getTime()
  );
}

// ─── Customer Details Modal ───────────────────────────────────────────────────

function CustomerDetailsModal({
  customer,
  onClose,
}: {
  customer: Customer | null;
  onClose: () => void;
}) {
  const allPayments = useMemo<(ApiPayment & { trackingNumber: string })[]>(() => {
    if (!customer) return [];
    return customer.orders.flatMap((o) =>
      o.payments.map((p) => ({ ...p, trackingNumber: o.trackingNumber }))
    );
  }, [customer]);

  return (
    <Dialog open={!!customer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-base">Customer Details</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {customer?.email}
          </DialogDescription>
        </DialogHeader>

        {customer && (
          <div className="space-y-5">

            {/* ── Summary cards ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Full Name', value: customer.fullName },
                { label: 'Phone', value: customer.phone },
                { label: 'Total Orders', value: String(customer.totalOrders) },
                { label: 'Total Spent', value: formatCurrency(customer.totalSpent) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-foreground truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* ── Orders ── */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Orders ({customer.orders.length})
              </p>
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      {['Tracking #', 'Status', 'Payment', 'Total', 'Date'].map((h) => (
                        <TableHead key={h} className="px-4 py-2">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                            {h}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.orders.map((o) => (
                      <TableRow key={o.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                          {o.trackingNumber}
                        </TableCell>
                        <TableCell className="px-4 py-2.5">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground">
                            {o.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-2.5">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground">
                            {o.paymentStatus}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-xs font-semibold tabular-nums text-foreground">
                          {formatCurrency(parseFloat(o.totalAmount))}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                          {formatDate(o.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* ── Payments ── */}
            {allPayments.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Payments ({allPayments.length})
                </p>
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        {['Order Ref', 'Type', 'Status', 'Due', 'Paid', 'Paid At'].map((h) => (
                          <TableHead key={h} className="px-4 py-2">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                              {h}
                            </span>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPayments.map((p, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                            {p.trackingNumber}
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-xs text-muted-foreground capitalize">
                            {p.paymentType}
                          </TableCell>
                          <TableCell className="px-4 py-2.5">
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground">
                              {p.status}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-xs tabular-nums text-muted-foreground">
                            {p.amountDue ? formatCurrency(parseFloat(p.amountDue)) : '—'}
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-xs font-semibold tabular-nums text-foreground">
                            {p.amountPaid ? formatCurrency(parseFloat(p.amountPaid)) : '—'}
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                            {p.paidAt ? formatDate(p.paidAt) : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
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

      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-none" disabled={!hasPrevPage} onClick={() => onPageChange(1)}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-none" disabled={!hasPrevPage} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers[0] > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="h-8 w-8 rounded-none text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">1</button>
            {pageNumbers[0] > 2 && <span className="flex h-8 w-6 items-end justify-center pb-1 text-xs text-muted-foreground">…</span>}
          </>
        )}

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

        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="flex h-8 w-6 items-end justify-center pb-1 text-xs text-muted-foreground">…</span>
            )}
            <button onClick={() => onPageChange(totalPages)} className="h-8 w-8 rounded-none text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              {totalPages}
            </button>
          </>
        )}

        <Button variant="outline" size="icon" className="h-8 w-8 rounded-none" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-none" disabled={!hasNextPage} onClick={() => onPageChange(totalPages)}>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all'); // ← new
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data, isLoading, isError } = useQuery<{ success: boolean; data: ApiOrder[] }>({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await axiosApiClient.get('/orders');
      return res.data;
    },
  });

  const orders = data?.data ?? [];

  const customers = useMemo<Customer[]>(() => groupOrdersIntoCustomers(orders), [orders]);

  const filtered = useMemo<Customer[]>(() => {
    const q = query.trim().toLowerCase();

    return customers.filter((c) => {
      // ── search match ──
      const matchesSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);

      // ── segment match ──
      const matchesFilter =
        filter === 'all' ||
        (filter === 'high_spenders' && c.totalSpent > 5000) ||
        (filter === 'repeat_customers' && c.totalOrders > 1);

      return matchesSearch && matchesFilter;
    });
  }, [query, filter, customers]);

  const pagination = useMemo<Pagination>(
    () => buildPagination(filtered.length, page, limit),
    [filtered.length, page, limit]
  );

  const paged = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filtered.slice(start, start + pagination.limit);
  }, [filtered, pagination.page, pagination.limit]);

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="w-full max-w-[1400px] mx-auto px-6 py-8 space-y-6">

        <AdminPageHeader
          title="Customers"
          description="View customer profiles and purchase activity."
        />

        {/* ── Search + Filter + Count ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search by name or email…"
                className="h-9 rounded-none pl-10 text-sm"
              />
            </div>

            {/* Filter dropdown */}
            <Select
              value={filter}
              onValueChange={(v) => { setFilter(v as CustomerFilter); setPage(1); }}
            >
              <SelectTrigger className="h-9 w-full rounded-none border-border bg-transparent text-xs sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                {CUSTOMER_FILTER_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value} className="rounded-none text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground shrink-0">
            {filtered.length} customer{filtered.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* ── Table card ── */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[900px] w-full">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {['Customer', 'Email', 'Phone', 'Total Orders', 'Total Spent', 'First Order', 'Actions'].map((h) => (
                    <TableHead key={h} className="px-5 py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {h}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-20 text-center">
                      <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Loading…
                      </p>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-20 text-center">
                      <p className="text-sm font-medium uppercase tracking-[0.18em] text-destructive">
                        Failed to load customers.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-4 h-px w-10 bg-border" />
                        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          No customers found
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground/60">
                          Try a different search query.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((c) => (
                    <TableRow key={c.email} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="px-5 py-3.5">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-foreground">{c.fullName}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{c.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
                        {c.email}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
                        {c.phone}
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {c.totalOrders}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(c.totalSpent)}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
                        {formatDate(c.firstOrderDate)}
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 rounded-none text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setSelectedCustomer(c)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={(n) => { setLimit(n); setPage(1); }}
          />
        </div>
      </div>

      {/* ── Customer Details Modal ── */}
      <CustomerDetailsModal
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  );
}