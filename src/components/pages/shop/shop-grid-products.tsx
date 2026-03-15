'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BlindsProduct } from '@/lib/types/product-blinds-type';
interface ProductGridProps {
    products: BlindsProduct[];
    isLoading?: boolean;
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
                {[0, 1, 2].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full bg-muted animate-pulse" />
                ))}
            </div>
        </div>
    </div>
);

const ProductGrid = ({ products, isLoading = false }: ProductGridProps) => {
    const router = useRouter();

    const handleQuickView = useCallback((id: string) => {
        router.push(`/shop/${id}`);
    }, [router]);

    // Loading state: render skeleton grid
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                {Array.from({ length: 8 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="py-24 text-center border border-border">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                    No products found in this collection.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {products.map((product) => {
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
                            {primaryImage ? (
                                <Image
                                    src={primaryImage}
                                    alt={`${product.name} texture preview`}
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

                            {/* Status badge */}
                            {product.status && product.status !== 'active' && (
                                <div className="absolute top-3 left-3">
                                    <span className={`text-[9px] uppercase tracking-widest font-medium px-2 py-1 ${product.status === 'draft'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-muted text-muted-foreground'
                                        }`}>
                                        {product.status}
                                    </span>
                                </div>
                            )}

                            {/* Hover CTA */}
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background/90 via-background/60 to-transparent opacity-0 translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 flex justify-center">
                                <span className="bg-foreground text-background px-6 py-2.5 text-[10px] uppercase tracking-widest font-medium shadow-lg w-full text-center">
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
                                {/* Price */}
                                {product.unitPrice != null && (
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium shrink-0">
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
                                                className="relative w-6 h-6 rounded-full border border-border/80 shadow-sm transition-transform group-hover:-translate-y-0.5 overflow-hidden ring-1 ring-background"
                                                style={{ transitionDelay: `${idx * 50}ms` }}
                                            >
                                                <Image
                                                    src={color.imageUrl}
                                                    alt={color.name}
                                                    fill
                                                    sizes="24px"
                                                    className="object-cover"
                                                />
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
    );
};

export default ProductGrid;