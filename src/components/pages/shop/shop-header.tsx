'use client';

import React, { useRef, useState, useEffect } from 'react';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ShopHeaderProps {
    title: string;
    subtitle: string;
    search: string;
    status: string | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    totalItems: number;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: string | null) => void;
    onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

// Maps a composite sort value like "createdAt_desc" to sortBy + sortOrder
const SORT_OPTIONS = [
    { value: 'createdAt_desc', label: 'Newest Arrivals', sortBy: 'createdAt', sortOrder: 'desc' as const },
    { value: 'createdAt_asc', label: 'Oldest First', sortBy: 'createdAt', sortOrder: 'asc' as const },
    { value: 'name_asc', label: 'Name: A → Z', sortBy: 'name', sortOrder: 'asc' as const },
    { value: 'name_desc', label: 'Name: Z → A', sortBy: 'name', sortOrder: 'desc' as const },
    { value: 'unitPrice_asc', label: 'Price: Low to High', sortBy: 'unitPrice', sortOrder: 'asc' as const },
    { value: 'unitPrice_desc', label: 'Price: High to Low', sortBy: 'unitPrice', sortOrder: 'desc' as const },
];

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'draft', label: 'Draft' },
];

const ShopHeader = ({
    title,
    subtitle,
    search,
    status,
    sortBy,
    sortOrder,
    totalItems,
    onSearchChange,
    onStatusChange,
    onSortChange,
}: ShopHeaderProps) => {
    const [localSearch, setLocalSearch] = useState(search);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Keep local in sync if parent resets externally
    useEffect(() => {
        setLocalSearch(search);
    }, [search]);

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalSearch(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onSearchChange(val);
        }, 400);
    };

    const handleClearSearch = () => {
        setLocalSearch('');
        onSearchChange('');
    };

    const currentSortValue = `${sortBy}_${sortOrder}`;

    const handleSortChange = (value: string) => {
        const option = SORT_OPTIONS.find(o => o.value === value);
        if (option) onSortChange(option.sortBy, option.sortOrder);
    };

    const handleStatusChange = (value: string) => {
        onStatusChange(value === 'all' ? null : value);
    };

    const hasActiveFilters = search || status;

    return (
        <div className="flex flex-col gap-8 border-b border-border pb-8 font-sans">
            {/* Top Row: Title + Total Count */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col items-start gap-1 max-w-2xl">
                    <h1 className="font-serif text-3xl md:text-4xl tracking-wide text-foreground">
                        {title}
                    </h1>
                    <div className="w-12 h-px bg-border my-4" />
                    <p className="text-sm tracking-wide text-muted-foreground leading-relaxed">
                        {subtitle}
                    </p>
                </div>

                {/* Results count badge */}
                {totalItems > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                            {totalItems.toLocaleString()} {totalItems === 1 ? 'fabric' : 'fabrics'}
                        </span>
                    </div>
                )}
            </div>

            {/* Bottom Row: Search + Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">

                {/* Filter label */}
                <div className="hidden sm:flex items-center gap-2 mr-1 shrink-0">
                    <SlidersHorizontal className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                        Filters
                    </span>
                    {hasActiveFilters && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                </div>

                {/* Search Input */}
                <div className="relative flex-1 min-w-0 sm:max-w-xs">
                    <Search
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"
                        strokeWidth={1.5}
                    />
                    <input
                        type="text"
                        value={localSearch}
                        onChange={handleSearchInput}
                        placeholder="Search fabrics..."
                        className="w-full h-11 pl-9 pr-9 border border-border bg-transparent text-xs font-medium tracking-wide placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary transition-colors hover:bg-accent/50"
                    />
                    {localSearch && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                    )}
                </div>

                {/* Status Filter */}
                <Select
                    value={status ?? 'all'}
                    onValueChange={handleStatusChange}
                >
                    <SelectTrigger className="w-full sm:w-[160px] h-11 rounded-none border-border bg-transparent text-xs font-medium uppercase tracking-widest focus:ring-1 focus:ring-primary transition-colors hover:bg-accent/50">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-border">
                        {STATUS_OPTIONS.map(opt => (
                            <SelectItem
                                key={opt.value}
                                value={opt.value}
                                className="text-xs font-medium uppercase tracking-widest rounded-none cursor-pointer focus:bg-accent focus:text-accent-foreground"
                            >
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={currentSortValue} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-none border-border bg-transparent text-xs font-medium uppercase tracking-widest focus:ring-1 focus:ring-primary transition-colors hover:bg-accent/50">
                        <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-border">
                        {SORT_OPTIONS.map(opt => (
                            <SelectItem
                                key={opt.value}
                                value={opt.value}
                                className="text-xs font-medium uppercase tracking-widest rounded-none cursor-pointer focus:bg-accent focus:text-accent-foreground"
                            >
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default ShopHeader;