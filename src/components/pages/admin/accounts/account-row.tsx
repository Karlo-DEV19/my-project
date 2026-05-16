'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type Account = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastLogin: string | null;    // ISO string or null
  loginCount: number;
};

type AccountRowProps = {
  account: Account;
  onDelete: (id: string) => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PH', {
      year:  'numeric',
      month: 'short',
      day:   'numeric',
    });
  } catch {
    return '—';
  }
}

function LoginBadge({ count }: { count: number }) {
  const isNew = count <= 1;
  return (
    <span
      className={cn(
        'inline-block text-[9px] font-semibold uppercase tracking-[0.15em] px-1.5 py-0.5 leading-none',
        isNew
          ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
      )}
    >
      {isNew ? 'New' : 'Returning'}
    </span>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

export function AccountRow({ account, onDelete }: AccountRowProps) {
  return (
    <TableRow className="hover:bg-muted/40 transition-colors">
      {/* Name */}
      <TableCell className="px-5 py-3.5 text-sm font-medium text-foreground">
        {account.name}
      </TableCell>

      {/* Email */}
      <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
        {account.email}
      </TableCell>

      {/* Created At */}
      <TableCell className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
        {account.createdAt}
      </TableCell>

      {/* Last Login */}
      <TableCell className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
        {account.lastLogin ? formatDate(account.lastLogin) : (
          <span className="text-muted-foreground/50 italic">Never</span>
        )}
      </TableCell>

      {/* Login Count */}
      <TableCell className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-sm tabular-nums text-foreground font-medium">
            {account.loginCount}
          </span>
          <LoginBadge count={account.loginCount} />
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className="px-5 py-3.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(account.id)}
          aria-label={`Delete account ${account.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
