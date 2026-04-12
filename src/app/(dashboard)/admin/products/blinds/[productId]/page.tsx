'use client';

import React, { Suspense, use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Home, Package } from 'lucide-react';
import { 
    ProductViewDetails, 
    ProductViewSkeleton 
} from '@/components/pages/admin/products/details/product-blind-details';
import { NavigationLoader } from '@/components/ui/navigation-loader';
import { 
    Breadcrumb, 
    BreadcrumbItem, 
    BreadcrumbLink, 
    BreadcrumbList, 
    BreadcrumbPage, 
    BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type Params = Promise<{ productId: string }>;

export default function ViewBlindDetailsPage(props: { params: Params }) {
    const resolvedParams = use(props.params);
    const productId = resolvedParams.productId;
    const router = useRouter();
    const [isNavigatingBack, setIsNavigatingBack] = useState(false);

    const handleBackClick = () => {
        setIsNavigatingBack(true);
        router.push('/admin/products/blinds');
    };

    return (
        <div className="min-h-screen bg-background/50">
            {/* Navigation Loader for Back Button */}
            <NavigationLoader isVisible={isNavigatingBack} title="Returning to Inventory" />

            <div className="container mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
                {/* --- HEADER REDESIGN --- */}
                <header className="mb-8 space-y-4">
                    {/* Breadcrumbs for better UX & Route Awareness */}
                    <Breadcrumb className="hidden md:flex">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin" className="flex items-center gap-1">
                                    <Home className="h-3 w-3" /> Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin/products/blinds" className="flex items-center gap-1">
                                    <Package className="h-3 w-3" /> Blinds Inventory
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>View Details</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full md:hidden" 
                                    onClick={handleBackClick}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                                    Product Profile
                                </h2>
                            </div>
                            <p className="text-muted-foreground text-sm pl-1 md:pl-0">
                                Management portal for product <span className="font-mono text-primary font-medium">{productId.slice(0, 8)}...</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleBackClick}
                                className="hidden items-center gap-2 rounded-lg border-border bg-card shadow-sm hover:bg-accent md:flex"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Back to Products
                            </Button>
                        </div>
                    </div>
                </header>

                <Separator className="mb-8 opacity-50" />

                {/* --- MAIN CONTENT --- */}
                <main className="relative">
                    <Suspense fallback={<ProductViewSkeleton />}>
                        <ProductViewDetails productId={productId} />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}