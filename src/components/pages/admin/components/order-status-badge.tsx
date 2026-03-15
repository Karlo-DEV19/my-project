"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Completed"
  | "Cancelled";

const statusStyles: Record<OrderStatus, string> = {
  Pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Processing: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  Shipped: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  Completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Cancelled: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
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

