'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { SearchableCombobox } from '@/components/ui/combobox';
import { uploadImage, uploadMultipleImages } from '@/lib/supabase/fileUpload';
import {
    ArrowLeft,
    CheckCircle2,
    Layers,
    Loader2,
    Palette,
    Plus,
    Tag,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ColorRow } from './color-row';
import { PricePreviewTable } from './price-preview-table';
import { MainDropZone } from './product-main-drop-zone';
import { DEFAULT_VALUES, FormValues, PRODUCT_COLLECTIONS, productSchema, toSlug } from './zod-product-schema';
import { useCreateNewBlinds } from '@/app/api/hooks/use-product-blinds';
import { useDynamicOptions } from '@/app/api/hooks/use-dynamic-options';

export default function CreateNewProductPage() {
    const form = useForm<FormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: DEFAULT_VALUES as FormValues,
        mode: 'onBlur',
        reValidateMode: 'onChange',
    });

    const { control, handleSubmit, reset, setValue, formState: { errors } } = form;

    // Live-watch the name field to derive a slug preview
    const watchedName = useWatch({ control, name: 'name' });
    const watchedUnitPrice   = useWatch({ control, name: 'unitPrice' });
    const watchedEnablePromo = useWatch({ control, name: 'enablePromo' });
    const watchedDiscountType  = useWatch({ control, name: 'discountType' });
    const watchedDiscountValue = useWatch({ control, name: 'discountValue' });
    const { fields, append, remove } = useFieldArray({ control, name: 'availableColors' });

    /** Compute live promo price for the preview */
    const promoPreviewPrice = (() => {
        const price = Number(watchedUnitPrice);
        const val   = Number(watchedDiscountValue);
        if (!watchedEnablePromo || !watchedDiscountType || isNaN(price) || isNaN(val) || val <= 0) return null;
        if (watchedDiscountType === 'percentage') return Math.max(0, price * (1 - val / 100));
        return Math.max(0, price - val);
    })();

    // Custom API Hook
    const { createNewBlinds, isPending: isApiPending, isSuccess } = useCreateNewBlinds();

    // Local state to manage file uploading status before the API call
    const [isUploading, setIsUploading] = useState(false);
    const isPending = isUploading || isApiPending;

    // ── Dynamic dropdown options ──────────────────────────────
    const productType   = useDynamicOptions('product-type');
    const composition   = useDynamicOptions('compositions');
    const fabricWidth   = useDynamicOptions('fabric-widths');
    const thickness     = useDynamicOptions('thickness');
    const characteristic = useDynamicOptions('characteristics');

    // Debug helper — surfaces silent Zod errors in the console
    const onInvalidSubmit = (errs: any) => {
        console.error('[CreateProduct] Validation failed — cannot submit:', errs);
    };

    const onSubmit = async (data: FormValues) => {
        try {
            setIsUploading(true);

            // 1. Upload main images to Supabase
            // We cast to File[] here because for "Create New", all uploads will be raw Files, not strings.
            const mainResults = await uploadMultipleImages(data.mainImages as File[], {
                folder: 'blinds/products',
            });
            if (!mainResults.allSuccessful) {
                throw new Error(`${mainResults.failed.length} image(s) failed to upload.`);
            }

            // 2. Upload color swatches and map to backend field "imageUrl"
            const availableColors = await Promise.all(
                data.availableColors.map(async (c) => {
                    if (!c.file) throw new Error(`Missing swatch for "${c.name}"`);
                    const res = await uploadImage({ file: c.file as File, folder: 'blinds/colors' });
                    if (res.error) throw new Error(`"${c.name}": ${res.error}`);
                    return { name: c.name, imageUrl: res.url! };
                })
            );

            // 3. Construct payload using "productCode" to match backend schema
            const payload = {
                productCode: data.productCode,
                name: data.name,
                type: data.type,
                description: data.description,
                unitPrice: data.unitPrice,
                composition: data.composition,
                fabricWidth: data.fabricWidth,
                thickness: data.thickness,

                characteristic: data.characteristic ?? '',
                mainImages: mainResults.successful.map((r) => r.url!),
                availableColors,
                collection: data.collection,
                stock: data.stock,
                // ── Promo ──────────────────────────────────────────────────────
                enablePromo:   data.enablePromo ?? false,
                discountType:  data.enablePromo ? (data.discountType  ?? null) : null,
                discountValue: data.enablePromo ? (data.discountValue ?? null) : null,
            };
            console.log(payload);
            // 4. Final API call via your custom hook
            await createNewBlinds(payload);

            toast.success('Product published successfully!');
            reset();
        } catch (error: any) {
            toast.error(error.message ?? 'Something went wrong while publishing.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            {/* Sticky Header */}
            <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
                <div className="flex h-14 items-center justify-between px-6">
                    <div className="flex items-center gap-2 text-sm">
                        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
                            <Link href="/admin/products">
                                <ArrowLeft className="h-3.5 w-3.5" /> Products
                            </Link>
                        </Button>
                        <span className="text-muted-foreground/50">/</span>
                        <span className="font-medium">New Product</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => reset()}
                            disabled={isPending}
                        >
                            Discard
                        </Button>
                        <Button
                            type="submit"
                            form="create-product-form"
                            size="sm"
                            disabled={isPending}
                            className="min-w-[120px] gap-2"
                        >
                            {isPending ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                            ) : isSuccess ? (
                                <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</>
                            ) : (
                                'Publish Product'
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="border-b bg-muted/50 px-6 py-5">
                <h1 className="text-lg font-semibold tracking-tight">Create New Product</h1>
                <p className="text-sm text-muted-foreground">
                    Upload images on the left · fill product details + pricing on the right.
                </p>
            </div>

            <Form {...form}>
                <form
                    id="create-product-form"
                    onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
                    noValidate
                    className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden"
                >
                    {/* Left: Images & Colors */}
                    <div className="flex flex-col gap-6 border-r bg-muted/20 p-6 lg:w-[420px] lg:shrink-0">
                        <Card className="shadow-none">
                            <CardHeader className="pb-3 pt-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                        <Layers className="h-3.5 w-3.5" />
                                    </div>
                                    Product Images
                                </CardTitle>
                                <p className="text-[12px] text-muted-foreground">First image = storefront cover. Up to 6 photos.</p>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <FormField
                                    control={control}
                                    name="mainImages"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <MainDropZone
                                                    files={field.value as any}
                                                    onChange={field.onChange}
                                                    error={errors.mainImages?.message}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card className="shadow-none">
                            <CardHeader className="pb-3 pt-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                        <Palette className="h-3.5 w-3.5" />
                                    </div>
                                    Color Variants
                                </CardTitle>
                                <p className="text-[12px] text-muted-foreground">Each color needs a swatch image and a name.</p>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2.5 pt-0">
                                {fields.map((field, idx) => (
                                    <ColorRow
                                        key={field.id}
                                        index={idx}
                                        onRemove={() => remove(idx)}
                                        canRemove={fields.length > 1}
                                    />
                                ))}

                                {typeof errors.availableColors?.message === 'string' && (
                                    <p className="text-[12px] font-medium text-destructive">
                                        {errors.availableColors.message}
                                    </p>
                                )}

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ name: '', file: undefined as unknown as File })}
                                    className="mt-1 w-full border-dashed"
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Color Variant
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Details + Pricing */}
                    <ScrollArea className="flex-1">
                        <div className="flex flex-col gap-6 p-6">
                            {/* 1. Basic Information */}
                            <Card className="shadow-none">
                                <CardHeader className="pb-3 pt-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">1</span>
                                        Basic Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 gap-4 pt-0 sm:grid-cols-2">
                                    <FormField control={control} name="name" render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>Product Name <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Cherry Blossom"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e.target.value);
                                                        // Live-update the slug as the user types
                                                        setValue('slug', toSlug(e.target.value), { shouldValidate: false });
                                                    }}
                                                    onBlur={(e) => {
                                                        // Trim whitespace on blur and re-sync slug
                                                        const trimmed = e.target.value.trim();
                                                        field.onChange(trimmed);
                                                        field.onBlur();
                                                        setValue('slug', toSlug(trimmed), { shouldValidate: false });
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            {/* Slug preview */}
                                            {watchedName?.trim() && (
                                                <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/50 px-3 py-1.5">
                                                    <span className="select-none text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Slug</span>
                                                    <span className="text-[12px] font-mono text-foreground/80">{toSlug(watchedName)}</span>
                                                </div>
                                            )}
                                        </FormItem>
                                    )} />

                                    <FormField control={control} name="productCode" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Code <span className="text-destructive">*</span></FormLabel>
                                            <FormControl><Input placeholder="e.g. CB-43" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={control} name="type" render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>Product Type <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <SearchableCombobox
                                                    options={productType.options}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder={productType.isLoading ? 'Loading…' : 'Select or add a type…'}
                                                    disabled={productType.isLoading}
                                                    onAdd={async (label) => {
                                                        const created = await productType.addOption(label);
                                                        field.onChange(created?.value ?? label.toLowerCase().replace(/\s+/g, '-'));
                                                    }}
                                                    onDelete={async (id) => {
                                                        const deleted = productType.options.find((o) => o.id === id);
                                                        if (deleted && field.value === deleted.value) field.onChange('');
                                                        await productType.deleteOption(id);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={control} name="description" render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>Description <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    rows={3}
                                                    placeholder="Short description shown on the product page…"
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={control} name="collection" render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>Collection Display <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <div className="flex flex-wrap gap-2">
                                                    {PRODUCT_COLLECTIONS.map((c) => (
                                                        <button
                                                            key={c}
                                                            type="button"
                                                            onClick={() => field.onChange(c)}
                                                            className={`rounded-md border px-4 py-2 text-sm transition-colors ${field.value === c
                                                                ? 'bg-primary border-primary text-primary-foreground font-medium shadow-sm'
                                                                : 'bg-background hover:bg-muted text-foreground'
                                                                }`}
                                                        >
                                                            {c === 'Shop Only' ? 'Shop Only (Default)' : c}
                                                        </button>
                                                    ))}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={control} name="stock" render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>Stock Quantity <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    placeholder="0"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                </CardContent>
                            </Card>

                            <Separator />

                            {/* 2. Pricing */}
                            <Card className="shadow-none">
                                <CardHeader className="pb-3 pt-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">2</span>
                                        Pricing
                                        <Badge variant="secondary" className="ml-1 text-[10px]">Live Preview</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-5 pt-0">
                                    <FormField control={control} name="unitPrice" render={({ field }) => (
                                        <FormItem className="max-w-xs">
                                            <FormLabel>Unit Price (₱ / sq.ft) <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">₱</span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step={0.01}
                                                        placeholder="e.g. 120"
                                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-7 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                        {...field}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            field.onChange(val === "" ? "" : Number(val));
                                                        }}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <PricePreviewTable />
                                </CardContent>
                            </Card>

                            <Separator />

                            {/* 3. Promotion */}
                            <Card className="shadow-none">
                                <CardHeader className="pb-3 pt-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold">
                                            <Tag className="h-3 w-3" />
                                        </span>
                                        Promotion
                                        <Badge variant="secondary" className="ml-1 text-[10px]">Optional</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4 pt-0">
                                    {/* Enable toggle */}
                                    <FormField control={control} name="enablePromo" render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-sm font-medium">Enable promotion</FormLabel>
                                                <p className="text-[12px] text-muted-foreground">
                                                    Show a discount badge and promo price on product cards.
                                                </p>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value ?? false}
                                                    onCheckedChange={(val) => {
                                                        field.onChange(val);
                                                        if (!val) {
                                                            setValue('discountType',  null);
                                                            setValue('discountValue', null);
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )} />

                                    {watchedEnablePromo && (
                                        <div className="flex flex-col gap-4 pl-1">
                                            {/* Discount Type */}
                                            <FormField control={control} name="discountType" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Discount Type <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <div className="flex gap-2">
                                                            {(['percentage', 'fixed'] as const).map((t) => (
                                                                <button
                                                                    key={t}
                                                                    type="button"
                                                                    onClick={() => field.onChange(t)}
                                                                    className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                                                                        field.value === t
                                                                            ? 'bg-primary border-primary text-primary-foreground font-medium shadow-sm'
                                                                            : 'bg-background hover:bg-muted text-foreground'
                                                                    }`}
                                                                >
                                                                    {t === 'percentage' ? '% Percentage' : '₱ Fixed Amount'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            {/* Discount Value */}
                                            <FormField control={control} name="discountValue" render={({ field }) => (
                                                <FormItem className="max-w-xs">
                                                    <FormLabel>
                                                        Discount Value{' '}
                                                        <span className="text-muted-foreground font-normal">
                                                            ({watchedDiscountType === 'percentage' ? '1–100 %' : '₱ per sq.ft'})
                                                        </span>
                                                        <span className="text-destructive"> *</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                                                                {watchedDiscountType === 'percentage' ? '%' : '₱'}
                                                            </span>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={watchedDiscountType === 'percentage' ? 100 : undefined}
                                                                step={0.01}
                                                                placeholder={watchedDiscountType === 'percentage' ? 'e.g. 25' : 'e.g. 30'}
                                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-7 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            {/* Live price preview */}
                                            {promoPreviewPrice !== null && (
                                                <div className="flex items-center gap-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 px-4 py-3">
                                                    <Tag className="h-4 w-4 text-rose-600 shrink-0" />
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[11px] uppercase tracking-wider text-rose-700 dark:text-rose-400 font-semibold">
                                                            Promo Preview
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-muted-foreground line-through">
                                                                ₱{Number(watchedUnitPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                            </span>
                                                            <span className="text-base font-semibold text-rose-600">
                                                                ₱{promoPreviewPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                            {watchedDiscountType === 'percentage' && watchedDiscountValue && (
                                                                <span className="text-[11px] font-medium bg-rose-600 text-white px-1.5 py-0.5 rounded">
                                                                    {watchedDiscountValue}% OFF
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Separator />

                            {/* 4. Technical Specifications */}
                            <Card className="shadow-none">
                                <CardHeader className="pb-3 pt-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">3</span>
                                        Technical Specifications
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 gap-4 pt-0 sm:grid-cols-2">
                                    <FormField control={control} name="composition" render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>Composition <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <SearchableCombobox
                                                    options={composition.options}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder={composition.isLoading ? 'Loading…' : 'e.g. POLYESTER 100%'}
                                                    disabled={composition.isLoading}
                                                    onAdd={async (label) => {
                                                        const created = await composition.addOption(label);
                                                        field.onChange(created?.value ?? label.toLowerCase().replace(/\s+/g, '-'));
                                                    }}
                                                    onDelete={async (id) => {
                                                        const deleted = composition.options.find((o) => o.id === id);
                                                        if (deleted && field.value === deleted.value) field.onChange('');
                                                        await composition.deleteOption(id);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />


                                    <FormField control={control} name="fabricWidth" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fabric Width <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <SearchableCombobox
                                                    options={fabricWidth.options}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder={fabricWidth.isLoading ? 'Loading…' : 'e.g. 280cm'}
                                                    disabled={fabricWidth.isLoading}
                                                    onAdd={async (label) => {
                                                        const created = await fabricWidth.addOption(label);
                                                        field.onChange(created?.value ?? label.toLowerCase().replace(/\s+/g, '-'));
                                                    }}
                                                    onDelete={async (id) => {
                                                        const deleted = fabricWidth.options.find((o) => o.id === id);
                                                        if (deleted && field.value === deleted.value) field.onChange('');
                                                        await fabricWidth.deleteOption(id);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={control} name="thickness" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Thickness <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <SearchableCombobox
                                                    options={thickness.options}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder={thickness.isLoading ? 'Loading…' : 'e.g. 0.54mm'}
                                                    disabled={thickness.isLoading}
                                                    onAdd={async (label) => {
                                                        const created = await thickness.addOption(label);
                                                        field.onChange(created?.value ?? label.toLowerCase().replace(/\s+/g, '-'));
                                                    }}
                                                    onDelete={async (id) => {
                                                        const deleted = thickness.options.find((o) => o.id === id);
                                                        if (deleted && field.value === deleted.value) field.onChange('');
                                                        await thickness.deleteOption(id);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />


                                    <FormField control={control} name="characteristic" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Characteristic</FormLabel>
                                            <FormControl>
                                                <SearchableCombobox
                                                    options={characteristic.options}
                                                    value={field.value ?? ''}
                                                    onChange={field.onChange}
                                                    placeholder={characteristic.isLoading ? 'Loading…' : 'e.g. Woodlook, Fireproof…'}
                                                    disabled={characteristic.isLoading}
                                                    onAdd={async (label) => {
                                                        const created = await characteristic.addOption(label);
                                                        field.onChange(created?.value ?? label.toLowerCase().replace(/\s+/g, '-'));
                                                    }}
                                                    onDelete={async (id) => {
                                                        const deleted = characteristic.options.find((o) => o.id === id);
                                                        if (deleted && field.value === deleted.value) field.onChange('');
                                                        await characteristic.deleteOption(id);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </CardContent>
                            </Card>

                            <div className="flex justify-end pb-4 lg:hidden">
                                <Button type="submit" disabled={isPending} className="w-full gap-2 sm:w-auto">
                                    {isPending ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                                    ) : (
                                        'Publish Product'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </ScrollArea>
                </form>
            </Form>
        </div>
    );
}