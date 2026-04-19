'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';

export type Account = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type AccountRowProps = {
  account: Account;
  onDelete: (id: string) => void;
};

export function AccountRow({ account, onDelete }: AccountRowProps) {
  return (
    <TableRow className="hover:bg-muted/40 transition-colors">
      <TableCell className="px-5 py-3.5 text-sm font-medium text-foreground">
        {account.name}
      </TableCell>
      <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
        {account.email}
      </TableCell>
      <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
        {account.createdAt}
      </TableCell>
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
