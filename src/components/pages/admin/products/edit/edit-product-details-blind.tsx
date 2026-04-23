'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, FormProvider } from 'react-hook-form';
import { toast } from 'sonner';

import { useGetBlindsDetailsByProductId, useUpdateBlindsById } from '@/app/api/hooks/use-product-blinds';
import { uploadImage, uploadMultipleImages } from '@/lib/supabase/fileUpload';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import {
    AlertCircle,
    CheckCircle2,
    Layers,
    Loader2,
    Package,
    Palette,
    Plus,
    Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EDIT_DEFAULT_VALUES, EditFormValues, editProductSchema, PRODUCT_COLLECTIONS, PRODUCT_STATUSES, PRODUCT_TYPES } from './edit-product-blind-zod-schema';
import { EditMainDropZone } from './edit-main-dropzone';
import { PricePreviewTable } from '../create/price-preview-table';
import { EditColorRow } from './edit-color-row';
import { useAuth } from '@/lib/providers/auth-provider';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditProductDetailsBlindFormProps {
    productId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    EditFormValues['status'],
    { label: string; className: string }
> = {
    active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    inactive: { label: 'Inactive', className: 'bg-amber-50  text-amber-700  border-amber-200' },
    archived: { label: 'Archived', className: 'bg-slate-50  text-slate-600  border-slate-200' },
};

const COLLECTION_CONFIG: Record<
    EditFormValues['collection'],
    { className: string }
> = {
    'Shop Only': { className: 'bg-blue-50   text-blue-700   border-blue-200' },
    'New Arrival': { className: 'bg-violet-50 text-violet-700 border-violet-200' },
    'Best Seller': { className: 'bg-orange-50 text-orange-700 border-orange-200' },
};

const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n);

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ProductSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
            <div className="space-y-4">
                <Skeleton className="aspect-4/3 rounded-2xl w-full" />
                <div className="grid grid-cols-3 gap-2">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-xl" />
                    ))}
                </div>
            </div>
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const EditProductDetailsBlindForm: React.FC<
    EditProductDetailsBlindFormProps
