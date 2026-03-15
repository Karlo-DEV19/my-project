'use client';

import React, { useMemo, useState } from 'react';
import { Search, Eye, Trash2, RefreshCcw } from 'lucide-react';
import AdminPageHeader from '@/components/pages/admin/components/admin-page-header';
import OrderStatusBadge, {
  type OrderStatus,
} from '@/components/pages/admin/components/order-status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DataPagination, { type PaginationData } from '@/components/ui/data-pagination';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2043',
    customerName: 'Jane Doe',
    items: [
      { name: 'Evergreen Blackout Blinds', qty: 1, price: 8200 },
      { name: 'Afternoon Sheer Curtains', qty: 2, price: 6750 },
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
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);

const ALL_STATUSES: Array<OrderStatus | 'All'> = [
  'All',
  'Pending',
  'Processing',
  'Shipped',
  'Completed',
  'Cancelled',
];

export default function OrdersPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const selectedOrder = useMemo(
    () => MOCK_ORDERS.find((o) => o.id === openOrderId) ?? null,
    [openOrderId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_ORDERS.filter((o) => {
      const matchesQuery = !q || o.id.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, currentPage, perPage]);

  const pagination: PaginationData = {
    currentPage,
    totalPages,
    totalItems,
    perPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };

  return (
    <section className="min-h-screen bg-background/60">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <AdminPageHeader
          title="Orders"
          description="Track orders, update statuses, and view order details."
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by Order ID…"
                className="h-11 rounded-none pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as OrderStatus | 'All');
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 w-full rounded-none border-border bg-transparent text-sm sm:w-[220px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="rounded-none">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {totalItems} order{totalItems === 1 ? '' : 's'}
            </p>
            <Button
              variant="outline"
              className="h-11 rounded-none border-border bg-transparent text-xs font-semibold uppercase tracking-[0.18em]"
              onClick={() => {
                setQuery('');
                setStatusFilter('All');
                setPage(1);
              }}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card/80 shadow-sm">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Order ID
                  </span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Customer Name
                  </span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Items Count
                  </span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Total Amount
                  </span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Status
                  </span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Order Date
                  </span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Actions
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((o) => {
                const itemsCount = o.items.reduce((sum, i) => sum + i.qty, 0);
                return (
                  <TableRow key={o.id}>
                    <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {o.id}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-medium text-foreground">
                      {o.customerName}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                      {itemsCount}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold text-foreground">
                      {formatCurrency(o.totalAmount)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                      {o.orderDate}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-none border-border bg-transparent text-xs font-semibold uppercase tracking-[0.18em]"
                          onClick={() => setOpenOrderId(o.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>

                        <Select
                          value={o.status}
                          onValueChange={() => {
                            // Hook up to API later
                          }}
                        >
                          <SelectTrigger className="h-9 w-[160px] rounded-none border-border bg-transparent text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-none border-border">
                            {ALL_STATUSES.filter((s): s is OrderStatus => s !== 'All').map(
                              (s) => (
                                <SelectItem key={s} value={s} className="rounded-none">
                                  {s}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-none text-xs font-semibold uppercase tracking-[0.18em] text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-4 h-px w-12 bg-border" />
                      <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        No orders found
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground/70">
                        Try adjusting your filters.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <div className="px-4 pb-4">
            <DataPagination
              pagination={pagination}
              onPageChange={setPage}
              onPerPageChange={(n) => {
                setPerPage(n);
                setPage(1);
              }}
              itemLabel="order"
              itemLabelPlural="orders"
              showPerPageSelector
              showFirstLast
            />
          </div>
        </div>

        <Dialog open={!!openOrderId} onOpenChange={(o) => !o && setOpenOrderId(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif">Order Details</DialogTitle>
              <DialogDescription>
                {selectedOrder ? (
                  <span className="font-mono text-xs">{selectedOrder.id}</span>
                ) : null}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Customer
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {selectedOrder.customerName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedOrder.phone}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Payment
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {selectedOrder.paymentMethod}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedOrder.orderDate}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Address
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {selectedOrder.address}
                  </p>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="bg-muted/60 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Ordered Products
                    </p>
                  </div>
                  <div className="divide-y divide-border">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
                        </div>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(item.price * item.qty)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between bg-muted/40 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Status
                      </span>
                      <OrderStatusBadge status={selectedOrder.status} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Total
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}