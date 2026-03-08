'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface ShopHeaderProps {
    title: string;
    subtitle: string;
}

const ShopHeader = ({ title, subtitle }: ShopHeaderProps) => {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border pb-8 font-sans">
            {/* Left Side: Title & Description */}
            <div className="flex flex-col items-start gap-1 max-w-2xl">
                <h1 className="font-serif text-3xl md:text-4xl tracking-wide text-foreground">
                    {title}
                </h1>

                {/* Signature Premium Divider */}
                <div className="w-12 h-px bg-border my-4"></div>

                <p className="text-sm tracking-wide text-muted-foreground leading-relaxed">
                    {subtitle}
                </p>
            </div>

            {/* Right Side: Customer Filters & Sorting */}
            <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">

                    {/* Filter Icon Indicator */}
                    <div className="hidden sm:flex items-center gap-2 mr-2">
                        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Filters</span>
                    </div>

                    {/* Category Filter */}
                    <Select defaultValue="all">
                        <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-none border-border bg-transparent text-xs font-medium uppercase tracking-widest focus:ring-1 focus:ring-primary transition-colors hover:bg-accent/50">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-border">
                            <SelectItem value="all" className="text-xs font-medium uppercase tracking-widest rounded-none cursor-pointer focus:bg-accent focus:text-accent-foreground">
                                All Blinds
                            </SelectItem>
                            <SelectItem value="combi" className="text-xs font-medium uppercase tracking-widest rounded-none cursor-pointer focus:bg-accent focus:text-accent-foreground">
                                Combi Shades
                            </SelectItem>
                            <SelectItem value="roller" className="text-xs font-medium uppercase tracking-widest rounded-none cursor-pointer focus:bg-accent focus:text-accent-foreground">
                                Roller Blinds
                            </SelectItem>
                            <SelectItem value="zebra" className="text-xs font-medium uppercase tracking-widest rounded-none cursor-pointer focus:bg-accent focus:text-accent-foreground">
                                Zebra Shades
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sort Filter */}
                    <Select defaultValue="newest">
                        <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-none border-border bg-transparent text-xs font-medium uppercase tracking-widest focus:ring-1 focus:ring-primary transition-colors hover:bg-accent/50">
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-border">
                            <SelectItem value="newest" className="text-xs font-medium uppercase tracking-widest rounded-none cursor-pointer focus:bg-accent focus:text-accent-foreground">
                                Newest Arrivals
                            </SelectItem>
                            <SelectItem value="popular" className="text-xs font-medium uppercase tracking-widest rounded-none cursor-pointer focus:bg-accent focus:text-accent-foreground">
                                Most Popular
                            </SelectItem>
                            <SelectItem value="price-asc" className="text-xs font-medium uppercase tracking-widest rounded-none cursor-pointer focus:bg-accent focus:text-accent-foreground">
                                Price: Low to High
                            </SelectItem>
                            <SelectItem value="price-desc" className="text-xs font-medium uppercase tracking-widest rounded-none cursor-pointer focus:bg-accent focus:text-accent-foreground">
                                Price: High to Low
                            </SelectItem>
                        </SelectContent>
                    </Select>

                </div>
            </div>
        </div>
    );
};

export default ShopHeader;