> = ({ productId }) => {
    const { product, isLoading, isError } = useGetBlindsDetailsByProductId(productId);
    const { updateBlindsAsync, isUpdating } = useUpdateBlindsById();
    const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
    const [isUploading, setIsUploading] = useState(false);
    const auth = useAuth();


    // ── Build default values from fetched product ────────────────────────────
    const defaultValues = useMemo<EditFormValues>(() => {
        if (!product) return EDIT_DEFAULT_VALUES;
        return {
            productCode: product.productCode ?? '',
            name: product.name ?? '',
            description: product.description ?? '',
            type: product.type ?? '',
            collection: (product as any).collection ?? 'Shop Only',
            status: (product as any).status ?? 'active',
            composition: product.composition ?? '',
            fabricWidth: product.fabricWidth ?? '',
            thickness: product.thickness ?? '',

            characteristic: product.characteristic ?? '',
            unitPrice: product.unitPrice ?? 0,
            // Existing images arrive as string URLs — schema accepts string | File
            mainImages: (product.images ?? []).map((img: any) => img.imageUrl as string),
            // Existing colors: id + name + existing URL string as `file`
            availableColors: (product.colors ?? []).map((c: any) => ({
                id: c.id,
                name: c.name,
                file: c.imageUrl as string,
            })),
        };
    }, [product]);

    // ── Form setup — NO `as any` cast needed because schema matches ──────────
    const form = useForm<EditFormValues>({
        resolver: zodResolver(editProductSchema as any),
        defaultValues,
        mode: 'onBlur',
    });

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = form;

    // Sync form when product loads
    useEffect(() => {
        if (product) reset(defaultValues);
    }, [product, reset, defaultValues]);

    // ── Field arrays ─────────────────────────────────────────────────────────
    const {
        fields: colorFields,
        append: appendColor,
        remove: removeColor,
    } = useFieldArray({ control, name: 'availableColors' });

    // ── Watched values for read-only display ─────────────────────────────────
    const watchedStatus = watch('status');
    const watchedCollection = watch('collection');

    const onSubmit = useCallback(
        async (data: EditFormValues) => {
            // ✅ Validate auth before anything else
            if (!auth.isAuthenticated || !auth.user?.id) {
                toast.error('You must be logged in to update a product.');
                return;
            }

            setIsUploading(true);
            try {
                const newFiles = data.mainImages.filter((x): x is File => x instanceof File);
                const existingUrls = data.mainImages.filter((x): x is string => typeof x === 'string');

                let uploadedUrls: string[] = [];
                if (newFiles.length > 0) {
                    const results = await uploadMultipleImages(newFiles, { folder: 'blinds/products' });
                    if (!results.allSuccessful) {
                        throw new Error(`${results.failed.length} image(s) failed to upload.`);
                    }
                    uploadedUrls = results.successful.map((r) => r.url!);
                }

                const mainImages = [...existingUrls, ...uploadedUrls];

                const availableColors = await Promise.all(
                    data.availableColors.map(async (c) => {
                        if (typeof c.file === 'string') return { name: c.name, imageUrl: c.file };
                        const res = await uploadImage({ file: c.file, folder: 'blinds/colors' });
                        if (res.error) throw new Error(`"${c.name}": ${res.error}`);
                        return { name: c.name, imageUrl: res.url! };
                    })
                );

                await updateBlindsAsync({
                    id: productId,
                    payload: {
                        userId: auth.user.id,
                        productCode: data.productCode,
                        name: data.name,
                        description: data.description,
                        type: data.type,
                        collection: data.collection,
                        status: data.status,
                        composition: data.composition,
                        fabricWidth: data.fabricWidth,
                        thickness: data.thickness,

                        characteristic: data.characteristic ?? '',
                        unitPrice: data.unitPrice,
                        mainImages,
                        availableColors,
                    },
                });

                toast.success('Product updated successfully!');
                setViewMode('view');
            } catch (error: any) {
                toast.error(error.message ?? 'Something went wrong while saving.');
            } finally {
                setIsUploading(false);
            }
        },
        [productId, updateBlindsAsync, auth] // ✅ add auth to deps
    );

    const handleReset = useCallback(() => {
        reset(defaultValues);
    }, [reset, defaultValues]);

    // ── Loading / error states ────────────────────────────────────────────────
    if (isLoading) return <ProductSkeleton />;

    if (isError || !product) {
        return (
            <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 gap-3">
                <AlertCircle className="h-8 w-8 text-destructive/60" />
                <div className="text-center">
                    <p className="text-sm font-medium">Failed to load product</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Check your connection and try again.
                    </p>
                </div>
            </div>
        );
    }

    const isEditing = viewMode === 'edit';
    const isPending = isUploading || isUpdating;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            {/* Sticky Header */}
            <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
                <div className="flex h-14 items-center justify-between px-6">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-sm font-semibold">{product.name}</h1>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-[10px]',
                                    STATUS_CONFIG[watchedStatus]?.className
                                )}
                            >
                                {STATUS_CONFIG[watchedStatus]?.label}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-[10px]',
                                    COLLECTION_CONFIG[watchedCollection]?.className
                                )}
                            >
                                {watchedCollection}
                            </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono">
                            {product.productCode}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { handleReset(); setViewMode('view'); }}
                                    disabled={isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    form="edit-product-form"
                                    size="sm"
                                    disabled={isPending}
                                    className="min-w-[120px] gap-2"
                                >
                                    {isPending ? (
                                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewMode('edit')}
                            >
                                Edit Product
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* Sub-header */}
            <div className="border-b bg-muted/50 px-6 py-4">
                <p className="text-sm text-muted-foreground">
                    {isEditing
                        ? 'Editing product · changes are saved on submit.'
                        : 'Viewing product details.'}
                </p>
            </div>

            <Form {...form}>
                <form
                    id="edit-product-form"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden"
                >
                    {/* ── LEFT: Images + Colors ── */}
                    <div className="flex flex-col gap-6 border-r bg-muted/20 p-6 lg:w-[420px] lg:shrink-0">

                        {/* Images */}
                        <Card className="shadow-none">
                            <CardHeader className="pb-3 pt-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                        <Layers className="h-3.5 w-3.5" />
                                    </div>
                                    Product Images
                                </CardTitle>
                                <p className="text-[12px] text-muted-foreground">
                                    First image = storefront cover. Up to 6 photos.
                                    {isEditing && ' Upload a file or paste a URL.'}
                                </p>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <FormField
                                    control={control}
                                    name="mainImages"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                {isEditing ? (
                                                    <EditMainDropZone
                                                        files={field.value as (File | string)[]}
                                                        onChange={field.onChange}
                                                        error={errors.mainImages?.message}
                                                    />
                                                ) : (
                                                    // Read-only image grid
                                                    <div className="flex flex-col gap-2">
                                                        {(field.value as string[]).length > 0 ? (
                                                            <>
                                                                <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border">
                                                                    <img
                                                                        src={(field.value as string[])[0]}
                                                                        alt="Cover"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                {(field.value as string[]).length > 1 && (
                                                                    <div className="grid grid-cols-5 gap-1.5">
                                                                        {(field.value as string[]).slice(1).map((src, i) => (
                                                                            <div
                                                                                key={i}
                                                                                className="relative aspect-square overflow-hidden rounded-lg border"
                                                                            >
                                                                                <img
                                                                                    src={src}
                                                                                    alt={`img-${i + 2}`}
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="flex aspect-4/3 items-center justify-center rounded-xl border border-dashed text-muted-foreground text-sm">
                                                                No images
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Colors */}
                        <Card className="shadow-none">
                            <CardHeader className="pb-3 pt-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                        <Palette className="h-3.5 w-3.5" />
                                    </div>
                                    Color Variants
                                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                                        {colorFields.length} colors
                                    </span>
                                </CardTitle>
                                {isEditing && (
                                    <p className="text-[12px] text-muted-foreground">
                                        Each color needs a swatch (file or URL) and a name.
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2.5 pt-0">
                                {colorFields.length === 0 ? (
                                    <p className="text-center text-xs text-muted-foreground py-4">
                                        No colors added yet.
                                    </p>
                                ) : (
                                    colorFields.map((field, idx) =>
                                        isEditing ? (
                                            <EditColorRow
                                                key={field.id}
                                                index={idx}
                                                onRemove={() => removeColor(idx)}
                                                canRemove={colorFields.length > 1}
                                            />
                                        ) : (
                                            // Read-only color row
                                            // Read-only color row — full replacement
                                            <div
                                                key={field.id}
                                                className="flex items-center gap-3 rounded-lg border bg-card p-3"
                                            >
                                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
                                                    {typeof field.file === 'string' && field.file.length > 0 ? (
                                                        <img
                                                            src={field.file}
                                                            alt={field.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-muted" />
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium">{field.name}</span>
                                            </div>
                                        )
                                    )
                                )}

                                {isEditing && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            appendColor({
                                                id: `new-${Date.now()}`,
                                                name: '',
                                                file: undefined as unknown as string,
                                            })
                                        }
                                        className="mt-1 w-full border-dashed"
                                    >
                                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                                        Add Color Variant
                                    </Button>
                                )}

                                {typeof errors.availableColors?.message === 'string' && (
                                    <p className="text-[12px] font-medium text-destructive">
                                        {errors.availableColors.message}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── RIGHT: Details + Pricing ── */}
                    <ScrollArea className="flex-1">
                        <div className="flex flex-col gap-6 p-6">

                            {/* 1. Basic Information */}
                            <Card className="shadow-none">
                                <CardHeader className="pb-3 pt-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                            1
                                        </span>
                                        Basic Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 gap-4 pt-0 sm:grid-cols-2">

                                    {/* Product Code — always readonly */}
                                    <FormField
                                        control={control}
                                        name="productCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Product Code</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        readOnly
                                                        className="bg-muted/50 cursor-not-allowed font-mono text-sm"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Product Name{' '}
                                                    {isEditing && (
                                                        <span className="text-destructive">*</span>
                                                    )}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        readOnly={!isEditing}
                                                        className={!isEditing ? 'bg-muted/30 cursor-default' : ''}
                                                        placeholder="e.g. Cherry Blossom"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem className="sm:col-span-2">
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        readOnly={!isEditing}
                                                        rows={3}
                                                        className={cn(
                                                            'resize-none',
                                                            !isEditing && 'bg-muted/30 cursor-default'
                                                        )}
                                                        placeholder="Short description shown on the product page…"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Separator />

                            {/* 2. Classification */}
                            <Card className="shadow-none">
                                <CardHeader className="pb-3 pt-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                            2
                                        </span>
                                        Classification
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 gap-4 pt-0 sm:grid-cols-3">

                                    {/* Type */}
                                    <FormField
                                        control={control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Product Type{' '}
                                                    {isEditing && <span className="text-destructive">*</span>}
                                                </FormLabel>
                                                {isEditing ? (
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a type…" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {PRODUCT_TYPES.map((t) => (
                                                                <SelectItem key={t} value={t}>
                                                                    {t}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            readOnly
                                                            className="bg-muted/30 cursor-default"
                                                        />
                                                    </FormControl>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Collection */}
                                    <FormField
                                        control={control}
                                        name="collection"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Collection</FormLabel>
                                                {isEditing ? (
                                                    <>
                                                        <div className="flex flex-wrap gap-2 pt-1">
                                                            {PRODUCT_COLLECTIONS.map((c) => (
                                                                <button
                                                                    key={c}
                                                                    type="button"
                                                                    onClick={() => field.onChange(c)}
                                                                    className={cn(
                                                                        'rounded-md border px-3 py-1.5 text-xs transition-colors',
                                                                        field.value === c
                                                                            ? 'bg-primary border-primary text-primary-foreground font-medium shadow-sm'
                                                                            : 'bg-background hover:bg-muted text-foreground'
                                                                    )}
                                                                >
                                                                    {c}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <FormMessage />
                                                    </>
                                                ) : (
                                                    <div className="pt-1.5">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                'text-xs',
                                                                COLLECTION_CONFIG[field.value]?.className
                                                            )}
                                                        >
                                                            {field.value}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </FormItem>
                                        )}
                                    />

                                    {/* Status */}
                                    <FormField
                                        control={control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                {isEditing ? (
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {PRODUCT_STATUSES.map((s) => (
                                                                <SelectItem key={s} value={s}>
                                                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <div className="pt-1.5">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                'text-xs',
                                                                STATUS_CONFIG[field.value]?.className
                                                            )}
                                                        >
                                                            {STATUS_CONFIG[field.value]?.label}
                                                        </Badge>
                                                    </div>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Separator />

                            {/* 3. Pricing */}
                            <Card className="shadow-none">
                                <CardHeader className="pb-3 pt-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                            3
                                        </span>
                                        Pricing
                                        <Badge variant="secondary" className="ml-1 text-[10px]">
                                            Live Preview
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-5 pt-0">
                                    <FormField
                                        control={control}
                                        name="unitPrice"
                                        render={({ field }) => (
                                            <FormItem className="max-w-xs">
                                                <FormLabel>
                                                    Unit Price (₱ / sq.ft){' '}
                                                    {isEditing && <span className="text-destructive">*</span>}
                                                </FormLabel>
                                                <FormControl>
                                                    {isEditing ? (
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                                                                ₱
                                                            </span>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                step={0.01}
                                                                placeholder="e.g. 120"
                                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-7 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                                {...field}
                                                                onChange={(e) =>
                                                                    field.onChange(e.target.valueAsNumber)
                                                                }
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className="text-2xl font-semibold tracking-tight pt-1">
                                                            {formatPrice(field.value)}
                                                        </p>
                                                    )}
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <PricePreviewTable />
                                </CardContent>
                            </Card>

                            <Separator />

                            {/* 4. Technical Specifications */}
                            <Card className="shadow-none">
                                <CardHeader className="pb-3 pt-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                            4
                                        </span>
                                        Technical Specifications
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 gap-4 pt-0 sm:grid-cols-2">
                                    {(
                                        [
                                            {
                                                name: 'composition' as const,
                                                label: 'Composition',
                                                placeholder: 'e.g. POLYESTER 100%',
                                                span: true,
                                            },
                                            {
                                                name: 'fabricWidth' as const,
                                                label: 'Fabric Width',
                                                placeholder: 'e.g. 280cm',
                                            },
                                            {
                                                name: 'thickness' as const,
                                                label: 'Thickness',
                                                placeholder: 'e.g. 0.54mm',
                                            },

                                            {
                                                name: 'characteristic' as const,
                                                label: 'Characteristic',
                                                placeholder: 'e.g. Woodlook, fireproof…',
                                            },
                                        ] as const
                                    ).map(({ name, label, placeholder, ...rest }) => (
                                        <FormField
                                            key={name}
                                            control={control}
                                            name={name}
                                            render={({ field }) => (
                                                <FormItem className={
                                                    'span' in rest && rest.span
                                                        ? 'sm:col-span-2' : ''}>
                                                    <FormLabel>
                                                        {label}{' '}
                                                        {isEditing && name !== 'characteristic' && (
                                                            <span className="text-destructive">*</span>
                                                        )}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            readOnly={!isEditing}
                                                            className={
                                                                !isEditing ? 'bg-muted/30 cursor-default' : ''
                                                            }
                                                            placeholder={placeholder}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Mobile save button */}
                            {isEditing && (
                                <div className="flex justify-end pb-4 lg:hidden">
                                    <Button
                                        type="submit"
                                        disabled={isPending}
                                        className="w-full gap-2 sm:w-auto"
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </form>
            </Form>
        </div>
    );
};