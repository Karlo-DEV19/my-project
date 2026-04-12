'use client';

import React, { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Home, Package, PencilLine, Hash } from 'lucide-react';
import { EditProductDetailsBlindForm } from '@/components/pages/admin/products/edit/edit-product-details-blind';
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

type Params = Promise<{ productId: string }>;

export default function EditBlindProductPage(props: { params: Params }) {
    const { productId } = use(props.params);
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);

    // Memoize the short ID to prevent unnecessary recalculations
    const shortId = useMemo(() => productId.slice(-8).toUpperCase(), [productId]);

    const handleBackClick = () => {
        setIsNavigating(true);
        router.push(`/admin/products/blinds/${productId}`);
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/50 via-background to-background">
            <NavigationLoader isVisible={isNavigating} title="Returning to Details" />

            {/* --- STICKY HEADER --- */}
            <div className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-accent"
                            onClick={handleBackClick}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="hidden h-6 w-[1px] bg-border md:block" />
                        <Breadcrumb className="hidden lg:block">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin" className="transition-colors hover:text-primary">
                                        <Home className="h-3.5 w-3.5" />
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/products/blinds" className="text-xs font-medium uppercase tracking-wider">
                                        Blinds
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Edit
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden flex-col items-end md:flex">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reference</span>
                            <span className="flex items-center gap-1 font-mono text-xs font-medium">
                                <Hash className="h-3 w-3 text-primary" /> {shortId}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* --- PAGE TITLE SECTION --- */}
                <header className="mb-10">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <PencilLine className="h-5 w-5" />
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Edit Product
                                </h1>
                            </div>
                            <p className="max-w-2xl text-balance text-sm text-muted-foreground">
                                Update the configuration, visual assets, and specifications for this blind variant. Changes will reflect immediately on the storefront.
                            </p>
                        </div>
                    </div>
                </header>

                <EditProductDetailsBlindForm productId={productId} />

            </div>
        </div>
    );
}