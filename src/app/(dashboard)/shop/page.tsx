'use client'
import ShopSection from '@/components/pages/shop/shop-section';
import React, { Suspense } from 'react';

export default function ShopPage() {
    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            {/* React 19 Suspense Boundary catches the async loading of ShopSection */}
            <Suspense fallback={<ShopSkeleton />}>
                <ShopSection />
            </Suspense>
        </main>
    );
}

const ShopSkeleton = () => {
    return (
        <section className="w-full max-w-7xl mx-auto p-6 md:p-10 lg:p-12 animate-pulse font-sans">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border pb-6 mb-8">
                <div className="flex flex-col gap-3">
                    <div className="h-8 w-64 bg-muted border border-border/50"></div>
                    <div className="w-12 h-px bg-border"></div>
                    <div className="h-4 w-96 bg-muted border border-border/50"></div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-11 w-[180px] bg-muted border border-border/50"></div>
                    <div className="h-11 w-[180px] bg-muted border border-border/50"></div>
                </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 mb-8">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-4">
                        <div className="aspect-[4/5] w-full bg-muted border border-border/50"></div>
                        <div className="flex flex-col gap-2 mt-1">
                            <div className="h-2.5 w-24 bg-muted"></div>
                            <div className="h-5 w-48 bg-muted"></div>
                            <div className="h-4 w-16 bg-muted mt-1"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="h-12 w-full bg-muted border border-border/50"></div>
        </section>
    );
};