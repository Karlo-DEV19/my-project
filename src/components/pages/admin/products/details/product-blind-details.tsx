'use client';

import { useGetBlindsDetailsByProductId } from "@/app/api/hooks/use-product-blinds";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { NavigationLoader } from "@/components/ui/navigation-loader"; // Adjust path accordingly
import { cn } from "@/lib/utils";
import { AlertCircle, Calendar, CheckCircle2, Layers, Maximize2, Palette, Pencil, Tag, XCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from 'react';

interface ProductViewDetailsProps {
    productId: string;
}

export const ProductViewDetails = ({ productId }: ProductViewDetailsProps) => {
    const router = useRouter();
    const { product, isLoading, isError } = useGetBlindsDetailsByProductId(productId);

    // States
    const [featuredImage, setFeaturedImage] = useState<string | null>(null);
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    // Sync featured image
    useEffect(() => {
        if (product?.images && product.images.length > 0) {
            setFeaturedImage(product.images[0].imageUrl);
        }
    }, [product]);

    // Handle navigation with loader
    const handleEditClick = () => {
        setIsNavigating(true);
        router.push(`/admin/products/blinds/${productId}/edit`);
    };

    const formattedDates = useMemo(() => {
        if (!product) return null;
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        };
        return {
            created: new Date(product.createdAt).toLocaleDateString('en-US', options),
            updated: new Date(product.updatedAt).toLocaleDateString('en-US', options)
        };
    }, [product?.createdAt, product?.updatedAt]);

    if (isLoading) return <ProductViewSkeleton />;

    if (isError || !product) {
        return (
            <Card className="flex h-[400px] w-full flex-col items-center justify-center rounded-xl border-dashed bg-muted/10 shadow-sm">
                <AlertCircle className="mb-4 h-8 w-8 text-destructive" />
                <p className="text-sm font-medium text-foreground">Failed to load product details</p>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Global Navigation Loader */}
            <NavigationLoader isVisible={isNavigating} title="Preparing Editor" />

            {/* Image Preview Modal */}
            <Dialog open={!!modalImage} onOpenChange={() => setModalImage(null)}>
                <DialogContent className="max-w-3xl overflow-hidden border-none bg-transparent p-0 shadow-none">
                    <DialogTitle className="sr-only">Image Preview</DialogTitle>
                    {modalImage && (
                        <div className="relative aspect-square w-full">
                            <Image src={modalImage} alt="Preview" fill className="object-contain" priority />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* LEFT COLUMN: Media */}
            <div className="space-y-6 lg:col-span-5">
                <Card className="rounded-xl p-4 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <Layers className="h-3.5 w-3.5" /> Product Gallery
                    </h3>
                    <div
                        className="group relative mb-4 aspect-square cursor-zoom-in overflow-hidden rounded-xl border border-border bg-muted/30"
                        onClick={() => setModalImage(featuredImage)}
                    >
                        {featuredImage ? (
                            <>
                                <Image src={featuredImage} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" priority />
                                <div className="absolute bottom-4 right-4 rounded-full border border-border bg-background/80 p-2 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
                                    <Maximize2 className="h-4 w-4 text-foreground" />
                                </div>
                            </>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No Image</div>
                        )}
                    </div>
                    {product.images.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {product.images.map((img) => (
                                <button
                                    key={img.id}
                                    onClick={() => setFeaturedImage(img.imageUrl)}
                                    className={cn(
                                        "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                                        featuredImage === img.imageUrl ? "border-primary ring-2 ring-primary/10" : "border-border hover:border-muted-foreground/50"
                                    )}
                                >
                                    <Image src={img.imageUrl} alt="Thumbnail" fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </Card>

                <Card className="rounded-xl p-4 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <Palette className="h-3.5 w-3.5" /> Color Variants
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {product.colors.length > 0 ? product.colors.map((color) => (
                            <div key={color.id} className="group flex flex-col items-center gap-2">
                                <button
                                    onClick={() => setModalImage(color.imageUrl)}
                                    className="relative h-14 w-14 overflow-hidden rounded-full border border-border shadow-sm transition-transform hover:ring-2 hover:ring-primary/20 active:scale-95"
                                >
                                    <Image src={color.imageUrl} alt={color.name} fill className="object-cover" />
                                </button>
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">{color.name}</span>
                            </div>
                        )) : (
                            <p className="text-sm italic text-muted-foreground">No color variants</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* RIGHT COLUMN: Info */}
            <div className="space-y-8 lg:col-span-7">
                <div className="flex flex-col-reverse items-start justify-between gap-4 sm:flex-row">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{product.type}</Badge>
                            {product.collection && <Badge variant="outline">{product.collection}</Badge>}
                            <Badge className={cn(
                                "rounded-full px-3",
                                product.status === 'active' ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/10" : "bg-muted text-muted-foreground"
                            )}>
                                {product.status === 'active' ? <CheckCircle2 className="mr-1.5 h-3 w-3" /> : <XCircle className="mr-1.5 h-3 w-3" />}
                                {product.status.toUpperCase()}
                            </Badge>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">{product.name}</h1>
                        <div className="flex items-center gap-3">
                            <Tag className="h-4 w-4 text-primary" />
                            <span className="font-mono text-sm font-semibold text-muted-foreground">{product.productCode}</span>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={handleEditClick}
                        className="w-full gap-2 rounded-lg shadow-md transition-all hover:shadow-lg active:scale-95 sm:w-auto"
                    >
                        <Pencil className="h-4 w-4" /> Edit Product
                    </Button>
                </div>

                <Card className="flex items-baseline gap-2 border-none bg-primary/5 p-6 shadow-sm">
                    <span className="text-4xl font-black text-foreground">
                        ₱{product.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">/ unit price</span>
                </Card>

                <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Description</h3>
                    <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                        {product.description || "No description provided."}
                    </p>
                </div>

                <Separator />

                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Technical Specifications</h3>
                    <Card className="overflow-hidden rounded-xl shadow-sm">
                        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
                            <SpecItem label="Composition" value={product.composition} />
                            <SpecItem label="Fabric Width" value={product.fabricWidth ? `${product.fabricWidth}mm` : null} />
                            <SpecItem label="Thickness" value={product.thickness ? `${product.thickness}mm` : null} />
                            <SpecItem label="Packing" value={product.packing} />
                            <div className="col-span-full bg-background p-5">
                                <dt className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Characteristic</dt>
                                <dd className="text-sm font-semibold text-foreground">{product.characteristic || "Not specified"}</dd>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">System Metadata</h3>
                    <Card className="rounded-xl p-5 shadow-sm">
                        <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
                            <MetaItem icon={Calendar} label="Created" date={formattedDates?.created} />
                            <MetaItem icon={Calendar} label="Last Updated" date={formattedDates?.updated} />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const SpecItem = ({ label, value }: { label: string; value: string | null }) => (
    <div className="bg-background p-5">
        <dt className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">{label}</dt>
        <dd className="text-sm font-semibold text-foreground">{value || 'Not specified'}</dd>
    </div>
);

const MetaItem = ({ icon: Icon, label, date }: { icon: any, label: string, date?: string }) => (
    <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-foreground">{date}</p>
        </div>
    </div>
);

export const ProductViewSkeleton = () => (
    <div className="grid animate-pulse grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
            <Card className="aspect-square rounded-xl bg-muted" />
            <div className="flex gap-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 w-20 rounded-lg bg-muted" />)}
            </div>
        </div>
        <div className="space-y-8 lg:col-span-7">
            <div className="flex justify-between">
                <div className="h-8 w-64 rounded-lg bg-muted" />
                <div className="h-10 w-32 rounded-lg bg-muted" />
            </div>
            <div className="h-12 w-3/4 rounded-xl bg-muted" />
            <Card className="h-24 w-full rounded-xl bg-muted" />
            <div className="h-40 w-full rounded-xl bg-muted" />
        </div>
    </div>
);