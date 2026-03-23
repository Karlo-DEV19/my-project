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
type Tab           = 'orders' | 'payment-history';

type OrderItem = {
  name: string;
  qty: number;
  price: number;
};

type Order = {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  address: string;
  phone: string;
  paymentMethod: string;
};

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2043',
    customerName: 'Jane Doe',
    items: [
      { name: 'Evergreen Blackout Blinds', qty: 1, price: 8200 },
      { name: 'Afternoon Sheer Curtains',  qty: 2, price: 6750 },
    ],
    totalAmount: 21700,
    status: 'Processing',
    orderDate: '2026-03-07',
    address: '35 20th Avenue, Murphy Cubao, Quezon City, PH 1109',
    phone: '0917 694 8888',
    paymentMethod: 'GCash',
  },
  {
    id: 'ORD-2042',
    customerName: 'John Smith',
    items: [{ name: 'Phantom Roller Shades', qty: 1, price: 12400 }],
    totalAmount: 12400,
    status: 'Completed',
    orderDate: '2026-03-06',
    address: 'Makati City, Metro Manila, PH',
    phone: '0999 123 4567',
    paymentMethod: 'Bank Transfer',
  },
  {
    id: 'ORD-2041',
    customerName: 'MJ Interiors',
    items: [{ name: 'Modern Daylight Shades', qty: 6, price: 5900 }],
    totalAmount: 35400,
    status: 'Pending',
    orderDate: '2026-03-05',
    address: 'BGC, Taguig, PH',
    phone: '0922 555 0000',
    paymentMethod: 'Maya',
  },
  {
    id: 'ORD-2040',
    customerName: 'Andrea Cruz',
    items: [{ name: 'Blackout Premium Panels', qty: 2, price: 9950 }],
    totalAmount: 19900,
    status: 'Shipped',
    orderDate: '2026-03-02',
    address: 'Pasig City, Metro Manila, PH',
    phone: '0918 222 3344',
    paymentMethod: 'GCash',
  },
  {
    id: 'ORD-2039',
    customerName: 'Carlos Reyes',
    items: [{ name: 'Afternoon Sheer Curtains', qty: 1, price: 6750 }],
    totalAmount: 6750,
    status: 'Cancelled',
    orderDate: '2026-02-28',
    address: 'Quezon City, Metro Manila, PH',
    phone: '0917 000 1111',
    paymentMethod: 'Card',
  },
  {
    id: 'ORD-2038',
    customerName: 'Sofia Lim',
    items: [{ name: 'Velvet Drape Curtains', qty: 3, price: 4800 }],
    totalAmount: 14400,
    status: 'Pending',
    orderDate: '2026-02-25',
    address: 'Mandaluyong, Metro Manila, PH',
    phone: '0917 333 4455',
    paymentMethod: 'Maya',
  },
  {
    id: 'ORD-2037',
    customerName: 'Mark Reyes',
    items: [{ name: 'Bamboo Roman Shades', qty: 2, price: 7200 }],
    totalAmount: 14400,
    status: 'Shipped',
    orderDate: '2026-02-20',
    address: 'Caloocan, Metro Manila, PH',
    phone: '0908 111 2233',
    paymentMethod: 'GCash',
  },
  {
    id: 'ORD-2036',
    customerName: 'Anna Villanueva',
    items: [{ name: 'Linen Sheer Panels', qty: 4, price: 3500 }],
    totalAmount: 14000,
    status: 'Completed',
    orderDate: '2026-02-18',
    address: 'Las Piñas, Metro Manila, PH',
    phone: '0933 666 7788',
    paymentMethod: 'Bank Transfer',
  },
];

const MOCK_PAYMENTS: Payment[] = [
  { id: 'PAY-5001', orderId: 'ORD-2043', customer: 'Jane Doe',        amount: 21700, method: 'GCash',            status: 'Paid',     date: '2026-03-07' },
  { id: 'PAY-5002', orderId: 'ORD-2042', customer: 'John Smith',      amount: 12400, method: 'Bank Transfer',    status: 'Paid',     date: '2026-03-06' },
  { id: 'PAY-5003', orderId: 'ORD-2041', customer: 'MJ Interiors',    amount: 35400, method: 'Maya',             status: 'Unpaid',   date: '2026-03-05' },
  { id: 'PAY-5004', orderId: 'ORD-2040', customer: 'Andrea Cruz',     amount: 19900, method: 'GCash',            status: 'Paid',     date: '2026-03-02' },
  { id: 'PAY-5005', orderId: 'ORD-2039', customer: 'Carlos Reyes',    amount: 6750,  method: 'Card',             status: 'Refunded', date: '2026-02-28' },
  { id: 'PAY-5006', orderId: 'ORD-2038', customer: 'Sofia Lim',       amount: 14400, method: 'Maya',             status: 'Unpaid',   date: '2026-02-25' },
  { id: 'PAY-5007', orderId: 'ORD-2037', customer: 'Mark Reyes',      amount: 14400, method: 'GCash',            status: 'Paid',     date: '2026-02-20' },
  { id: 'PAY-5008', orderId: 'ORD-2036', customer: 'Anna Villanueva', amount: 14000, method: 'Bank Transfer',    status: 'Failed',   date: '2026-02-18' },
];

