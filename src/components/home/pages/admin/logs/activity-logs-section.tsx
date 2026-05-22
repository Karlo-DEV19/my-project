// src/app/(admin)/activity-logs/page.tsx

"use client";

import React, { useCallback, useState } from "react";
import AdminPageHeader from "@/components/pages/admin/components/admin-page-header";
import DataPagination, { PaginationData } from "@/components/ui/data-pagination";
import ActivityLogsTable from "./activity-logs-table";
import { useGetAllActivityLogs } from "@/app/api/hooks/use-activity-logs-api";
import ActivityLogsHeader, { ActivityLogsFilters } from "./activity-logs-header";

const DEFAULT_PAGINATION: PaginationData = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  perPage: 20,
  hasNextPage: false,
  hasPrevPage: false,
};

export default function ActivityLogsSection() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [filters, setFilters] = useState<ActivityLogsFilters>({
    search: "",
    action: "",
    module: "",
  });

  const { data, isLoading, isError } = useGetAllActivityLogs({
    page,
    perPage,
    search: filters.search,
    action: filters.action,
    module: filters.module,
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination ?? DEFAULT_PAGINATION;

  const handleFiltersChange = useCallback(
    (partial: Partial<ActivityLogsFilters>) => {
      setFilters((prev) => ({ ...prev, ...partial }));
      setPage(1);
    },
    []
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePerPageChange = useCallback((newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
  }, []);

  return (
    <section className="flex min-h-screen w-full flex-col bg-background/60">
      <div className="flex flex-1 flex-col gap-6 px-6 py-6 xl:px-10">
        <AdminPageHeader
          title="Activity Logs Section"
          description="Track all system actions and actor history across modules."
        />

        <ActivityLogsHeader
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalItems={pagination.totalItems}
        />

        {isError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
            Failed to load activity logs. Please try again.
          </div>
        )}

        <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <ActivityLogsTable data={logs} isLoading={isLoading} />

          <div className="border-t border-border p-4">
            <DataPagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </section>
  );
}