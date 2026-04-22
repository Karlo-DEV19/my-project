"use client";

import React from "react";
import Link from "next/link";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href: string;
  subtitle?: string;
};

export default function StatCard({
  title,
  value,
  icon,
  href,
  subtitle,
}: StatCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between rounded-xl border border-border bg-card/80 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          View details
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        {subtitle ? (
          <p className="text-xs text-muted-foreground/80">{subtitle}</p>
        ) : null}
      </div>

      <div className="mt-4 h-px w-full bg-linear-to-r from-transparent via-border to-transparent" />
      <span className="mt-2 inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-primary/80 group-hover:text-primary">
        Go to {title.toLowerCase()}
        <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </span>
    </Link>
  );
}

