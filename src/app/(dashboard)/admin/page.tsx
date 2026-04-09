'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, ArrowUpRight, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { NotificationBell } from '@/components/ui/notification-bell';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminPageHeader from '@/components/pages/admin/components/admin-page-header';
import StatCard from '@/components/pages/admin/components/stat-card';
import OrderStatusBadge, {
  type OrderStatus,
} from '@/components/pages/admin/components/order-status-badge';

const AdminDashboardPage = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [page, setPage] = useState(1);
  const perPage = 4;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const stats = [
    {
      title: 'Total Products',
      value: 128,
      icon: <Package className="h-4 w-4" />,
      href: '/admin/products',
      change: '+4 this week',
      trend: 'up',
    },
    {
      title: 'Total Orders',
      value: 542,
      icon: <ShoppingCart className="h-4 w-4" />,
      href: '/admin/orders',
      change: '+21 this week',
      trend: 'up',
    },
    {
      title: 'Total Customers',
      value: 312,
      icon: <Users className="h-4 w-4" />,
      href: '/admin/customers',
      change: '+8 this week',
      trend: 'up',
    },
    {
      title: 'Total Revenue',
      value: '₱1,284,900',
      icon: <DollarSign className="h-4 w-4" />,
      href: '/admin/orders',
      change: '+₱84,200 this week',
      trend: 'up',
    },
  ];

  const recentProducts = [
    {
      id: 'P-1021',
      name: 'Evergreen Blackout Blinds',
      category: 'Blinds',
      createdAt: '2026-03-06',
    },
    {
      id: 'P-1019',
      name: 'Sunrise Sheer Curtains',
      category: 'Curtains',
      createdAt: '2026-03-05',
    },
    {
      id: 'P-1018',
      name: 'Phantom Roller Shades',
      category: 'Roller Shades',
      createdAt: '2026-03-04',
    },
    {
      id: 'P-1017',
      name: 'Nordic Linen Drapes',
      category: 'Curtains',
      createdAt: '2026-03-03',
    },
  ];

  const recentOrders = [
    {
      id: 'ORD-2043',
      customer: 'Jane Doe',
      total: '₱24,500',
      status: 'Processing' as OrderStatus,
      createdAt: '2026-03-07',
    },
    {
      id: 'ORD-2042',
      customer: 'John Smith',
      total: '₱18,200',
      status: 'Completed' as OrderStatus,
      createdAt: '2026-03-06',
    },
    {
      id: 'ORD-2041',
      customer: 'MJ Interiors',
      total: '₱72,900',
      status: 'Pending' as OrderStatus,
      createdAt: '2026-03-05',
    },
    {
      id: 'ORD-2040',
      customer: 'Anna Cruz',
      total: '₱9,750',
      status: 'Completed' as OrderStatus,
      createdAt: '2026-03-04',
    },
    {
      id: 'ORD-2039',
      customer: 'Robert King',
      total: '₱35,100',
      status: 'Processing' as OrderStatus,
      createdAt: '2026-03-03',
    },
    {
      id: 'ORD-2038',
      customer: 'Sarah Lee',
      total: '₱12,000',
      status: 'Pending' as OrderStatus,
      createdAt: '2026-03-02',
    },
  ];

  const filteredOrders = recentOrders.filter((order) => {
    const matchesSearch = order.customer.toLowerCase().includes(search.toLowerCase()) || order.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / perPage) || 1;
  const paginatedOrders = filteredOrders.slice((page - 1) * perPage, page * perPage);

  const chartDays = [
    { label: 'M', value: 8 },
    { label: 'T', value: 12 },
    { label: 'W', value: 6 },
    { label: 'T', value: 14 },
    { label: 'F', value: 10 },
    { label: 'S', value: 4 },
    { label: 'S', value: 9 },
  ];

  const maxValue = Math.max(...chartDays.map((d) => d.value));

  if (!isMounted) {
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="w-full max-w-[1400px] mx-auto px-6 py-8 space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <AdminPageHeader
            title="Dashboard"
            description="Quick overview of your store performance, orders, customers, and activity."
          />
          <div className="flex items-center gap-4 pb-0.5 justify-between md:justify-end">
            <p className="text-xs text-muted-foreground hidden sm:block">
              Last updated: March 25, 2026
            </p>
            <NotificationBell />
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.title}
              href={stat.href}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-border/80 hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground group-hover:text-foreground transition-colors">
                  {stat.icon}
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>

              {/* Value */}
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {stat.title}
              </p>

              {/* Trend */}
              <div className="mt-3 flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  {stat.change}
                </span>
              </div>

              {/* Subtle background accent */}
              <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-primary/5 blur-2xl" />
            </Link>
          ))}
        </section>

        {/* ── Analytics + Recent sections ── */}
        <section className="grid gap-6 lg:grid-cols-5">

          {/* Orders Chart — spans 2 cols */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Orders Overview
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Last 7 days
                </p>
              </div>
              <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Sample
              </span>
            </div>

            <div className="px-5 pb-5 pt-4">
              {/* Summary row */}
              <div className="mb-5 flex items-end gap-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">63</span>
                <span className="mb-1 text-xs text-muted-foreground">total orders this week</span>
              </div>

              {/* Bar chart */}
              <div className="flex h-32 items-end gap-2">
                {chartDays.map((day, idx) => (
                  <div key={idx} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex w-full items-end justify-center" style={{ height: '100px' }}>
                      <div
                        className="w-full max-w-[28px] rounded-t-md bg-primary/80 hover:bg-primary transition-colors duration-150"
                        style={{ height: `${(day.value / maxValue) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                Connect to real order data once your API is live.
              </p>
            </div>
          </div>

          {/* Recent Products — spans 1.5 cols */}
          <div className="lg:col-span-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Recent Products</h2>
              <Link
                href="/admin/products"
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/70 transition-colors"
              >
                View all
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <ul className="divide-y divide-border">
              {recentProducts.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-medium text-foreground">
                      {product.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {product.category} · {product.createdAt}
                    </p>
                  </div>
                  <span className="ml-3 flex-shrink-0 font-mono text-[11px] text-muted-foreground">
                    {product.id}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Orders — spans 1.5 cols */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border px-5 py-4 gap-4">
              <div className="flex items-center justify-between w-full sm:w-auto">
                <h2 className="text-sm font-semibold text-foreground">Recent Orders</h2>
                <Link
                  href="/admin/orders"
                  className="flex sm:hidden items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/70 transition-colors"
                >
                  View all
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-40">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="h-8 w-full pl-8 text-xs bg-background"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                  <SelectTrigger className="h-8 w-[110px] text-xs bg-background">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Link
                  href="/admin/orders"
                  className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/70 transition-colors ml-2"
                >
                  View all
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border bg-muted/30 px-5 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Customer</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-right">Amount</span>
            </div>

            <ul className="divide-y divide-border flex-1">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <li
                    key={order.id}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{order.customer}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{order.id} · {order.createdAt}</p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                    <p className="text-right text-sm font-semibold tabular-nums text-foreground">
                      {order.total}
                    </p>
                  </li>
                ))
              ) : (
                <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No orders found.
                </li>
              )}
            </ul>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-5 py-3 mt-auto">
                <span className="text-[11px] text-muted-foreground">
                  Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filteredOrders.length)} of {filteredOrders.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1 rounded-md hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] font-medium px-2">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1 rounded-md hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default AdminDashboardPage;