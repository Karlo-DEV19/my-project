'use client';

import React, { useCallback, useRef, useState, useMemo, memo } from 'react';
import {
    useForm,
    useFieldArray,
    useFormContext,
    useWatch,
    type SubmitHandler,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import {
    Upload, X, ImageIcon, Plus, Trash2,
    Loader2, CheckCircle2, ArrowLeft,
    GripVertical, Layers, Palette,
    Calculator, Info, BadgeCheck,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE  (singleton — outside component, never re-created)
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: true, persistSession: true } },
);

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE CONSTANTS  (plain numbers — avoids TS2345 literal-type error)
// ─────────────────────────────────────────────────────────────────────────────

const BUCKET = 'images';
const MAX_MB = 10;
const CACHE_CTRL = '3600';
const RETRY_COUNT = 3;
const RETRY_DELAY = 1000;
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = MAX_MB * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// PRICING ENGINE — ported 1-to-1 from Quotation-Template-J.xlsx
//
//  Excel chain per row:
//    F  = E/100              width_m  = widthCm / 100
//    I  = H/100              height_m = heightCm / 100
//    J  = 10.76              sq.ft conversion factor
//    K  = F*I*J              measured_sqft = width_m * height_m * 10.76
//    L  = IF(K<=10, 10, K)   billable_sqft = MAX(measured_sqft, 10)   ← minimum 10 sq.ft
//    Q  = P * L              sub_total = unitPrice * billable_sqft
//    R  = Q * O              total = sub_total * totalPanels  (O = L + R controls)
// ─────────────────────────────────────────────────────────────────────────────

const SQFT_FACTOR = 10.76;   // column J — cm² → sq.ft
const MIN_SQFT = 10;      // minimum billable area
const MAX_WIDTH_CM = 280;     // fabric width physical limit
const MAX_HEIGHT_CM = 300;     // standard drop limit

interface PriceCalc {
    widthM: number;
    heightM: number;
    measuredSqft: number;
    billableSqft: number;   // MAX(measured, 10)
    subTotal: number;   // unitPrice × billable
    total: number;   // subTotal × panels
    panels: number;
}

function calcBlindPrice(
    widthCm: number,
    heightCm: number,
    unitPrice: number,
    leftCtrl: number = 0,
    rightCtrl: number = 1,
): PriceCalc {
    const widthM = widthCm / 100;
    const heightM = heightCm / 100;
    const measuredSqft = widthM * heightM * SQFT_FACTOR;
    const billableSqft = Math.max(measuredSqft, MIN_SQFT);
    const panels = (leftCtrl + rightCtrl) || 1;
    const subTotal = unitPrice * billableSqft;
    const total = subTotal * panels;
    return { widthM, heightM, measuredSqft, billableSqft, subTotal, total, panels };
}

