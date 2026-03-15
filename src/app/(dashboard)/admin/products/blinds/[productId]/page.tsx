'use client';

import { ProductViewDetails, ProductViewSkeleton } from '@/components/pages/admin/products/details/product-blind-details';
import React, { Suspense, use } from 'react';
// 1. Define the type for the params promise
type Params = Promise<{ productId: string }>;

export default function ViewBlindDetailsPage(props: { params: Params }) {
    // 2. Unwrap the params promise using React.use()
    const resolvedParams = use(props.params);
    const productId = resolvedParams.productId;

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Product Details</h2>
                <p className="text-muted-foreground text-sm">View complete information for this product.</p>
            </div>

            {/* 3. Pass the unwrapped ID to your component */}
            <Suspense fallback={<ProductViewSkeleton />}>
                <ProductViewDetails productId={productId} />
            </Suspense>
        </div>
    );
}