const ALL_STATUSES: Array<OrderStatus | 'All'> = ['All', 'Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
const ALL_PAYMENT_STATUSES: Array<PaymentStatus | 'All'> = ['All', 'Paid', 'Unpaid', 'Refunded', 'Failed'];
const PER_PAGE_OPTIONS = [5, 10, 20];

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);

// ─── Payment Status Badge ─────────────────────────────────────────────────────

const paymentStatusStyles: Record<PaymentStatus, string> = {
  Paid:     'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Unpaid:   'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  Refunded: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  Failed:   'bg-rose-500/15 text-rose-700 dark:text-rose-300',
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
  const rangeEnd   = Math.min(page * limit, total);

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i);
    }
    return range;
  }, [page, totalPages]);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="flex h-8 w-6 items-end justify-center pb-1 text-xs text-muted-foreground">…</span>}
            <button onClick={() => onPageChange(totalPages)} className="h-8 w-8 rounded-none text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">{totalPages}</button>
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
  const [activeTab, setActiveTab]       = useState<Tab>('orders');

  // Orders state
  const [query, setQuery]               = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [dateFilter, setDateFilter]     = useState('');
  const [page, setPage]                 = useState(1);
  const [limit, setLimit]               = useState(5);
  const [openOrderId, setOpenOrderId]   = useState<string | null>(null);

  // Payment state
  const [payQuery, setPayQuery]                   = useState('');
  const [payStatusFilter, setPayStatusFilter]     = useState<PaymentStatus | 'All'>('All');
  const [payDateFilter, setPayDateFilter]         = useState('');
  const [payPage, setPayPage]                     = useState(1);
  const [payLimit, setPayLimit]                   = useState(5);

  const selectedOrder = useMemo(
    () => MOCK_ORDERS.find((o) => o.id === openOrderId) ?? null,
    [openOrderId]
  );

  // ── Orders pipeline ──────────────────────────────────────────────────────

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_ORDERS.filter((o) => {
      const matchesQuery  = !q || o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      const matchesDate   = !dateFilter || o.orderDate === dateFilter;
      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [query, statusFilter, dateFilter]);

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
    return MOCK_PAYMENTS.filter((p) => {
      const matchesQuery  = !q || p.id.toLowerCase().includes(q) || p.customer.toLowerCase().includes(q) || p.orderId.toLowerCase().includes(q);
      const matchesStatus = payStatusFilter === 'All' || p.status === payStatusFilter;
      const matchesDate   = !payDateFilter || p.date === payDateFilter;
      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [payQuery, payStatusFilter, payDateFilter]);

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

  function resetOrderFilters() {
    setQuery(''); setStatusFilter('All'); setDateFilter(''); setPage(1);
  }

  function resetPaymentFilters() {
    setPayQuery(''); setPayStatusFilter('All'); setPayDateFilter(''); setPayPage(1);
  }

  return (
    <section className="min-h-screen bg-background/60">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <AdminPageHeader
          title="Orders"
          description="Track orders, update statuses, and view payment history."
        />

        {/* ── Sub Nav ── */}
        <div className="flex items-center gap-0 border-b border-border">
          {(['orders', 'payment-history'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={cn(
                'relative px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors',
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
          <>
            {/* Filters */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    placeholder="Search by ID or customer…"
                    className="h-11 rounded-none pl-10"
                  />
                </div>

                {/* Status filter */}
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as OrderStatus | 'All'); setPage(1); }}>
                  <SelectTrigger className="h-11 w-full rounded-none border-border bg-transparent text-sm sm:w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border">
                    {ALL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="rounded-none">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date filter */}
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                  className="h-11 w-full rounded-none border-border bg-transparent text-sm sm:w-[200px]"
                />
              </div>

              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-border bg-card/80 shadow-sm">
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    {['Order ID', 'Customer Name', 'Items Count', 'Total Amount', 'Status', 'Order Date', 'Actions'].map((h) => (
                      <TableHead key={h} className="px-4">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{h}</span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedOrders.map((o) => {
                    const itemsCount = o.items.reduce((sum, i) => sum + i.qty, 0);
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.id}</TableCell>
                        <TableCell className="px-4 py-3 text-sm font-medium text-foreground">{o.customerName}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-muted-foreground">{itemsCount}</TableCell>
                        <TableCell className="px-4 py-3 text-sm font-semibold text-foreground">{formatCurrency(o.totalAmount)}</TableCell>
                        <TableCell className="px-4 py-3"><OrderStatusBadge status={o.status} /></TableCell>
                        <TableCell className="px-4 py-3 text-sm text-muted-foreground">{o.orderDate}</TableCell>
                        <TableCell className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-none border-border">
                              <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                {o.id}
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
                  })}

                  {pagedOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="px-6 py-16">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="mb-4 h-px w-12 bg-border" />
                          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">No orders found</p>
                          <p className="mt-2 text-xs text-muted-foreground/70">Try adjusting your filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <TablePagination
                pagination={orderPagination}
                onPageChange={setPage}
                onLimitChange={(n) => { setLimit(n); setPage(1); }}
                itemLabel="order"
              />
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PAYMENT HISTORY TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'payment-history' && (
          <>
            {/* Filters */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={payQuery}
                    onChange={(e) => { setPayQuery(e.target.value); setPayPage(1); }}
                    placeholder="Search by ID or customer…"
                    className="h-11 rounded-none pl-10"
                  />
                </div>

                {/* Payment status filter */}
                <Select value={payStatusFilter} onValueChange={(v) => { setPayStatusFilter(v as PaymentStatus | 'All'); setPayPage(1); }}>
                  <SelectTrigger className="h-11 w-full rounded-none border-border bg-transparent text-sm sm:w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border">
                    {ALL_PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="rounded-none">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date filter */}
                <Input
                  type="date"
                  value={payDateFilter}
                  onChange={(e) => { setPayDateFilter(e.target.value); setPayPage(1); }}
                  className="h-11 w-full rounded-none border-border bg-transparent text-sm sm:w-[200px]"
                />
              </div>

              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {filteredPayments.length} payment{filteredPayments.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-border bg-card/80 shadow-sm">
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    {['Payment ID', 'Order ID', 'Customer', 'Amount', 'Method', 'Status', 'Date'].map((h) => (
                      <TableHead key={h} className="px-4">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{h}</span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.id}</TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.orderId}</TableCell>
                      <TableCell className="px-4 py-3 text-sm font-medium text-foreground">{p.customer}</TableCell>
                      <TableCell className="px-4 py-3 text-sm font-semibold text-foreground">{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">{p.method}</TableCell>
                      <TableCell className="px-4 py-3"><PaymentStatusBadge status={p.status} /></TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">{p.date}</TableCell>
                    </TableRow>
                  ))}

                  {pagedPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="px-6 py-16">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="mb-4 h-px w-12 bg-border" />
                          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">No payments found</p>
                          <p className="mt-2 text-xs text-muted-foreground/70">Try adjusting your filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <TablePagination
                pagination={paymentPagination}
                onPageChange={setPayPage}
                onLimitChange={(n) => { setPayLimit(n); setPayPage(1); }}
                itemLabel="payment"
              />
            </div>
          </>
        )}
      </div>

      {/* ── Order Details Dialog ── */}
      <Dialog open={!!openOrderId} onOpenChange={(o) => !o && setOpenOrderId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder && <span className="font-mono text-xs">{selectedOrder.id}</span>}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Customer</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{selectedOrder.customerName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedOrder.phone}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Payment</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{selectedOrder.paymentMethod}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedOrder.orderDate}</p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Address</p>
                <p className="mt-1 text-sm text-foreground">{selectedOrder.address}</p>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <div className="bg-muted/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ordered Products</p>
                </div>
                <div className="divide-y divide-border">
                  {selectedOrder.items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
                      </div>
                      <p className="font-semibold text-foreground">{formatCurrency(item.price * item.qty)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-muted/40 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</span>
                    <OrderStatusBadge status={selectedOrder.status} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(selectedOrder.totalAmount)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}