const fmtPHP = (n: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(n);

const fmtSqft = (n: number) => `${n.toFixed(4)} sq.ft`;

// Standard size presets for the live preview table
const STANDARD_SIZES = [
    { label: '60 × 120', w: 60, h: 120 },
    { label: '90 × 150', w: 90, h: 150 },
    { label: '120 × 160', w: 120, h: 160 },
    { label: '120 × 200', w: 120, h: 200 },
    { label: '150 × 200', w: 150, h: 200 },
    { label: '160 × 220', w: 160, h: 220 },
    { label: '180 × 220', w: 180, h: 220 },
    { label: '200 × 240', w: 200, h: 240 },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD UTILITIES  (pure async functions — no re-render risk)
// ─────────────────────────────────────────────────────────────────────────────

interface UploadResponse {
    url: string | null;
    error: string | null;
    filePath: string | null;
}
interface MultiUploadResponse {
    successful: UploadResponse[];
    failed: UploadResponse[];
    allSuccessful: boolean;
}
interface UploadOptions {
    file: File;
    customFileName?: string;
    maxSizeMB?: number;
    folder?: string;
}

// left is explicitly typed number — fixes TS2345 (no literal `3`)
async function withRetry<T>(op: () => Promise<T>, left: number = RETRY_COUNT): Promise<T> {
    try { return await op(); }
    catch (e) {
        if (left <= 1) throw e;
        await new Promise(r => setTimeout(r, RETRY_DELAY));
        return withRetry(op, left - 1);
    }
}

function getExt(mime: string): string {
    return ({ 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' } as Record<string, string>)[mime] ?? '.bin';
}

function buildFileName(file: File, custom?: string): string {
    const safe = (custom || file.name).replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50);
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safe}${getExt(file.type)}`;
}

async function uploadOne({ file, customFileName, maxSizeMB = MAX_MB, folder = 'images' }: UploadOptions): Promise<UploadResponse> {
    try {
        if (!ALLOWED_MIME.includes(file.type)) return { url: null, error: 'Invalid type. Use JPG, PNG or WEBP.', filePath: null };
        if (file.size > maxSizeMB * 1024 * 1024) return { url: null, error: `Must be under ${maxSizeMB} MB.`, filePath: null };

        const filePath = `${folder}/${buildFileName(file, customFileName)}`;
        await withRetry(async () => {
            const { error } = await supabase.storage.from(BUCKET)
                .upload(filePath, file, { cacheControl: CACHE_CTRL, contentType: file.type, upsert: false });
            if (error) throw new Error(error.message);
        });

        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
        if (!publicUrl) throw new Error('Failed to get public URL.');
        return { url: publicUrl, error: null, filePath };
    } catch (e) {
        return { url: null, error: e instanceof Error ? e.message : 'Upload failed.', filePath: null };
    }
}

async function uploadMany(files: File[], opts: Omit<UploadOptions, 'file'> = {}): Promise<MultiUploadResponse> {
    const results = await Promise.allSettled(files.map(file => uploadOne({ file, ...opts })));
    const successful: UploadResponse[] = [];
    const failed: UploadResponse[] = [];
    results.forEach(r => {
        if (r.status === 'fulfilled') (r.value.error ? failed : successful).push(r.value);
        else failed.push({ url: null, error: r.reason?.message ?? 'Upload failed.', filePath: null });
    });
    return { successful, failed, allSuccessful: failed.length === 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// ZOD SCHEMA  (outside component — stable reference, never re-created)
// ─────────────────────────────────────────────────────────────────────────────

const fileSchema = z
    .instanceof(File)
    .refine(f => f.size <= MAX_BYTES, 'Max 10 MB.')
    .refine(f => ALLOWED_MIME.includes(f.type), 'JPG, PNG or WEBP only.');

const colorSchema = z.object({
    name: z.string().min(1, 'Color name required'),
    file: z.union([fileSchema, z.null()]).refine(f => f !== null, 'Swatch image required'),
});

const productSchema = z.object({
    name: z.string().min(2, 'Minimum 2 characters'),
    code: z.string().min(1, 'Required'),
    type: z.string().min(1, 'Select a type'),
    description: z.string().min(10, 'Minimum 10 characters'),
    // ── Pricing (new) ──
    unitPrice: z.coerce.number().positive('Must be a positive number'),
    // ── Technical specs ──
    composition: z.string().min(1, 'Required'),
    fabricWidth: z.string().min(1, 'Required'),
    thickness: z.string().min(1, 'Required'),
    packing: z.string().min(1, 'Required'),
    characteristic: z.string().optional(),
    // ── Media ──
    mainImages: z.array(fileSchema).min(1, 'At least one image required').max(6, 'Max 6 images'),
    availableColors: z.array(colorSchema).min(1, 'At least one color required'),
});

export interface FormValues {
    name: string;
    code: string;
    type: string;
    description: string;
    unitPrice: number;
    composition: string;
    fabricWidth: string;
    thickness: string;
    packing: string;
    characteristic?: string;
    mainImages: File[];
    availableColors: { name: string; file: File | null }[];
}
// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCT_TYPES = [
    'Combi Shades',
    'Triple Shades (Open Roman)',
    'Rollscreen Blackout',
    'Sunscreen',
    'Roller Blinds',
    'Roman Blinds',
    'Venetian Blinds',
] as const;

const DEFAULT_VALUES: FormValues = {
    name: '', code: '', type: '', description: '',
    unitPrice: 0,
    composition: '',
    fabricWidth: '',
    thickness: '',
    packing: '',
    characteristic: '',
    mainImages: [],
    availableColors: [{ name: '', file: null }],
};

// ─────────────────────────────────────────────────────────────────────────────
// MUTATION
// ─────────────────────────────────────────────────────────────────────────────

async function createProduct(data: FormValues) {
    const mainResult = await uploadMany(data.mainImages, { folder: 'blinds/products' });
    if (!mainResult.allSuccessful)
        throw new Error(`${mainResult.failed.length} image(s) failed to upload.`);

    const availableColors = await Promise.all(
        data.availableColors.map(async c => {
            if (!c.file) throw new Error(`Missing swatch for "${c.name}"`);
            const res = await uploadOne({ file: c.file, folder: 'blinds/colors' });
            if (res.error) throw new Error(`"${c.name}": ${res.error}`);
            return { name: c.name, image: res.url! };
        })
    );

    const payload = {
        id: `${data.code.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}`,
        name: data.name,
        code: data.code,
        type: data.type,
        description: data.description,
        unitPrice: data.unitPrice,
        composition: data.composition,
        fabricWidth: data.fabricWidth,
        thickness: data.thickness,
        packing: data.packing,
        characteristic: data.characteristic ?? '',
        imageUrls: mainResult.successful.map(r => r.url!),
        availableColors,
    };

    // TODO: const { error } = await supabase.from('products').insert(payload);
    // if (error) throw new Error(error.message);
    console.log('[createProduct]', payload);
    return payload;
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE PRICE CALCULATOR  (reads unitPrice live from form via useWatch)
// Reads unitPrice from parent form context — no prop drilling needed
// ─────────────────────────────────────────────────────────────────────────────

const PriceCalculator = memo(() => {
    const { control } = useFormContext<FormValues>();
    const unitPrice = useWatch({ control, name: 'unitPrice' });

    // Custom preview inputs — isolated local state so they don't touch the form
    const [previewW, setPreviewW] = useState('');
    const [previewH, setPreviewH] = useState('');
    const [leftCtrl, setLeftCtrl] = useState(0);
    const [rightCtrl, setRightCtrl] = useState(1);

    const price = Number(unitPrice);
    const w = Number(previewW);
    const h = Number(previewH);
    const isCustomReady = price > 0 && w > 0 && h > 0 && w <= MAX_WIDTH_CM && h <= MAX_HEIGHT_CM;

    const customCalc = useMemo<PriceCalc | null>(() => {
        if (!isCustomReady) return null;
        return calcBlindPrice(w, h, price, leftCtrl, rightCtrl);
    }, [w, h, price, leftCtrl, rightCtrl, isCustomReady]);

    const wError = previewW && (Number(previewW) > MAX_WIDTH_CM);
    const hError = previewH && (Number(previewH) > MAX_HEIGHT_CM);

    return (
        <div className="flex flex-col gap-4">

            {/* Header info */}
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" strokeWidth={1.5} />
                <div className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                    <strong>Excel formula (Quotation-Template-J.xlsx):</strong><br />
                    <code className="font-mono">
                        billable_sqft = MAX(W_m × H_m × 10.76, 10)<br />
                        sub_total = unit_price × billable_sqft<br />
                        total = sub_total × (L_ctrl + R_ctrl)
                    </code>
                </div>
            </div>

            {/* Standard sizes preview table */}
            {price > 0 ? (
                <div>
                    <p className="mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                        Standard Size Price Preview
                    </p>
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="text-[10px] uppercase tracking-widest h-8">Size (cm)</TableHead>
                                    <TableHead className="text-[10px] uppercase tracking-widest h-8 text-right">sq.ft</TableHead>
                                    <TableHead className="text-[10px] uppercase tracking-widest h-8 text-right">Billable</TableHead>
                                    <TableHead className="text-[10px] uppercase tracking-widest h-8 text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {STANDARD_SIZES.map(({ label, w, h }) => {
                                    const c = calcBlindPrice(w, h, price, 0, 1);
                                    const isMin = c.measuredSqft < MIN_SQFT;
                                    return (
                                        <TableRow key={label} className="text-xs">
                                            <TableCell className="font-medium py-2">{label}</TableCell>
                                            <TableCell className="text-right py-2 text-muted-foreground">
                                                {c.measuredSqft.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right py-2">
                                                <span className={isMin ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                                                    {c.billableSqft.toFixed(2)}
                                                </span>
                                                {isMin && (
                                                    <span className="ml-1 text-[9px] text-amber-500">min</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right py-2 font-semibold">
                                                {fmtPHP(c.total)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                        ↑ Prices for 1 panel (0L + 1R). Amber = minimum 10 sq.ft applied.
                    </p>
                </div>
            ) : (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <Calculator className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
                        <p className="text-sm text-muted-foreground">
                            Enter a unit price above to see the price table
                        </p>
                    </div>
                </div>
            )}

            {/* Custom size tester */}
            <div className="rounded-lg border bg-muted/20 p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-foreground">
                    Custom Size Calculator
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Width (cm)
                        </label>
                        <Input
                            type="number"
                            min={1} max={MAX_WIDTH_CM}
                            placeholder={`1 – ${MAX_WIDTH_CM}`}
                            value={previewW}
                            onChange={e => setPreviewW(e.target.value)}
                            className={`h-9 text-sm ${wError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        />
                        {wError
                            ? <p className="text-[10px] text-destructive">Max {MAX_WIDTH_CM} cm (fabric limit)</p>
                            : <p className="text-[10px] text-muted-foreground">Max: {MAX_WIDTH_CM} cm</p>
                        }
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Height (cm)
                        </label>
                        <Input
                            type="number"
                            min={1} max={MAX_HEIGHT_CM}
                            placeholder={`1 – ${MAX_HEIGHT_CM}`}
                            value={previewH}
                            onChange={e => setPreviewH(e.target.value)}
                            className={`h-9 text-sm ${hError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        />
                        {hError
                            ? <p className="text-[10px] text-destructive">Max {MAX_HEIGHT_CM} cm (drop limit)</p>
                            : <p className="text-[10px] text-muted-foreground">Standard drop: up to {MAX_HEIGHT_CM} cm</p>
                        }
                    </div>
                </div>

                {/* L / R controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {[
                        { label: 'Left Controls (L)', value: leftCtrl, set: setLeftCtrl },
                        { label: 'Right Controls (R)', value: rightCtrl, set: setRightCtrl },
                    ].map(({ label, value, set }) => (
                        <div key={label} className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
                            <div className="flex items-center h-9 border rounded-md overflow-hidden bg-background">
                                <button type="button" onClick={() => set(v => Math.max(0, v - 1))}
                                    className="w-9 h-full flex items-center justify-center text-foreground hover:bg-muted transition-colors text-base font-light border-r">
                                    −
                                </button>
                                <span className="flex-1 text-center text-sm font-medium">{value}</span>
                                <button type="button" onClick={() => set(v => v + 1)}
                                    className="w-9 h-full flex items-center justify-center text-foreground hover:bg-muted transition-colors text-base font-light border-l">
                                    +
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Live breakdown */}
                {customCalc ? (
                    <div className="rounded-lg border overflow-hidden">
                        {[
                            { label: 'Width × Height', value: `${customCalc.widthM.toFixed(3)} m × ${customCalc.heightM.toFixed(3)} m` },
                            { label: 'Measured Area', value: fmtSqft(customCalc.measuredSqft) },
                            { label: 'Billable Area', value: `${fmtSqft(customCalc.billableSqft)}${customCalc.measuredSqft < MIN_SQFT ? ' ← min 10 sq.ft applied' : ''}` },
                            { label: 'Unit Price', value: `${fmtPHP(price)} / sq.ft` },
                            { label: 'Sub Total', value: fmtPHP(customCalc.subTotal) },
                            { label: 'Panels (L+R)', value: `${leftCtrl} + ${rightCtrl} = ${customCalc.panels}` },
                        ].map(({ label, value }) => (
                            <div key={label} className="grid grid-cols-[1fr_auto] gap-4 px-3 py-2 border-b last:border-b-0 text-xs even:bg-muted/20">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-medium text-right tabular-nums">{value}</span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between px-3 py-2.5 bg-foreground text-background">
                            <span className="text-[11px] uppercase tracking-widest font-semibold">Total</span>
                            <span className="text-base font-bold tabular-nums">{fmtPHP(customCalc.total)}</span>
                        </div>
                    </div>
                ) : (previewW || previewH) && (wError || hError) ? (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-[11px] text-destructive">
                        {wError ? `Width cannot exceed ${MAX_WIDTH_CM} cm.` : `Height cannot exceed ${MAX_HEIGHT_CM} cm.`}
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted-foreground">
                        Enter width, height and a unit price to preview the exact price
                    </div>
                )}
            </div>
        </div>
    );
});
PriceCalculator.displayName = 'PriceCalculator';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN IMAGE DROP ZONE
// ─────────────────────────────────────────────────────────────────────────────

interface MainDropZoneProps {
    files: File[];
    onChange: (files: File[]) => void;
    error?: string;
}

const MainDropZone = memo(({ files, onChange, error }: MainDropZoneProps) => {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const process = useCallback((list: FileList | null) => {
        if (!list) return;
        const valid = Array.from(list).filter(f => ALLOWED_MIME.includes(f.type) && f.size <= MAX_BYTES);
        onChange([...files, ...valid].slice(0, 6));
    }, [files, onChange]);

    const onDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files); }, [process]);
    const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true); }, []);
    const onLeave = useCallback(() => setDragging(false), []);
    const onInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { process(e.target.files); e.target.value = ''; }, [process]);
    const remove = useCallback((i: number) => onChange(files.filter((_, idx) => idx !== i)), [files, onChange]);
    const open = useCallback(() => inputRef.current?.click(), []);

    const coverPreview = files.length > 0 ? URL.createObjectURL(files[0]) : null;
    const extraPreviews = files.slice(1).map(f => URL.createObjectURL(f));

    return (
        <div className="flex flex-col gap-3">
            {/* Cover — large drop area */}
            <div
                onClick={open}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onLeave}
                className={[
                    'relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all',
                    dragging ? 'border-primary bg-primary/5 scale-[1.01]'
                        : coverPreview ? 'border-transparent'
                            : error ? 'border-destructive/50 hover:border-destructive'
                                : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50',
                ].join(' ')}
            >
                {coverPreview ? (
                    <>
                        <Image src={coverPreview} alt="Cover" fill className="object-cover" unoptimized sizes="50vw" />
                        <div className="absolute inset-0 bg-black/0 transition-all hover:bg-black/20" />
                        <Badge className="absolute left-2 top-2 text-[10px]">Cover</Badge>
                        <button type="button" onClick={e => { e.stopPropagation(); remove(0); }}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 p-6 text-center">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-full border transition-colors ${dragging ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground'}`}>
                            <Upload className="h-6 w-6" strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-medium">{dragging ? 'Drop to upload' : 'Upload cover image'}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">JPG, PNG, WEBP · Max 10 MB</p>
                        </div>
                    </div>
                )}
                <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple className="hidden" onChange={onInput} />
            </div>

            {/* Extra thumbnails */}
            {files.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {extraPreviews.map((src, i) => (
                        <div key={i} className="group relative aspect-square w-16 overflow-hidden rounded-lg border bg-muted">
                            <Image src={src} alt={`img-${i + 2}`} fill className="object-cover" unoptimized sizes="64px" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/40">
                                <button type="button" onClick={() => remove(i + 1)}
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 opacity-0 transition-opacity group-hover:opacity-100">
                                    <X className="h-3 w-3 text-gray-800" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {files.length < 6 && (
                        <button type="button" onClick={open}
                            className="flex aspect-square w-16 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                            <Plus className="h-4 w-4" />
                        </button>
                    )}
                    <span className="self-center pl-1 text-[11px] text-muted-foreground">{files.length} / 6</span>
                </div>
            )}

            {error && <p className="text-[12px] font-medium text-destructive">{error}</p>}
        </div>
    );
});
MainDropZone.displayName = 'MainDropZone';

// ─────────────────────────────────────────────────────────────────────────────
// SWATCH DROP ZONE
// ─────────────────────────────────────────────────────────────────────────────

interface SwatchDropZoneProps {
    file: File | null;
    onChange: (file: File | null) => void;
    error?: string;
}

const SwatchDropZone = memo(({ file, onChange, error }: SwatchDropZoneProps) => {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const preview = file ? URL.createObjectURL(file) : null;

    const process = useCallback((list: FileList | null) => {
        const f = list && Array.from(list).find(f => ALLOWED_MIME.includes(f.type) && f.size <= MAX_BYTES);
        onChange(f ?? null);
    }, [onChange]);

    const onDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files); }, [process]);
    const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true); }, []);
    const onLeave = useCallback(() => setDragging(false), []);
    const onInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { process(e.target.files); e.target.value = ''; }, [process]);
    const open = useCallback(() => inputRef.current?.click(), []);

    return (
        <div
            onClick={open}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onLeave}
            className={[
                'relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all',
                dragging ? 'border-primary bg-primary/5 scale-105'
                    : preview ? 'border-primary/30'
                        : error ? 'border-destructive/50'
                            : 'border-border hover:border-primary/40 hover:bg-muted/30',
            ].join(' ')}
        >
            {preview ? (
                <>
                    <Image src={preview} alt="Swatch" fill className="object-cover" unoptimized sizes="80px" />
                    <button type="button"
                        onClick={e => { e.stopPropagation(); onChange(null); }}
                        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white">
                        <X className="h-2.5 w-2.5" />
                    </button>
                </>
            ) : (
                <div className="flex flex-col items-center gap-1">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-[9px] text-muted-foreground">Swatch</span>
                </div>
            )}
            <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={onInput} />
        </div>
    );
});
SwatchDropZone.displayName = 'SwatchDropZone';

