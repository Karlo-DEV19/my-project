"use client";

import React from "react";
import AdminPageHeader from "@/components/pages/admin/components/admin-page-header";
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

type LogStatus = "Success" | "Error";

type SystemLog = {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  status: LogStatus;
};

const MOCK_LOGS: SystemLog[] = [
  {
    id: "LOG-9001",
    timestamp: "2026-03-18 10:14:32",
    action: "Product Created",
    user: "Admin",
    status: "Success",
  },
  {
    id: "LOG-9002",
    timestamp: "2026-03-18 10:22:01",
    action: "Order Updated",
    user: "Staff",
    status: "Success",
  },
  {
    id: "LOG-9003",
    timestamp: "2026-03-18 10:33:47",
    action: "User Login",
    user: "Admin",
    status: "Success",
  },
  {
    id: "LOG-9004",
    timestamp: "2026-03-18 10:41:09",
    action: "Order Updated",
    user: "Admin",
    status: "Error",
  },
  {
    id: "LOG-9005",
    timestamp: "2026-03-18 10:56:18",
    action: "Product Created",
    user: "Admin",
    status: "Success",
  },
];

const statusStyles: Record<LogStatus, string> = {
  Success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Error: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

function LogStatusBadge({ status }: { status: LogStatus }) {
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

export default function LogsPage() {
  return (
    <section className="min-h-screen bg-background/60">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <AdminPageHeader
          title="Logs"
          description="System activity logs for quick troubleshooting and monitoring. Mock data only for now."
        />

        <div className="overflow-hidden rounded-xl border border-border bg-card/80 shadow-sm">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Timestamp
                  </span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Action
                  </span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    User
                  </span>
                </TableHead>
                <TableHead className="px-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Status
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_LOGS.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {log.timestamp}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm font-medium text-foreground">
                    {log.action}
                    <div className="mt-1 text-xs font-mono text-muted-foreground/70">
                      {log.id}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {log.user}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <LogStatusBadge status={log.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}

