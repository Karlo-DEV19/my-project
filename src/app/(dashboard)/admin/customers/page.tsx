'use client';

import React, { useMemo, useState } from 'react';
import { Search, Trash2, UserRound } from 'lucide-react';
import AdminPageHeader from '@/components/pages/admin/components/admin-page-header';
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

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  dateJoined: string;
};

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'C-1001',
    name: 'Jane Doe',
    email: 'jane.doe@email.com',
    phone: '0917 694 8888',
    totalOrders: 5,
    dateJoined: '2025-11-18',
  },
  {
    id: 'C-1002',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '0999 123 4567',
    totalOrders: 2,
    dateJoined: '2026-01-09',
  },
  {
    id: 'C-1003',
    name: 'MJ Interiors',
    email: 'orders@mjinteriors.com',
    phone: '0922 555 0000',
    totalOrders: 12,
    dateJoined: '2024-08-03',
  },
  {
    id: 'C-1004',
    name: 'Andrea Cruz',
    email: 'andrea.cruz@email.com',
    phone: '0918 222 3344',
    totalOrders: 1,
    dateJoined: '2026-02-20',
  },
];

export default function CustomersPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_CUSTOMERS;
    return MOCK_CUSTOMERS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [query]);

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
          title="Customers"
          description="View customer profiles and purchase activity."
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search customers…"
              className="h-11 rounded-none pl-10"
            />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {totalItems} customer{totalItems === 1 ? '' : 's'}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card/80 shadow-sm">
          <Table className="min-w-[950px]">
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Customer Name
                  </span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Email
                  </span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Phone
                  </span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Total Orders
                  </span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Date Joined
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
              {paged.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">
                        {c.name}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {c.id}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {c.email}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {c.phone}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm font-semibold text-foreground">
                    {c.totalOrders}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {c.dateJoined}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-none border-border bg-transparent text-xs font-semibold uppercase tracking-[0.18em]"
                      >
                        <UserRound className="mr-2 h-4 w-4" />
                        View
                      </Button>
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
              ))}

              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-4 h-px w-12 bg-border" />
                      <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        No customers found
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground/70">
                        Try a different search query.
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
              itemLabel="customer"
              itemLabelPlural="customers"
              showPerPageSelector
              showFirstLast
            />
          </div>
        </div>
      </div>
    </section>
  );
}