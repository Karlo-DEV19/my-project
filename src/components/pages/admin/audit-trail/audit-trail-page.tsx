"use client";

import React from "react";
import AdminPageHeader from "@/components/pages/admin/components/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AuditEvent = {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  severity: "Info" | "Warning";
};

const MOCK_AUDIT: AuditEvent[] = [
  {
    id: "AUD-3001",
    action: "Admin deleted product",
    user: "Admin",
    timestamp: "2026-03-18 09:12:04",
    severity: "Warning",
  },
  {
    id: "AUD-3002",
    action: "Admin updated price",
    user: "Admin",
    timestamp: "2026-03-18 09:26:41",
    severity: "Info",
  },
  {
    id: "AUD-3003",
    action: "Staff updated stock quantity",
    user: "Staff",
    timestamp: "2026-03-18 09:44:10",
    severity: "Info",
  },
  {
    id: "AUD-3004",
    action: "Admin updated product details",
    user: "Admin",
    timestamp: "2026-03-18 10:03:29",
    severity: "Info",
  },
  {
    id: "AUD-3005",
    action: "Admin deleted product image",
    user: "Admin",
    timestamp: "2026-03-18 10:18:55",
    severity: "Warning",
  },
];

const severityStyles: Record<AuditEvent["severity"], string> = {
  Info: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  Warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

function SeverityBadge({ severity }: { severity: AuditEvent["severity"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
        severityStyles[severity]
      )}
    >
      {severity}
    </Badge>
  );
}

export default function AuditTrailPage() {
  return (
    <section className="min-h-screen bg-background/60">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <AdminPageHeader
          title="Audit Trail"
          description="High-signal record of important admin actions. Mock data only for now."
        />

        <div className="rounded-xl border border-border bg-card/80 p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Activity Timeline
            </h2>
            <p className="text-xs text-muted-foreground">
              Actions are ordered from newest to oldest.
            </p>
          </div>

          <div className="mt-6">
            <ol className="relative ml-3 space-y-6 border-l border-border pl-6">
              {MOCK_AUDIT.map((event) => (
                <li key={event.id} className="relative">
                  <div className="absolute -left-[29px] top-1.5 h-3 w-3 rounded-full border border-border bg-background shadow-sm" />

                  <div className="rounded-lg border border-border bg-background/40 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {event.action}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/80">
                            {event.user}
                          </span>
                          <span className="text-muted-foreground/60">•</span>
                          <span className="font-mono">{event.timestamp}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={event.severity} />
                        <span className="text-[11px] font-mono text-muted-foreground/70">
                          {event.id}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

