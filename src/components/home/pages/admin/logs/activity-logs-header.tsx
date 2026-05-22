"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ActivityAction, ActivityModule } from "@/lib/constans/activity-log";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityLogsFilters = {
  search: string;
  action: string;
  module: string;
};

type ActivityLogsHeaderProps = {
  filters: ActivityLogsFilters;
  onFiltersChange: (filters: Partial<ActivityLogsFilters>) => void;
  totalItems?: number;
};

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    ((...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(...args), delay);
    }) as T,
    [fn, delay]
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_OPTIONS = [
  { label: "All Actions", value: "all" },
  ...Object.values(ActivityAction).map((a) => ({ label: a, value: a })),
];

const MODULE_OPTIONS = [
  { label: "All Modules", value: "all" },
  ...Object.values(ActivityModule).map((m) => ({
    label: m.replace(/_/g, " "),
    value: m,
  })),
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActivityLogsHeader({
  filters,
  onFiltersChange,
  totalItems,
}: ActivityLogsHeaderProps) {
  // Local state for immediate input feedback while debouncing the API call
  const [localSearch, setLocalSearch] = useState(filters.search);

  const hasActiveFilters =
    filters.search !== "" || filters.action !== "" || filters.module !== "";

  const debouncedSearchChange = useDebounce(
    useCallback(
      (value: string) => onFiltersChange({ search: value }),
      [onFiltersChange]
    ),
    300
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
    debouncedSearchChange(e.target.value);
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    onFiltersChange({ search: "" });
  };

  const handleClearAll = () => {
    setLocalSearch("");
    onFiltersChange({ search: "", action: "", module: "" });
  };

  // Sync local input if parent resets filters externally
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  return (
    <div className="flex flex-col gap-4">
      {/* ── Label row ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filters</span>
          {typeof totalItems === "number" && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
              {totalItems.toLocaleString()}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleClearAll}
          >
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>

      {/* ── Controls row ── */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search description, name, email…"
            value={localSearch}
            onChange={handleSearchChange}
            className="pl-8 pr-8 text-sm"
          />
          {localSearch && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Action filter */}
        <Select
          value={filters.action || "all"}
          onValueChange={(val) =>
            onFiltersChange({ action: val === "all" ? "" : val })
          }
        >
          <SelectTrigger className="w-full text-sm sm:w-40">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Module filter */}
        <Select
          value={filters.module || "all"}
          onValueChange={(val) =>
            onFiltersChange({ module: val === "all" ? "" : val })
          }
        >
          <SelectTrigger className="w-full text-sm sm:w-44">
            <SelectValue placeholder="All Modules" />
          </SelectTrigger>
          <SelectContent>
            {MODULE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}