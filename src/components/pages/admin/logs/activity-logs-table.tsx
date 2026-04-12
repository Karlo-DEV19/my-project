"use client";

import React, { useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { format } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityLog } from "@/lib/types/activity-logs";
import { cn } from "@/lib/utils";

type Props = {
  data: ActivityLog[];
  isLoading?: boolean;
};

export default function ActivityLogsTable({ data, isLoading }: Props) {
  const columns = useMemo<ColumnDef<ActivityLog>[]>(
    () => [
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => {
          const action = row.original.action;
          const variants: Record<string, string> = {
            LOGIN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200",
            LOGOUT: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200",
            CREATE: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200",
            UPDATE: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200",
            DELETE: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200",
          };

          return (
            <Badge
              variant="outline"
              className={cn("font-medium uppercase tracking-wider", variants[action] || "")}
            >
              {action}
            </Badge>
          );
        },
      },
      {
        accessorKey: "module",
        header: () => <span className="hidden md:inline">Module</span>,
        cell: ({ row }) => (
          <span className="hidden text-xs font-medium text-muted-foreground md:inline">
            {row.original.module}
          </span>
        ),
      },
      {
        accessorKey: "actorName",
        header: "Actor",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{row.original.actorName}</span>
            <span className="text-xs text-muted-foreground">{row.original.actorEmail}</span>
            <span className="mt-0.5 text-[10px] font-medium uppercase text-muted-foreground/70 md:hidden">
              {row.original.actorRole}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "actorRole",
        header: () => <span className="hidden lg:inline">Role</span>,
        cell: ({ row }) => (
          <span className="hidden text-xs text-muted-foreground lg:inline">
            {row.original.actorRole}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <p className="max-w-[200px] truncate text-sm text-muted-foreground lg:max-w-[300px]">
            {row.original.description || "—"}
          </p>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {format(new Date(row.original.createdAt), "MMM d, yyyy, h:mm aa")}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => console.log(row.original)}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {!header.isPlaceholder &&
                    flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="hover:bg-muted/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center gap-1">
                  <p className="text-sm font-medium">No activity logs found</p>
                  <p className="text-xs text-muted-foreground">
                    Try adjusting your filters to see more results.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}