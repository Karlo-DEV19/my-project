'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import DataPagination from '@/components/ui/data-pagination'; // Adjust path
import { NewArrivalProduct } from '@/lib/types/product-blinds-type'; // Adjust path
import { cn } from '@/lib/utils';

interface NewArrivalProps {
    products?: NewArrivalProduct[];
    pagination?: any;
    isLoading?: boolean;
    onPageChange?: (page: number) => void;
}

// Skeleton card for loading state
const ProductSkeleton = () => (
    <div className="flex flex-col gap-4">
        <div className="aspect-[4/5] w-full bg-muted border border-border animate-pulse" />
        <div className="flex flex-col gap-2">
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            <div className="h-5 w-36 bg-muted rounded animate-pulse" />
            <div className="h-3 w-full bg-muted rounded animate-pulse" />
            <div className="flex items-center gap-2 mt-1">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-muted animate-pulse" />
                ))}
            </div>
        </div>
    </div>
);

const NewArrival = ({ products = [], pagination, isLoading = false, onPageChange }: NewArrivalProps) => {
    const router = useRouter();
    const limit = 4;

    const handleQuickView = useCallback((id: string) => {
        router.push(`/shop/${id}`);
    }, [router]);

    // Transform API pagination to match DataPagination expected types
    const paginationData = {
        currentPage: pagination?.page ?? 1,
        totalPages: pagination?.totalPages ?? 1,
        totalItems: pagination?.total ?? 0,
        perPage: limit,
        hasNextPage: pagination?.hasNextPage ?? false,
        hasPrevPage: pagination?.hasPrevPage ?? false,
    };

    return (
        <section className="py-24 bg-background text-foreground font-sans border-t border-border/40">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">

                {/* Header */}
                <div className="flex flex-col items-center justify-center text-center mb-16">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
                        Fresh Additions
                    </span>
                    <h2 className="text-3xl md:text-5xl font-serif tracking-wide text-foreground mb-6">
                        New Arrivals
                    </h2>
                    <div className="w-12 h-px bg-foreground/30 mb-6"></div>
                    <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
                        Fresh blinds just added to the MJ Decor888 collection—perfect for modern interiors looking for a subtle upgrade.
                    </p>
                </div>

                {/* Grid Content */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                        {Array.from({ length: limit }).map((_, i) => (
                            <ProductSkeleton key={i} />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="py-24 text-center border border-border">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                            No new arrivals found at the moment.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                        {products.map((product) => {
                            // Safely extract the image URL based on your JSON structure
                            const primaryImage = product.images?.[0]?.imageUrl ?? null;
                            const colors = product.colors ?? [];

                            return (
                                <div
                                    key={product.id}
                                    onClick={() => handleQuickView(product.id)}
                                    className="group flex flex-col gap-4 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-4 rounded-none"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleQuickView(product.id);
                                        }
                                    }}
                                >
                                    {/* Image Container */}
                                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted border border-border transition-colors duration-500 group-hover:border-foreground/50">

                                        {/* COOL FEATURE: New Arrival Badge */}
                                        <div className="absolute top-4 left-4 z-20 overflow-hidden">
                                            <span className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold shadow-lg transform transition-transform duration-500 group-hover:scale-105">
                                                <Sparkles className="w-3 h-3 animate-pulse" />
                                                Just Arrived
                                            </span>
                                        </div>

                                        {primaryImage ? (
                                            <Image
                                                src={primaryImage}
                                                alt={`${product.name} preview`}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-accent/20 flex items-center justify-center text-muted-foreground/40 font-serif text-sm">
                                                Image Unavailable
                                            </div>
                                        )}

                                        {/* Hover CTA */}
                                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background/90 via-background/60 to-transparent opacity-0 translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 flex justify-center z-10">
                                            <span className="bg-foreground text-background px-6 py-2.5 text-[10px] uppercase tracking-widest font-medium shadow-lg w-full text-center hover:bg-foreground/90 transition-colors">
                                                View Full Details
                                            </span>
                                        </div>
                                    </div>

                                    {/* Product Metadata */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium truncate pr-2">
                                                {product.productCode} • {product.type}
                                            </span>
                                            {/* Price Formatting matching your 2222 data */}
                                            {product.unitPrice != null && (
                                                <span className="text-[11px] uppercase tracking-widest text-foreground font-bold shrink-0">
                                                    ₱{product.unitPrice.toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="font-serif text-lg tracking-wide text-foreground transition-colors group-hover:text-primary/80">
                                            {product.name}
                                        </h3>

                                        {/* Specs line */}
                                        <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed mt-0.5">
                                            {[product.composition, product.thickness, product.fabricWidth]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>

                                        {/* Color swatches */}
                                        {colors.length > 0 && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex -space-x-1">
                                                    {colors.slice(0, 4).map((color, idx) => (
                                                        <div
                                                            key={idx}
                                                            title={color.name}
                                                            className="relative w-6 h-6 rounded-full border border-border/80 shadow-sm transition-transform group-hover:-translate-y-0.5 overflow-hidden ring-1 ring-background bg-muted"
                                                            style={{ transitionDelay: `${idx * 50}ms` }}
                                                        >
                                                            {color.imageUrl && (
                                                                <Image
                                                                    src={color.imageUrl}
                                                                    alt={color.name}
                                                                    fill
                                                                    sizes="24px"
                                                                    className="object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-xs text-muted-foreground font-medium pl-1">
                                                    {colors.length} {colors.length === 1 ? 'Color' : 'Colors'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                <div className="mt-16 flex justify-center">
                    {onPageChange && products.length > 0 && (
                        <DataPagination
                            pagination={paginationData}
                            onPageChange={(newPage) => onPageChange(newPage)}
                            showPerPageSelector={false}
                            showFirstLast={false}
                            showResultsInfo={true}
                            isLoading={isLoading}
                        />
                    )}
                </div>

            </div>
        </section>
    );
};

export default NewArrival;