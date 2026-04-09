"use client";

import React, { useState, useMemo } from "react";
import { DollarSign, Receipt, ShoppingCart, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminPageHeader from "@/components/pages/admin/components/admin-page-header";
import StatCard from "@/components/pages/admin/components/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type SalesPoint = {
  date: string;
  revenue: number;
  orders: number;
};

const MOCK_SALES: SalesPoint[] = [
  { date: "Mar 12", revenue: 18200, orders: 5 },
  { date: "Mar 13", revenue: 24600, orders: 7 },
  { date: "Mar 14", revenue: 12100, orders: 3 },
  { date: "Mar 15", revenue: 30800, orders: 9 },
  { date: "Mar 16", revenue: 26500, orders: 8 },
  { date: "Mar 17", revenue: 19800, orders: 6 },
  { date: "Mar 18", revenue: 35200, orders: 10 },
];

type TransactionStatus = "Paid" | "Refunded" | "Pending";

type Transaction = {
  id: string;
  customer: string;
  date: string;
  amount: number;
  status: TransactionStatus;
  method: string;
};

const MOCK_TX: Transaction[] = [
  {
    id: "TX-7801",
    customer: "Jane Doe",
    date: "2026-03-18",
    amount: 24500,
    status: "Paid",
    method: "GCash",
  },
  {
    id: "TX-7800",
    customer: "John Smith",
    date: "2026-03-17",
    amount: 18200,
    status: "Paid",
    method: "Bank Transfer",
  },
  {
    id: "TX-7799",
    customer: "MJ Interiors",
    date: "2026-03-17",
    amount: 72900,
    status: "Pending",
    method: "Maya",
  },
  {
    id: "TX-7798",
    customer: "Andrea Cruz",
    date: "2026-03-16",
    amount: 9950,
    status: "Refunded",
    method: "Card",
  },
];

const statusStyles: Record<TransactionStatus, string> = {
  Paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Refunded: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

function TxStatusBadge({ status }: { status: TransactionStatus }) {
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);

export default function SalesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const totalRevenue = MOCK_SALES.reduce((sum, p) => sum + p.revenue, 0);
  const totalOrders = MOCK_SALES.reduce((sum, p) => sum + p.orders, 0);
  const totalSales = totalRevenue;

  const filteredTransactions = useMemo(() => {
    let result = MOCK_TX;

    if (statusFilter !== "All") {
      result = result.filter((tx) => tx.status === statusFilter);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.customer.toLowerCase().includes(q) ||
          tx.id.toLowerCase().includes(q) ||
          tx.method.toLowerCase().includes(q)
      );
    }

    return result;
  }, [searchQuery, statusFilter]);

  return (
    <section className="flex min-h-screen w-full flex-col bg-background/60">
      <div className="flex flex-1 flex-col gap-8 px-6 py-6 xl:px-10">
        <AdminPageHeader
          title="Sales"
          description="Mock analytics for sales performance and recent transactions."
        />

        {/* Stat Cards */}
        <section className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Total Sales"
            value={formatCurrency(totalSales)}
            icon={<DollarSign className="h-5 w-5" />}
            href="/admin/sales"
            subtitle="Last 7 days (mock)"
          />
          <StatCard
            title="Total Orders"
            value={totalOrders}
            icon={<ShoppingCart className="h-5 w-5" />}
            href="/admin/orders"
            subtitle="Last 7 days (mock)"
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(totalRevenue)}
            icon={<Receipt className="h-5 w-5" />}
            href="/admin/sales"
            subtitle="Gross revenue (mock)"
          />
        </section>

        {/* Chart + Transactions */}
        <section className="grid w-full flex-1 grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Area Chart */}
          <div className="flex flex-col rounded-xl border border-border bg-card/80 p-5 shadow-sm lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Sales (Last 7 Days)
              </h2>
              <span className="text-[11px] text-muted-foreground">
                Revenue (PHP)
              </span>
            </div>

            <div
              className="flex-1 rounded-lg border border-border/60 bg-background/40 p-3"
              style={{ minHeight: 320 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={MOCK_SALES}
                  margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 0,
                      fontSize: 12,
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#revenueFill)"
                    dot={{ r: 3, strokeWidth: 2, fill: "hsl(var(--background))" }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">
              Replace with real sales aggregation once backend analytics is connected.
            </p>
          </div>

          {/* Recent Transactions */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card/80 shadow-sm lg:col-span-2">
            <div className="flex flex-col gap-4 border-b border-border bg-muted/30 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Recent Transactions
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Latest payments and refunds (mock)
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row">
                <div className="relative w-full sm:w-40">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="h-8 w-full bg-background pl-8 text-xs font-sans"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-full sm:w-[110px] bg-background text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <Table className="w-full min-w-[480px]">
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead className="px-5">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Transaction
                      </span>
                    </TableHead>
                    <TableHead className="px-5">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Amount
                      </span>
                    </TableHead>
                    <TableHead className="px-5">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Status
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="px-5 py-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-foreground">
                              {tx.customer}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-mono">{tx.id}</span> · {tx.date} ·{" "}
                              {tx.method}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-3 text-sm font-semibold text-foreground">
                          {formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          <TxStatusBadge status={tx.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="px-5 py-8 text-center text-sm text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}