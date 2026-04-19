'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AccountRow, type Account } from './account-row';
import { AccountsEmpty } from './accounts-empty';

const COLUMNS = ['Name', 'Email', 'Created At', 'Actions'];

type AccountsTableProps = {
  data: Account[];
  onDelete: (id: string) => void;
};

export function AccountsTable({ data, onDelete }: AccountsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[700px] w-full">
          <TableHeader className="bg-muted/50">
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead key={col} className="px-5 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {col}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length}>
                  <AccountsEmpty />
                </TableCell>
              </TableRow>
            ) : (
              data.map((account) => (
                <AccountRow key={account.id} account={account} onDelete={onDelete} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
