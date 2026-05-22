'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type OrderStatus } from '@/components/pages/admin/components/order-status-badge';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_STATUSES: Array<OrderStatus | 'All'> = [
  'All',
  'Pending',
  'Processing',
  'Shipped',
  'Completed',
  'Cancelled',
];

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderFilters = {
  query: string;
  statusFilter: OrderStatus | 'All';
  dateFilter: string;
};

type OrdersHeaderProps = {
  filters: OrderFilters;
  onFiltersChange: (filters: Partial<OrderFilters>) => void;
  totalItems: number;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OrdersHeader({ filters, onFiltersChange, totalItems }: OrdersHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.query}
            onChange={(e) => onFiltersChange({ query: e.target.value })}
            placeholder="Search by ID or customer…"
            className="h-9 rounded-none pl-10 text-sm"
          />
        </div>

        {/* Status filter */}
        <Select
          value={filters.statusFilter}
          onValueChange={(v) => onFiltersChange({ statusFilter: v as OrderStatus | 'All' })}
        >
          <SelectTrigger className="h-9 w-full rounded-none border-border bg-transparent text-sm sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="rounded-none text-sm">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date filter */}
        <Input
          type="date"
          value={filters.dateFilter}
          onChange={(e) => onFiltersChange({ dateFilter: e.target.value })}
          className="h-9 w-full rounded-none border-border bg-transparent text-sm sm:w-44"
        />
      </div>

      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {totalItems} order{totalItems === 1 ? '' : 's'}
      </p>
    </div>
  );
}
