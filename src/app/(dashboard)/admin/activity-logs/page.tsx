import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ActivityLogsSection from "@/components/pages/admin/logs/activity-logs-section";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LogsPageSkeleton() {
  return (
    <section className="flex min-h-screen w-full flex-col bg-background/60">
      <div className="flex flex-1 flex-col gap-6 px-6 py-6 xl:px-10">

        {/* Page header */}
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-80" />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Skeleton className="h-9 w-full sm:max-w-sm" />
            <Skeleton className="h-9 w-full sm:w-40" />
            <Skeleton className="h-9 w-full sm:w-44" />
          </div>
        </div>

        {/* Table card */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* Table header */}
          <div className="border-b border-border bg-muted/50 px-5 py-3">
            <div className="flex items-center gap-10">
              {["Timestamp", "Action", "Module", "Description", "Name", "Email", "Role"].map(
                (col) => (
                  <Skeleton key={col} className="h-3 w-16" />
                )
              )}
            </div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-border/50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-10 px-5 py-3.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            ))}
          </div>

          {/* Pagination bar */}
          <div className="border-t border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-9 w-16" />
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-9" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Route ────────────────────────────────────────────────────────────────────

export default function ActivityLogsPage() {
  return (
    <Suspense fallback={<LogsPageSkeleton />}>
      <ActivityLogsSection />
    </Suspense>
  );
}