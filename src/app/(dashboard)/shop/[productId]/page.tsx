import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { blindsProducts } from '@/lib/utils';
import ShopProductDetailsView from '@/components/pages/shop/shop-product-details-view';
// Import your interface and data array from wherever you saved it.
// For this example, I'll assume they are in a file called 'products-data.ts'

export default async function ProductPage({
    params,
}: {
    params: Promise<{ productId: string }>;
}) {
    // ✅ NEXT.JS 15: Await the params before using them
    const { productId } = await params;

    // Find the specific product based on the URL parameter
    const product = blindsProducts.find((p) => p.id === productId);

    if (!product) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 font-sans">
                <h1 className="font-serif text-2xl text-foreground">Product Not Found</h1>
                <p className="text-sm text-muted-foreground">The fabric or shade you are looking for does not exist.</p>
                <Link
                    href="/shop"
                    className="mt-4 border border-foreground text-foreground px-6 py-2 text-xs uppercase tracking-widest font-medium hover:bg-foreground hover:text-background transition-colors"
                >
                    Return to Collection
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto p-6 md:p-10 lg:p-12 animate-in fade-in duration-500 font-sans">
            {/* Elegant Back Button */}
            <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-10 group"
            >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
                Back to Collection
            </Link>

            {/* The Main UI Component */}
            <ShopProductDetailsView product={product} />
        </div>
    );
}