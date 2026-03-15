'use client';

import React from 'react';
import Link from 'next/link';
import { DollarSign, Package, ShoppingCart, Users } from 'lucide-react';
import AdminPageHeader from '@/components/pages/admin/components/admin-page-header';
import StatCard from '@/components/pages/admin/components/stat-card';
import OrderStatusBadge, {
  type OrderStatus,
} from '@/components/pages/admin/components/order-status-badge';

const AdminDashboardPage = () => {
  const stats = [
    {
      title: 'Total Products',
      value: 128,
      icon: <Package className="h-5 w-5" />,
      href: '/admin/products',
    },
    {
      title: 'Total Orders',
      value: 542,
      icon: <ShoppingCart className="h-5 w-5" />,
      href: '/admin/orders',
    },
    {
      title: 'Total Customers',
      value: 312,
      icon: <Users className="h-5 w-5" />,
      href: '/admin/customers',
    },
    {
      title: 'Total Revenue',
      value: '₱1,284,900',
      icon: <DollarSign className="h-5 w-5" />,
      href: '/admin/orders',
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
  ];

  return (
    <div className="min-h-screen bg-background/60">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <AdminPageHeader
          title="Dashboard"
          description="Quick overview of your store performance, orders, customers, and activity."
        />

        {/* Stat cards */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              href={stat.href}
            />
          ))}
        </section>

        {/* Analytics + Recent sections */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Simple Orders Analytics (dummy data for now) */}
          <div className="rounded-xl border border-border bg-card/80 p-5 shadow-sm xl:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Orders Overview (Last 7 Days)
              </h2>
              <span className="text-[11px] text-muted-foreground">
                Sample analytics
              </span>
            </div>
            <div className="flex h-40 items-end gap-3 rounded-lg border border-border/60 bg-background/40 px-4 pb-4 pt-3">
              {[
                { label: "M", value: 8 },
                { label: "T", value: 12 },
                { label: "W", value: 6 },
                { label: "T", value: 14 },
                { label: "F", value: 10 },
                { label: "S", value: 4 },
                { label: "S", value: 9 },
              ].map((day) => (
                <div
                  key={day.label + day.value}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <div className="flex h-full w-full items-end justify-center">
                    <div
                      className="w-5 rounded-full bg-primary/80 shadow-sm"
                      style={{ height: `${(day.value / 16) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Visual snapshot of daily order volume. Hook this up to real order data once your API is connected.
            </p>
          </div>

          {/* Recent Products */}
          <div className="rounded-xl border border-border bg-card/80 p-5 shadow-sm xl:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Recent Products
              </h2>
              <Link
                href="/admin/products"
                className="text-xs font-medium text-primary hover:text-primary/80"
              >
                View all
              </Link>
            </div>
            <div className="overflow-hidden rounded-lg border border-border/60 bg-background/40">
              <ul className="divide-y divide-border/70">
                {recentProducts.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/60"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium text-foreground">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.category} · Added {product.createdAt}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {product.id}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="rounded-xl border border-border bg-card/80 p-5 shadow-sm xl:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Recent Orders
              </h2>
              <Link
                href="/admin/orders"
                className="text-xs font-medium text-primary hover:text-primary/80"
              >
                View all
              </Link>
            </div>
            <div className="overflow-hidden rounded-lg border border-border/60 bg-background/40">
              <ul className="divide-y divide-border/70">
                {recentOrders.map((order) => (
                  <li
                    key={order.id}
                    className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/60"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {order.customer}
                        </p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {order.createdAt}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {order.total}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {order.id}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardPage;