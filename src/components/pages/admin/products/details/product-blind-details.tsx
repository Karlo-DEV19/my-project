'use client';

import React, { useState, useEffect } from 'react';
import { useGetBlindsDetailsByProductId } from "@/app/api/hooks/use-product-blinds";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Layers, Palette, PhilippinePeso, Tag, Maximize2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductViewDetailsProps {
    productId: string;
}

export const ProductViewDetails = ({ productId }: ProductViewDetailsProps) => {
    const { product, isLoading, isError } = useGetBlindsDetailsByProductId(productId);

    // State for the featured gallery image
    const [featuredImage, setFeaturedImage] = useState<string | null>(null);
    // State for the Lightbox/Modal
    const [modalImage, setModalImage] = useState<string | null>(null);

    // Sync featured image when product loads
    useEffect(() => {
        if (product?.images && product.images.length > 0) {
            setFeaturedImage(product.images[0].imageUrl);
        }
    }, [product]);

    if (isLoading) return <ProductViewSkeleton />;

    if (isError || !product) {
        return (
            <div className="flex h-[400px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 text-muted-foreground">
                <AlertCircle className="mb-4 h-8 w-8 text-destructive" />
                <p className="text-sm font-medium text-foreground">Failed to load product details</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Modal/Lightbox logic */}
            <Dialog open={!!modalImage} onOpenChange={() => setModalImage(null)}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                    <DialogTitle className="sr-only">Image Preview</DialogTitle>
                    {modalImage && (
                        <div className="relative aspect-square w-full">
                            <Image
                                src={modalImage}
                                alt="Preview"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Left: Interactive Media Gallery */}
            <div className="lg:col-span-5 space-y-6">
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <Layers className="h-3.5 w-3.5" /> Product Gallery
                    </h3>

                    {/* Main Featured Image */}
                    <div
                        className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted/30 cursor-zoom-in"
                        onClick={() => setModalImage(featuredImage)}
                    >
                        {featuredImage ? (
                            <>
                                <Image
                                    src={featuredImage}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    priority
                                />
                                <div className="absolute bottom-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Maximize2 className="h-4 w-4 text-foreground" />
                                </div>
                            </>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No Image</div>
                        )}
                    </div>

                    {/* Thumbnails Selection */}
                    {product.images.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {product.images.map((img) => (
                                <button
                                    key={img.id}
                                    onClick={() => setFeaturedImage(img.imageUrl)}
                                    className={cn(
                                        "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                                        featuredImage === img.imageUrl
                                            ? "border-primary ring-2 ring-primary/10"
                                            : "border-border hover:border-muted-foreground/50"
                                    )}
                                >
                                    <Image
                                        src={img.imageUrl}
                                        alt="Thumbnail"
                                        fill
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available Colors Section */}
                <div className="space-y-4 pt-4">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <Palette className="h-3.5 w-3.5" /> Color Variants
                    </h3>
                    {product.colors.length > 0 ? (
                        <div className="flex flex-wrap gap-4">
                            {product.colors.map((color) => (
                                <div key={color.id} className="group flex flex-col items-center gap-2">
                                    <button
                                        onClick={() => setModalImage(color.imageUrl)}
                                        className="relative h-16 w-16 overflow-hidden rounded-full border border-border shadow-sm transition-transform active:scale-95 hover:ring-2 hover:ring-primary/20"
                                    >
                                        <Image
                                            src={color.imageUrl}
                                            alt={color.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </button>
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{color.name}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">Standard color only</p>
                    )}
                </div>
            </div>

            {/* Right: Product Details */}
            <div className="lg:col-span-7 space-y-8">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <Badge variant="secondary" className="bg-muted text-foreground hover:bg-muted">{product.type}</Badge>
                        <Badge className={cn(
                            "rounded-full px-3",
                            product.status === 'active' ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/10" : "bg-muted text-muted-foreground"
                        )}>
                            {product.status === 'active' && <CheckCircle2 className="mr-1.5 h-3 w-3" />}
                            {product.status.toUpperCase()}
                        </Badge>
                    </div>

                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
                        {product.name}
                    </h1>

                    <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Tag className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-mono text-sm font-semibold tracking-tight text-muted-foreground">
                            {product.productCode}
                        </span>
                    </div>
                </div>

                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-foreground">
                        ₱{product.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">/ unit</span>
                </div>

                {product.description && (
                    <p className="text-lg leading-relaxed text-muted-foreground/90 max-w-2xl">
                        {product.description}
                    </p>
                )}

                <Separator className="opacity-50" />

                <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Technical Specifications</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
                        <SpecItem label="Composition" value={product.composition} />
                        <SpecItem label="Fabric Width" value={product.fabricWidth} />
                        <SpecItem label="Thickness" value={product.thickness} />
                        <SpecItem label="Packing" value={product.packing} />
                        {product.characteristic && (
                            <div className="col-span-full bg-background p-5">
                                <dt className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Key Characteristic</dt>
                                <dd className="text-sm font-semibold text-foreground">{product.characteristic}</dd>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for specs
const SpecItem = ({ label, value }: { label: string; value: string | null }) => (
    <div className="bg-background p-5">
        <dt className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{label}</dt>
        <dd className="text-sm font-semibold text-foreground">{value || 'Not Specified'}</dd>
    </div>
);

// --- SKELETON REMAINS THE SAME BUT MATCHES NEW GRID ---
export const ProductViewSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-pulse">
        <div className="lg:col-span-5 space-y-6">
            <div className="aspect-square rounded-2xl bg-muted" />
            <div className="flex gap-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 w-20 rounded-lg bg-muted" />)}
            </div>
        </div>
        <div className="lg:col-span-7 space-y-8">
            <div className="h-6 w-24 bg-muted rounded-full" />
            <div className="h-12 w-3/4 bg-muted rounded-xl" />
            <div className="h-10 w-40 bg-muted rounded-lg" />
            <div className="h-24 w-full bg-muted rounded-xl" />
        </div>
    </div>
);