// ─────────────────────────────────────────────────────────────────────────────
// COLOR ROW  (reads only its own form slice via useFormContext)
// ─────────────────────────────────────────────────────────────────────────────

const ColorRow = memo(({ index, onRemove, canRemove }: {
    index: number;
    onRemove: () => void;
    canRemove: boolean;
}) => {
    const { control, formState: { errors } } = useFormContext<FormValues>();
    const rowErr = errors.availableColors?.[index];

    const toSingle = useCallback(
        (rhfChange: (v: File | null) => void) => (file: File | null) => rhfChange(file),
        []
    );

    return (
        <div className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/20">
            <div className="mt-2.5 cursor-grab text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                <GripVertical className="h-4 w-4" />
            </div>

            {/* Swatch image */}
            <FormField
                control={control}
                name={`availableColors.${index}.file`}
                render={({ field }) => (
                    <FormItem className="m-0 shrink-0 space-y-1">
                        <SwatchDropZone
                            file={field.value as File | null}
                            onChange={v => field.onChange(v)}
                            error={rowErr?.file?.message as string}
                        />
                        {rowErr?.file?.message && (
                            <p className="w-20 text-center text-[10px] text-destructive">{rowErr.file.message as string}</p>
                        )}
                    </FormItem>
                )}
            />

            {/* Color name */}
            <FormField
                control={control}
                name={`availableColors.${index}.name`}
                render={({ field }) => (
                    <FormItem className="flex-1 space-y-1">
                        <FormLabel className="text-xs text-muted-foreground">Color Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Ivory, Deep Gray, Cobalt…" className="h-9" {...field} />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                    </FormItem>
                )}
            />

            {canRemove && (
                <Button type="button" variant="ghost" size="icon" onClick={onRemove}
                    className="mt-6 h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
});
ColorRow.displayName = 'ColorRow';

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function CreateNewProductPage() {
    const form = useForm<FormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: DEFAULT_VALUES,
        mode: 'onBlur',   // validate on blur — kills keystroke re-render storms
    });

    const { control, handleSubmit, reset, formState: { errors } } = form;
    const { fields, append, remove } = useFieldArray({ control, name: 'availableColors' });

    const mutation = useMutation({
        mutationFn: createProduct,
        onSuccess: () => { toast.success('Product created!'); reset(); },
        onError: (e: Error) => toast.error(e.message ?? 'Something went wrong.'),
    });

    const onSubmit = useCallback<SubmitHandler<FormValues>>(data => mutation.mutate(data), [mutation]);
    const addColor = useCallback(() => append({ name: '', file: null }), [append]);
    const removeColor = useCallback((i: number) => remove(i), [remove]);

    const { isPending, isSuccess } = mutation;

    return (
        <div className="flex min-h-screen flex-col bg-background">

            {/* ── Sticky header ────────────────────────────────────────────── */}
            <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-14 items-center justify-between px-6">
                    <div className="flex items-center gap-2 text-sm">
                        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
                            <Link href="/admin/products">
                                <ArrowLeft className="h-3.5 w-3.5" /> Products
                            </Link>
                        </Button>
                        <span className="text-muted-foreground">/</span>
                        <span className="font-medium">New Product</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm"
                            onClick={() => { reset(); mutation.reset(); }} disabled={isPending}>
                            Discard
                        </Button>
                        <Button type="submit" form="create-product-form" size="sm"
                            disabled={isPending} className="min-w-[120px] gap-2">
                            {isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                                : isSuccess ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</>
                                    : 'Publish Product'}
                        </Button>
                    </div>
                </div>
            </header>

            {/* ── Page title ───────────────────────────────────────────────── */}
            <div className="border-b bg-muted/20 px-6 py-5">
                <h1 className="text-lg font-semibold tracking-tight">Create New Product</h1>
                <p className="text-sm text-muted-foreground">
                    Upload images on the left · fill product details + pricing on the right.
                </p>
            </div>

            {/* ── Two-column body ──────────────────────────────────────────── */}
            <Form {...form}>
                <form
                    id="create-product-form"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden"
                >

                    {/* ═══════════════════════════════════════════════
                        LEFT PANEL — Images & Color Variants
                    ═══════════════════════════════════════════════ */}
                    <div className="flex flex-col gap-6 border-r bg-muted/10 p-6 lg:w-[420px] lg:shrink-0">

                        {/* Main product images */}
                        <Card className="shadow-none">
                            <CardHeader className="pb-3 pt-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
                                        <Layers className="h-3.5 w-3.5" />
                                    </div>
                                    Product Images
                                </CardTitle>
                                <p className="text-[12px] text-muted-foreground">
                                    First image = storefront cover. Up to 6 photos.
                                </p>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <FormField
                                    control={control}
                                    name="mainImages"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <MainDropZone
                                                    files={field.value}
                                                    onChange={field.onChange}
                                                    error={errors.mainImages?.message as string}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Color variants */}
                        <Card className="shadow-none">
                            <CardHeader className="pb-3 pt-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
                                        <Palette className="h-3.5 w-3.5" />
                                    </div>
                                    Color Variants
                                </CardTitle>
                                <p className="text-[12px] text-muted-foreground">
                                    Each color needs a swatch image and a name.
                                </p>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2.5 pt-0">
                                {fields.map((field, idx) => (
                                    <ColorRow
                                        key={field.id}
                                        index={idx}
                                        onRemove={() => removeColor(idx)}
                                        canRemove={fields.length > 1}
                                    />
                                ))}

                                {typeof errors.availableColors?.message === 'string' && (
                                    <p className="text-[12px] font-medium text-destructive">
                                        {errors.availableColors.message}
                                    </p>
                                )}

                                <Button type="button" variant="outline" size="sm" onClick={addColor}
                                    className="mt-1 w-full border-dashed">
                                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Color Variant
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ═══════════════════════════════════════════════
                        RIGHT PANEL — Product Details + Pricing
                    ═══════════════════════════════════════════════ */}
                    <ScrollArea className="flex-1">
                        <div className="flex flex-col gap-6 p-6">

                            {/* ── 1. Basic Information ─────────────────── */}
                            <Card className="shadow-none">
                                <CardHeader className="pb-3 pt-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">1</span>
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

                                    <FormField control={control} name="code" render={({ field }) => (
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
                                                    {PRODUCT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={control} name="description" render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>Description <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <Textarea rows={3} placeholder="Short description shown on the product page…" className="resize-none" {...field} />
                                            </FormControl>
                                            <FormDescription>Minimum 10 characters.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </CardContent>
                            </Card>

                            <Separator />

                            {/* ── 2. Pricing ───────────────────────────── */}
                            <Card className="shadow-none">
                                <CardHeader className="pb-3 pt-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">2</span>
                                        Pricing
                                        <Badge variant="secondary" className="ml-1 text-[10px]">Live Calculator</Badge>
                                    </CardTitle>
                                    <p className="text-[12px] text-muted-foreground">
                                        Set the unit price per sq.ft — the calculator previews exact blind prices using the Excel quotation formula.
                                    </p>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-5 pt-0">

                                    {/* Unit price input */}
                                    <FormField control={control} name="unitPrice" render={({ field }) => (
                                        <FormItem className="max-w-xs">
                                            <FormLabel>
                                                Unit Price (₱ / sq.ft) <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">₱</span>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step={0.01}
                                                        placeholder="e.g. 120"
                                                        className="pl-7"
                                                        {...field}
                                                        onChange={e => field.onChange(e.target.valueAsNumber)}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Price charged per sq.ft of billable area. Minimum billable = 10 sq.ft.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    {/* Live calculator reads unitPrice from form via useWatch */}
                                    <PriceCalculator />
                                </CardContent>
                            </Card>

                            <Separator />

                            {/* ── 3. Technical Specifications ──────────── */}
                            <Card className="shadow-none">
                                <CardHeader className="pb-3 pt-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">3</span>
                                        Technical Specifications
                                    </CardTitle>
                                    <p className="text-[12px] text-muted-foreground">Fabric data shown on the product data sheet.</p>
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

                            {/* Mobile submit */}
                            <div className="flex justify-end pb-4 lg:hidden">
                                <Button type="submit" disabled={isPending} className="w-full gap-2 sm:w-auto">
                                    {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Publish Product'}
                                </Button>
                            </div>

                        </div>
                    </ScrollArea>

                </form>
            </Form>
        </div>
    );
}