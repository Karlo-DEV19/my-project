'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { uploadImage, uploadMultipleImages } from '@/lib/supabase/fileUpload';
import {
    ArrowLeft,
    CheckCircle2,
    Layers,
    Loader2,
    Palette,
    Plus,
} from 'lucide-react';
import { ColorRow } from './color-row';
import { PricePreviewTable } from './price-preview-table';
import { MainDropZone } from './product-main-drop-zone';
import { DEFAULT_VALUES, FormValues, PRODUCT_TYPES, productSchema } from './zod-product-schema';
import { useCreateNewBlinds } from '@/app/api/hooks/use-product-blinds';

export default function CreateNewProductPage() {
    const form = useForm<FormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: DEFAULT_VALUES as FormValues,
        mode: 'onBlur',
    });

    const { control, handleSubmit, reset, formState: { errors } } = form;
    const { fields, append, remove } = useFieldArray({ control, name: 'availableColors' });

    // Custom API Hook
    const { createNewBlinds, isPending: isApiPending, isSuccess } = useCreateNewBlinds();

    // Local state to manage file uploading status before the API call
    const [isUploading, setIsUploading] = useState(false);
    const isPending = isUploading || isApiPending;

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
                packing: data.packing,
                characteristic: data.characteristic ?? '',
                mainImages: mainResults.successful.map((r) => r.url!),
                availableColors,
            };

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
                    onSubmit={handleSubmit(onSubmit)}
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
                                        <FormItem>
                                            <FormLabel>Product Name <span className="text-destructive">*</span></FormLabel>
                                            <FormControl><Input placeholder="e.g. Cherry Blossom" {...field} /></FormControl>
                                            <FormMessage />
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Select a type…" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {PRODUCT_TYPES.map((t) => (
                                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
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
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
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

                            {/* 3. Technical Specifications */}
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
                                            <FormControl><Input placeholder="e.g. POLYESTER 100%" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={control} name="fabricWidth" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fabric Width <span className="text-destructive">*</span></FormLabel>
                                            <FormControl><Input placeholder="e.g. 280cm" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={control} name="thickness" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Thickness <span className="text-destructive">*</span></FormLabel>
                                            <FormControl><Input placeholder="e.g. 0.54mm" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={control} name="packing" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Packing <span className="text-destructive">*</span></FormLabel>
                                            <FormControl><Input placeholder="e.g. 50m / Roll" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={control} name="characteristic" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Characteristic</FormLabel>
                                            <FormControl><Input placeholder="e.g. Woodlook, fireproof…" {...field} /></FormControl>
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