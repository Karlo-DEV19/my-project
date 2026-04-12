'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  Eye,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { axiosApiClient } from '@/app/api/axiosApiClient';
import AdminPageHeader from '@/components/pages/admin/components/admin-page-header';
import OrderStatusBadge, {
  type OrderStatus,
} from '@/components/pages/admin/components/order-status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentStatus = 'Paid' | 'Unpaid' | 'Refunded' | 'Failed';
type Tab = 'orders' | 'payment-history';

type OrderItem = {
  name: string;
  qty: number;
  price: number;
};

/** Raw payment row returned by the backend inside each order */
type ApiPayment = {
  orderId: string;
  paymentType: string;
  status: string;
  amountDue: string | null;
  amountPaid: string | null;
  paidAt: string | null;
  paymentMethod?: string;
};

/** Raw order row returned by GET /api/v1/orders */
type ApiOrder = {
  id: string;
  trackingNumber: string;
  referenceNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  orderType: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: string;
  downpaymentAmount: string;
  balanceAmount: string;
  createdAt: string;
  updatedAt: string;
  payments: ApiPayment[];
};

/** Normalised payment row used by the UI */
type Payment = {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  date: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

// ─── Payment status normaliser ────────────────────────────────────────────────

const PAYMENT_STATUS_MAP: Record<string, PaymentStatus> = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  pending: 'Unpaid',
  refunded: 'Refunded',
  failed: 'Failed',
};

function normalisePaymentStatus(raw: string): PaymentStatus {
  return PAYMENT_STATUS_MAP[raw.toLowerCase()] ?? 'Unpaid';
}

const ALL_STATUSES: Array<OrderStatus | 'All'> = ['All', 'Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
const ALL_PAYMENT_STATUSES: Array<PaymentStatus | 'All'> = ['All', 'Paid', 'Unpaid', 'Refunded', 'Failed'];
const PER_PAGE_OPTIONS = [5, 10, 20];

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);

// ─── Payment Status Badge ─────────────────────────────────────────────────────

const paymentStatusStyles: Record<PaymentStatus, string> = {
  Paid: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Unpaid: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  Refunded: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  Failed: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full border-border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]',
        paymentStatusStyles[status]
      )}
    >
      {status}
    </Badge>
  );
}

// ─── Pagination UI ────────────────────────────────────────────────────────────

