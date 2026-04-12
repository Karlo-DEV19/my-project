'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useGetBlindsDetailsByProductId } from '@/app/api/hooks/use-product-blinds';
import ShopProductDetailsView from '@/components/pages/shop/shop-product-details-view';

// ─── Loading skeleton ────────────────────────────────────────────────────────

const ProductDetailSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-24 items-start animate-pulse">
        {/* Left — image stack */}
        <div className="flex flex-col gap-4">
            <div className="aspect-[4/5] w-full bg-muted border border-border" />
            <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-muted border border-border" />
                ))}
            </div>
            <div className="hidden lg:block border border-border h-48 bg-muted" />
        </div>
        {/* Right — text stack */}
        <div className="flex flex-col gap-6 pt-2">
            <div className="flex flex-col gap-3 border-b border-border pb-7">
                <div className="h-3 w-28 bg-muted rounded" />
                <div className="h-10 w-3/4 bg-muted rounded" />
                <div className="h-px w-10 bg-muted" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-2/3 bg-muted rounded" />
                <div className="h-7 w-32 bg-muted rounded mt-1" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 w-full bg-muted border border-border rounded" />
            ))}
        </div>
    </div>
);

// ─── Error / 404 state ───────────────────────────────────────────────────────

const ProductNotFound = () => (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium border border-border px-3 py-1.5">
            404
        </span>
        <h2 className="font-serif text-3xl tracking-wide text-foreground">Product Not Found</h2>
        <div className="w-10 h-px bg-border" />
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            The product you&apos;re looking for doesn&apos;t exist or has been removed from our collection.
        </p>
        <a
            href="/shop"
            className="mt-4 flex items-center gap-2 h-11 px-8 border border-border text-xs uppercase tracking-widest font-medium text-foreground hover:bg-accent transition-colors"
        >
            ← Back to Collection
        </a>
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShopProductPage() {
    const params = useParams<{ productId: string }>();
    const productId = params?.productId;

    // Guard: bad param — render 404 immediately, don't call the hook
    const isInvalidId =
        !productId ||
        productId === 'null' ||
        productId === 'undefined' ||
        productId.trim() === '';

    const { product, isLoading, isError, error } = useGetBlindsDetailsByProductId(
        // Pass undefined when id is invalid so the hook can disable itself
        isInvalidId ? undefined : productId
    );

    const is404 =
        isInvalidId ||
        (error as any)?.response?.status === 404 ||
        (!isLoading && !isError && !product);

    // ── Invalid id (before any fetch) ──────────────────────────────────────
    if (isInvalidId) {
        return (
            <main className="w-full max-w-7xl mx-auto p-6 md:p-10 lg:p-12 font-sans">
                <ProductNotFound />
            </main>
        );
    }

    // ── Loading ────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <main className="w-full max-w-7xl mx-auto p-6 md:p-10 lg:p-12 font-sans">
                <nav className="flex items-center gap-2 mb-8">
                    <div className="h-3 w-10 bg-muted rounded animate-pulse" />
                    <span className="text-muted-foreground/40 text-xs">/</span>
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                    <span className="text-muted-foreground/40 text-xs">/</span>
                    <div className="h-3 w-28 bg-muted rounded animate-pulse" />
                </nav>
                <ProductDetailSkeleton />
            </main>
        );
    }

    // ── Error / 404 ────────────────────────────────────────────────────────
    if (isError || is404 || !product) {
        return (
            <main className="w-full max-w-7xl mx-auto p-6 md:p-10 lg:p-12 font-sans">
                <ProductNotFound />
            </main>
        );
    }

    // ── Happy path ─────────────────────────────────────────────────────────
    return (
        <main className="w-full max-w-7xl mx-auto p-6 md:p-10 lg:p-12 font-sans animate-in fade-in duration-500">
            <nav
                className="flex items-center gap-2 mb-8 text-[10px] uppercase tracking-widest font-medium"
                aria-label="Breadcrumb"
            >
                <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                    Home
                </a>
                <span className="text-muted-foreground/40" aria-hidden="true">/</span>
                <a href="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
                    Shop
                </a>
                <span className="text-muted-foreground/40" aria-hidden="true">/</span>
                <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
            </nav>

            {/* product is guaranteed non-null here */}
            <ShopProductDetailsView product={product} />
        </main>
    );
}