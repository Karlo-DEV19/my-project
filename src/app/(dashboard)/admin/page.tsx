'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, TrendingDown, Minus, ArrowUpRight, Search, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import { NotificationBell } from '@/components/ui/notification-bell';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminPageHeader from '@/components/pages/admin/components/admin-page-header';
import StatCard from '@/components/pages/admin/components/stat-card';
import OrderStatusBadge, {
  type OrderStatus,
} from '@/components/pages/admin/components/order-status-badge';
import { useGetDashboardStats, useGetMonthlySales } from '@/app/api/hooks/use-order';

/** Capitalise first letter so DB lowercase statuses match the OrderStatus union */
function toOrderStatus(raw: string): OrderStatus {
  return (raw.charAt(0).toUpperCase() + raw.slice(1)) as OrderStatus;
}

type ForecastEntry = { month: string; value: number };
type Trend = 'increasing' | 'decreasing' | 'stable';
type ForecastInsight = {
  trend: Trend;
  lastHistorical: number;
  firstForecast: number;
  pctChange: number;
};

const AdminDashboardPage = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [page, setPage] = useState(1);
  const [monthRange, setMonthRange] = useState<6 | 12>(12);
  const perPage = 4;

  // ── ARIMA Forecast ──────────────────────────────────────────────────────────
  const [forecastData, setForecastData] = useState<ForecastEntry[]>([]);
  const [forecastInsight, setForecastInsight] = useState<ForecastInsight | null>(null);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState<string | null>(null);

  useEffect(() => {
    async function loadForecast() {
      try {
        const res = await fetch('/api/forecast');
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();

        if (json.error) throw new Error(json.error);

        // ── Parse forecast entries ──────────────────────────────────────────
        const forecastEntries: ForecastEntry[] = Object.entries(
          json.forecast as Record<string, number>
        )
          .slice(0, 3)
          .map(([dateStr, val]) => {
            const d = new Date(dateStr);
            const month = d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
            return { month, value: val };
          });

        setForecastData(forecastEntries);

        // ── Derive trend insight ─────────────────────────────────────────────
        const historicalValues = Object.values(json.historical as Record<string, number>);
        if (historicalValues.length > 0 && forecastEntries.length > 0) {
          const lastHistorical = historicalValues[historicalValues.length - 1];
          const firstForecast = forecastEntries[0].value;
          const pctChange = ((firstForecast - lastHistorical) / lastHistorical) * 100;

          let trend: Trend;
          if (pctChange > 1) trend = 'increasing';
          else if (pctChange < -1) trend = 'decreasing';
          else trend = 'stable';

          setForecastInsight({ trend, lastHistorical, firstForecast, pctChange });
        }
      } catch (err: unknown) {
        setForecastError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setForecastLoading(false);
      }
    }

    loadForecast();
  }, []);

  const { data: dashboardData, isPending: isDashboardLoading } = useGetDashboardStats();
  const { data: monthlySalesData, isPending: isMonthlySalesLoading } = useGetMonthlySales(monthRange);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalRevenue = dashboardData?.totalRevenue ?? 0;
  const formattedRevenue = isDashboardLoading
    ? '…'
    : `₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const stats = [
    {
      title: 'Total Products',
      value: isDashboardLoading ? '…' : (dashboardData?.totalProducts ?? 0),
      icon: <Package className="h-4 w-4" />,
      href: '/admin/products',
      change: '+4 this week',
      trend: 'up',
    },
    {
      title: 'Total Orders',
      value: isDashboardLoading ? '…' : (dashboardData?.totalOrders ?? 0),
      icon: <ShoppingCart className="h-4 w-4" />,
      href: '/admin/orders',
      change: '+21 this week',
      trend: 'up',
    },
    {
      title: 'Total Customers',
      value: isDashboardLoading ? '…' : (dashboardData?.totalCustomers ?? 0),
      icon: <Users className="h-4 w-4" />,
      href: '/admin/customers',
      change: '+8 this week',
      trend: 'up',
    },
    {
      title: 'Total Revenue',
      value: formattedRevenue,
      icon: <DollarSign className="h-4 w-4" />,
      href: '/admin/orders',
      change: '+₱84,200 this week',
      trend: 'up',
    },
  ];

  const recentProducts = (dashboardData?.recentProducts ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    createdAt: p.createdAt,
  }));

  const recentOrders = (dashboardData?.recentOrders ?? []).map((o) => ({
    id: o.id,
    customer: o.customer,
    total: o.total,
    status: toOrderStatus(o.status),
    createdAt: o.createdAt,
  }));

  const filteredOrders = recentOrders.filter((order) => {
    const matchesSearch = order.customer.toLowerCase().includes(search.toLowerCase()) || order.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / perPage) || 1;
  const paginatedOrders = filteredOrders.slice((page - 1) * perPage, page * perPage);

  const chartDays = dashboardData?.ordersPerDay ?? [
    { label: 'M', value: 0 },
    { label: 'T', value: 0 },
    { label: 'W', value: 0 },
    { label: 'T', value: 0 },
    { label: 'F', value: 0 },
    { label: 'S', value: 0 },
    { label: 'S', value: 0 },
  ];

  const maxValue = Math.max(...chartDays.map((d) => d.value), 1);

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
              Last updated: {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
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
                Live
              </span>
            </div>

            <div className="px-5 pb-5 pt-4">
              {/* Summary row */}
              <div className="mb-5 flex items-end gap-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">{dashboardData?.totalOrdersThisWeek ?? 0}</span>
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
                Showing real order data from the last 7 days.
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
                    <p
                      className="truncate text-sm font-medium text-foreground cursor-pointer hover:underline"
                      onClick={() => router.push(`/admin/products?id=${product.id}`)}
                    >
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
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/admin/orders?id=${order.id}`)}
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

        {/* ── Monthly Sales ── */}
        <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border px-5 py-4 gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Monthly Sales</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Completed orders — revenue over time</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Grand total badge */}
              <span className="text-[11px] text-muted-foreground">
                Total:{' '}
                <span className="font-semibold text-foreground">
                  {isMonthlySalesLoading
                    ? '…'
                    : `₱${(monthlySalesData?.grandTotal ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                </span>
              </span>
              {/* Range toggle */}
              <div className="flex items-center rounded-lg border border-border bg-background overflow-hidden">
                {([6, 12] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setMonthRange(n)}
                    className={`px-3 py-1 text-[11px] font-medium transition-colors ${monthRange === n
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {n}M
                  </button>
                ))}
              </div>
              <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Live
              </span>
            </div>
          </div>

          <div className="px-5 pb-6 pt-5">
            {isMonthlySalesLoading ? (
              <div className="flex h-40 items-center justify-center">
                <span className="text-sm text-muted-foreground">…</span>
              </div>
            ) : (() => {
              const entries = monthlySalesData?.monthlySales ?? [];
              const maxSales = Math.max(...entries.map((e) => e.total), 1);
              const W = 800;
              const H = 120;
              const padX = 0;
              const padY = 8;
              const chartH = H - padY * 2;

              const points = entries.map((e, i) => ({
                x: entries.length > 1 ? padX + (i / (entries.length - 1)) * (W - padX * 2) : W / 2,
                y: padY + chartH - (e.total / maxSales) * chartH,
                ...e,
              }));

              const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
              const fillPath = points.length > 1
                ? `M${points[0].x},${H} ` +
                points.map((p) => `L${p.x},${p.y}`).join(' ') +
                ` L${points[points.length - 1].x},${H} Z`
                : '';

              return (
                <div>
                  {/* SVG line chart */}
                  <div className="w-full" style={{ height: '160px' }}>
                    <svg
                      viewBox={`0 0 ${W} ${H}`}
                      preserveAspectRatio="none"
                      className="w-full h-full"
                    >
                      {/* Subtle fill under the line */}
                      {fillPath && (
                        <path
                          d={fillPath}
                          fill="currentColor"
                          className="text-primary/10"
                        />
                      )}
                      {/* Main line */}
                      <polyline
                        points={polyline}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        className="text-primary/80"
                      />
                      {/* Data point dots */}
                      {points.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r="3"
                          fill="currentColor"
                          className="text-primary"
                        />
                      ))}
                    </svg>
                  </div>

                  {/* Month x-axis labels */}
                  <div className="flex mt-2" style={{ paddingLeft: 0, paddingRight: 0 }}>
                    {entries.map((e, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                          {e.label}
                        </span>
                        <span className="text-[9px] text-muted-foreground/60">
                          {e.month.slice(0, 4)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Value table below chart */}
                  <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-x-2 gap-y-3">
                    {entries.map((e, i) => (
                      <div key={i} className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{e.label} {e.month.slice(0, 4)}</span>
                        <span className="text-xs font-semibold tabular-nums text-foreground">
                          {e.total > 0
                            ? `₱${e.total.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                            : <span className="text-muted-foreground/50">—</span>}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                    Showing completed-order revenue for the last {monthRange} months.
                  </p>
                </div>
              );
            })()}
          </div>
        </section>

        {/* ── ARIMA Forecast ── */}
        <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
                <BarChart2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Forecast (Next 3 Months)</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">ARIMA model · predicted sales revenue</p>
              </div>
            </div>
            <span className="rounded-full border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
              AI
            </span>
          </div>

          <div className="px-5 py-5">
            {forecastLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading forecast…
              </div>
            ) : forecastError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                <p className="text-sm font-medium text-destructive">Forecast unavailable</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{forecastError}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Make sure the ARIMA service is running: <code className="font-mono bg-muted px-1 rounded text-[10px]">uvicorn arima-service.main:app --reload</code></p>
              </div>
            ) : forecastData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No forecast data returned.</p>
            ) : (
              <div className="space-y-4">
                {/* ── 3 forecast cards ── */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {forecastData.map((entry, idx) => (
                    <div
                      key={idx}
                      className="group relative overflow-hidden rounded-xl border border-border bg-background px-5 py-4 transition-all duration-200 hover:border-amber-300/60 hover:shadow-md hover:-translate-y-0.5"
                    >
                      {/* Accent glow */}
                      <div className="pointer-events-none absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-amber-400/10 blur-2xl" />

                      <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                        {entry.month}
                      </p>
                      <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
                        ₱{entry.value.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <div className="mt-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-amber-500" />
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">Predicted</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── System Recommendation ── */}
                {forecastInsight && (() => {
                  const { trend, lastHistorical, firstForecast, pctChange } = forecastInsight;

                  const config = {
                    increasing: {
                      border: 'border-emerald-300/60',
                      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
                      glow: 'bg-emerald-400/10',
                      badge: 'border-emerald-300/60 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
                      trendLabel: 'Increasing Trend',
                      recommendation: 'Sales are expected to increase. Consider increasing inventory.',
                      Icon: TrendingUp,
                      iconColor: 'text-emerald-500',
                      titleColor: 'text-emerald-700 dark:text-emerald-400',
                    },
                    decreasing: {
                      border: 'border-red-300/60',
                      bg: 'bg-red-50 dark:bg-red-950/20',
                      glow: 'bg-red-400/10',
                      badge: 'border-red-300/60 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400',
                      trendLabel: 'Decreasing Trend',
                      recommendation: 'Sales may decline. Reduce stock levels to avoid overstock.',
                      Icon: TrendingDown,
                      iconColor: 'text-red-500',
                      titleColor: 'text-red-700 dark:text-red-400',
                    },
                    stable: {
                      border: 'border-border',
                      bg: 'bg-muted/30',
                      glow: 'bg-muted/20',
                      badge: 'border-border bg-muted text-muted-foreground',
                      trendLabel: 'Stable Trend',
                      recommendation: 'Sales are stable. Maintain current inventory levels.',
                      Icon: Minus,
                      iconColor: 'text-muted-foreground',
                      titleColor: 'text-muted-foreground',
                    },
                  }[trend];

                  const fmt = (v: number) =>
                    `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

                  return (
                    <div className={`relative overflow-hidden rounded-xl border ${config.border} ${config.bg}`}>
                      <div className={`pointer-events-none absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full ${config.glow} blur-2xl`} />

                      {/* Section header */}
                      <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          System Recommendation
                        </p>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${config.badge}`}>
                          {config.trendLabel}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
                        {/* Left: icon + recommendation */}
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${config.badge}`}>
                            <config.Icon className={`h-4 w-4 ${config.iconColor}`} />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${config.titleColor}`}>
                              {config.recommendation}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Based on ARIMA forecast · Last recorded:{' '}
                              <span className="font-medium text-foreground">{fmt(lastHistorical)}</span>
                              {' → '}
                              Next forecast:{' '}
                              <span className="font-medium text-foreground">{fmt(firstForecast)}</span>
                            </p>
                          </div>
                        </div>

                        {/* Right: % change pill */}
                        <div className="flex-shrink-0 self-end sm:self-auto">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold tabular-nums ${config.badge}`}>
                            <config.Icon className="h-3 w-3" />
                            {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default AdminDashboardPage;