function TablePagination({
  pagination,
  onPageChange,
  onLimitChange,
  itemLabel = 'item',
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  itemLabel?: string;
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
          {itemLabel}{total === 1 ? '' : 's'}
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

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  // Orders state
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  // Payment state
  const [payQuery, setPayQuery] = useState('');
  const [payStatusFilter, setPayStatusFilter] = useState<PaymentStatus | 'All'>('All');
  const [payDateFilter, setPayDateFilter] = useState('');
  const [payPage, setPayPage] = useState(1);
  const [payLimit, setPayLimit] = useState(5);

  const { data: ordersResponse, isLoading } = useQuery<{ success: boolean; data: ApiOrder[] }>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await axiosApiClient.get('/orders');
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await axiosApiClient.patch(`/orders/${id}/status`, { status });
      return res.data;
    },
    onMutate: async (newStatusUpdate) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      const previousOrders = queryClient.getQueryData<{ success: boolean; data: ApiOrder[] }>(['orders']);

      if (previousOrders) {
        queryClient.setQueryData(['orders'], {
          ...previousOrders,
          data: previousOrders.data.map((order) =>
            order.id === newStatusUpdate.id
              ? { ...order, status: newStatusUpdate.status as OrderStatus }
              : order
          ),
        });
      }
      return { previousOrders };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders);
      }
      toast.error('Failed to update status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onSuccess: () => {
      toast.success('Order status updated');
    },
  });

  const ordersData: ApiOrder[] = ordersResponse?.data ?? [];

  const selectedOrder = useMemo(
    () => ordersData.find((o) => o.id === openOrderId) ?? null,
    [openOrderId, ordersData]
  );

  /** Flat list of payments derived from real order data — no extra API call */
  const allPayments = useMemo<Payment[]>(() =>
    ordersData.flatMap((order) =>
      order.payments.map((p) => ({
        id: p.orderId + '-' + p.paymentType,
        orderId: order.id,
        customer: `${order.customerFirstName} ${order.customerLastName}`,
        amount: parseFloat(p.amountPaid ?? p.amountDue ?? '0'),
        method: order.paymentMethod,
        status: normalisePaymentStatus(p.status),
        date: p.paidAt ?? order.createdAt,
      }))
    ),
    [ordersData]
  );

  // ── Orders pipeline ──────────────────────────────────────────────────────

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ordersData.filter((o) => {
      const customer = `${o.customerFirstName} ${o.customerLastName}`;
      const matchesQuery = !q || o.id.toLowerCase().includes(q) || customer.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      const matchesDate = !dateFilter || o.createdAt === dateFilter || o.createdAt.startsWith(dateFilter);
      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [query, statusFilter, dateFilter, ordersData]);

  const orderPagination = useMemo<Pagination>(
    () => buildPagination(filteredOrders.length, page, limit),
    [filteredOrders.length, page, limit]
  );

  const pagedOrders = useMemo(() => {
    const start = (orderPagination.page - 1) * orderPagination.limit;
    return filteredOrders.slice(start, start + orderPagination.limit);
  }, [filteredOrders, orderPagination.page, orderPagination.limit]);

  // ── Payments pipeline ────────────────────────────────────────────────────

  const filteredPayments = useMemo(() => {
    const q = payQuery.trim().toLowerCase();
    return allPayments.filter((p) => {
      const matchesQuery = !q || p.id.toLowerCase().includes(q) || p.customer.toLowerCase().includes(q) || p.orderId.toLowerCase().includes(q);
      const matchesStatus = payStatusFilter === 'All' || p.status === payStatusFilter;
      const matchesDate = !payDateFilter || p.date === payDateFilter || p.date.startsWith(payDateFilter);
      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [payQuery, payStatusFilter, payDateFilter, allPayments]);

  const paymentPagination = useMemo<Pagination>(
    () => buildPagination(filteredPayments.length, payPage, payLimit),
    [filteredPayments.length, payPage, payLimit]
  );

  const pagedPayments = useMemo(() => {
    const start = (paymentPagination.page - 1) * paymentPagination.limit;
    return filteredPayments.slice(start, start + paymentPagination.limit);
  }, [filteredPayments, paymentPagination.page, paymentPagination.limit]);

  // ── Tab switch helpers ───────────────────────────────────────────────────

  function switchTab(tab: Tab) {
    setActiveTab(tab);
  }

  return (
    // ── Full-width page wrapper ──────────────────────────────────────────
    <div className="w-full min-h-screen bg-background">
      <div className="w-full max-w-[1400px] mx-auto px-6 py-8 space-y-6">

        {/* ── Page Header ── */}
        <AdminPageHeader
          title="Orders"
          description="Track orders, update statuses, and view payment history."
        />

        {/* ── Sub Nav tabs ── */}
        <div className="flex items-center gap-0 border-b border-border">
          {(['orders', 'payment-history'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={cn(
                'relative px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition-colors',
                activeTab === tab
                  ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab === 'orders' ? 'Orders' : 'Payment History'}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            ORDERS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div className="space-y-5">

            {/* Filters row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    placeholder="Search by ID or customer…"
                    className="h-9 rounded-none pl-10 text-sm"
                  />
                </div>

                {/* Status filter */}
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as OrderStatus | 'All'); setPage(1); }}>
                  <SelectTrigger className="h-9 w-full rounded-none border-border bg-transparent text-sm sm:w-44">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border">
                    {ALL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="rounded-none text-sm">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date filter */}
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                  className="h-9 w-full rounded-none border-border bg-transparent text-sm sm:w-44"
                />
              </div>

              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* Orders table */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[900px] w-full">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
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
                          <div className="flex flex-col items-center justify-center">
                            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              Loading Orders...
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : pagedOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="px-6 py-20">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="mb-4 h-px w-10 bg-border" />
                            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              No orders found
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground/60">
                              Try adjusting your filters.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedOrders.map((o) => {
                        const customer = `${o.customerFirstName} ${o.customerLastName}`;
                        const total = parseFloat(o.totalAmount);
                        const date = o.createdAt;
                        return (
                          <TableRow key={o.id} className="hover:bg-muted/40 transition-colors">
                            <TableCell className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                              {o.trackingNumber}
                            </TableCell>
                            <TableCell className="px-5 py-3.5 text-sm font-medium text-foreground">
                              {customer}
                            </TableCell>
                            <TableCell className="px-5 py-3.5 text-sm tabular-nums text-muted-foreground">
                              {o.payments.length}
                            </TableCell>
                            <TableCell className="px-5 py-3.5 text-sm font-semibold tabular-nums text-foreground">
                              {formatCurrency(total)}
                            </TableCell>
                            <TableCell className="px-5 py-3.5">
                              <Select
                                value={o.status}
                                onValueChange={(val) => {
                                  updateStatusMutation.mutate({ id: o.id, status: val });
                                }}
                                disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.id === o.id}
                              >
                                <SelectTrigger className="h-8 border-0 bg-transparent shadow-none hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 px-2 min-w-[150px] transition-colors rounded-md">
                                  <SelectValue>
                                    <OrderStatusBadge status={o.status} />
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-border">
                                  {['pending', 'processing', 'shipped', 'completed', 'cancelled'].map((s) => (
                                    <SelectItem key={s} value={s} className="cursor-pointer">
                                      <OrderStatusBadge status={s as OrderStatus} />
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
                              {date}
                            </TableCell>
                            <TableCell className="px-5 py-3.5">
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
                                <DropdownMenuContent align="end" className="w-48 rounded-none border-border">
                                  <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    {o.trackingNumber}
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-border" />
                                  <DropdownMenuItem
                                    className="cursor-pointer gap-2 rounded-none text-sm"
                                    onClick={() => setOpenOrderId(o.id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-border" />
                                  <DropdownMenuItem className="cursor-pointer gap-2 rounded-none text-sm text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                    Delete Order
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <TablePagination
                pagination={orderPagination}
                onPageChange={setPage}
                onLimitChange={(n) => { setLimit(n); setPage(1); }}
                itemLabel="order"
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PAYMENT HISTORY TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'payment-history' && (
          <div className="space-y-5">

            {/* Filters row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={payQuery}
                    onChange={(e) => { setPayQuery(e.target.value); setPayPage(1); }}
                    placeholder="Search by ID or customer…"
                    className="h-9 rounded-none pl-10 text-sm"
                  />
                </div>

                {/* Payment status filter */}
                <Select value={payStatusFilter} onValueChange={(v) => { setPayStatusFilter(v as PaymentStatus | 'All'); setPayPage(1); }}>
                  <SelectTrigger className="h-9 w-full rounded-none border-border bg-transparent text-sm sm:w-44">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border">
                    {ALL_PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="rounded-none text-sm">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date filter */}
                <Input
                  type="date"
                  value={payDateFilter}
                  onChange={(e) => { setPayDateFilter(e.target.value); setPayPage(1); }}
                  className="h-9 w-full rounded-none border-border bg-transparent text-sm sm:w-44"
                />
              </div>

              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {filteredPayments.length} payment{filteredPayments.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* Payments table */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[900px] w-full">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      {['Payment ID', 'Order ID', 'Customer', 'Amount', 'Method', 'Status', 'Date'].map((h) => (
                        <TableHead key={h} className="px-5 py-3">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {h}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedPayments.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                          {p.id}
                        </TableCell>
                        <TableCell className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                          {p.orderId}
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-sm font-medium text-foreground">
                          {p.customer}
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(p.amount)}
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
                          {p.method}
                        </TableCell>
                        <TableCell className="px-5 py-3.5">
                          <PaymentStatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
                          {p.date}
                        </TableCell>
                      </TableRow>
                    ))}

                    {pagedPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="px-6 py-20">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="mb-4 h-px w-10 bg-border" />
                            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              No payments found
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground/60">
                              Try adjusting your filters.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <TablePagination
                pagination={paymentPagination}
                onPageChange={setPayPage}
                onLimitChange={(n) => { setPayLimit(n); setPayPage(1); }}
                itemLabel="payment"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Order Details Dialog ── */}
      <Dialog open={!!openOrderId} onOpenChange={(o) => !o && setOpenOrderId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-base">Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <span className="font-mono text-xs">{selectedOrder.trackingNumber}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Customer
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-foreground">
                    {`${selectedOrder.customerFirstName} ${selectedOrder.customerLastName}`}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selectedOrder.customerPhone}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Payment
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-foreground">
                    {selectedOrder.paymentMethod}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selectedOrder.createdAt}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Reference
                </p>
                <p className="mt-1.5 text-sm font-mono text-foreground">{selectedOrder.referenceNumber}</p>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <div className="bg-muted/50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Payments
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {selectedOrder.payments.map((p) => (
                    <div
                      key={p.orderId + p.paymentType}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground capitalize">{p.paymentType}</p>
                        <p className="text-xs text-muted-foreground capitalize">{p.status}</p>
                      </div>
                      <p className="font-semibold tabular-nums text-foreground">
                        {formatCurrency(parseFloat(p.amountDue ?? '0'))}
                      </p>
                    </div>
                  ))}
                  {selectedOrder.payments.length === 0 && (
                    <div className="px-4 py-3 text-sm text-muted-foreground">No payment records.</div>
                  )}
                </div>
                <div className="flex items-center justify-between bg-muted/40 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Status
                    </span>
                    <OrderStatusBadge status={selectedOrder.status} />
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Total
                    </p>
                    <p className="text-lg font-bold tabular-nums text-foreground">
                      {formatCurrency(parseFloat(selectedOrder.totalAmount))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}