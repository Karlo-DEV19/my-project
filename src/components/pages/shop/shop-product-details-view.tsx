'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
    Ruler, ShieldCheck, Wrench, Scissors, ChevronDown, Info,
    MapPin, Phone, Mail, ShoppingCart, X, ZoomIn, ChevronLeft, ChevronRight,
    Package, Layers, Maximize2,
} from 'lucide-react';
import { BlindsProductDetailResponse } from '@/lib/types/product-blinds-type';
// ─── Types ─────────────────────────────────────────────────────────────────────

interface PriceBreakdown {
    widthCm: number;
    heightCm: number;
    sqFt: number;
    chargeableSqFt: number;
    unitPrice: number;
    subTotalPerPanel: number;
    panels: number;
    total: number;
    minimumApplied: boolean;
}

export interface BlindOrderFields {
    productId: string;
    productName: string;
    productCode: string;
    selectedColor: string;
    widthCm: number;
    heightCm: number;
    panels: number;
    mountingType: string;
    controlSide: string;
    controlType: string;
    notes: string;
    branch: string;
    priceBreakdown: PriceBreakdown;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CM_TO_SQFT = 10.76;
const MIN_SQFT = 10;

const BRANCHES = [
    {
        id: 'cubao',
        name: 'MJ Decors Cubao Branch',
        address: '35 20th Avenue, Murphy Cubao, Quezon City, Philippines 1109',
        phone: '(02) 8932-8888',
        mobile: '0917-694-8888',
        email: 'mjdecor888@gmail.com',
    },
];

const STANDARD_SIZES = [
    { label: '60 × 120', width: 60, height: 120, popular: false },
    { label: '90 × 150', width: 90, height: 150, popular: true },
    { label: '120 × 160', width: 120, height: 160, popular: false },
    { label: '120 × 200', width: 120, height: 200, popular: true },
    { label: '150 × 200', width: 150, height: 200, popular: false },
    { label: '160 × 220', width: 160, height: 220, popular: false },
    { label: '180 × 220', width: 180, height: 220, popular: true },
    { label: '200 × 240', width: 200, height: 240, popular: false },
];

const MOUNTING_OPTIONS = ['Inside Mount', 'Outside Mount'];
const CONTROL_OPTIONS = ['Right Hand', 'Left Hand'];
const CONTROL_TYPE_OPTIONS = ['Cordless', 'Corded', 'Motorized'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcPrice(
    widthCm: number,
    heightCm: number,
    unitPrice: number,
    panels: number,
): PriceBreakdown {
    const sqFt = (widthCm / 100) * (heightCm / 100) * CM_TO_SQFT;
    const minimumApplied = sqFt < MIN_SQFT;
    const chargeableSqFt = minimumApplied ? MIN_SQFT : sqFt;
    const subTotalPerPanel = unitPrice * chargeableSqFt;
    const total = subTotalPerPanel * panels;
    return { widthCm, heightCm, sqFt, chargeableSqFt, unitPrice, subTotalPerPanel, panels, total, minimumApplied };
}

function php(n: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
    }).format(n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Simple full-screen lightbox */
const Lightbox = ({
    images,
    initialIndex,
    onClose,
}: {
    images: string[];
    initialIndex: number;
    onClose: () => void;
}) => {
    const [idx, setIdx] = useState(initialIndex);

    const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length]);
    const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length]);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, prev, next]);

    return (
        <div
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center border border-border text-foreground hover:bg-accent transition-colors"
                aria-label="Close"
            >
                <X className="w-4 h-4" strokeWidth={1.5} />
            </button>

            {/* Counter */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                {idx + 1} / {images.length}
            </div>

            <div className="relative w-full max-w-4xl h-[80vh] mx-6" onClick={e => e.stopPropagation()}>
                <Image
                    src={images[idx]}
                    alt={`Image ${idx + 1}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                />
            </div>

            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); prev(); }}
                        className="absolute left-4 md:left-8 w-10 h-10 flex items-center justify-center border border-border bg-background text-foreground hover:bg-accent transition-colors"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); next(); }}
                        className="absolute right-4 md:right-8 w-10 h-10 flex items-center justify-center border border-border bg-background text-foreground hover:bg-accent transition-colors"
                        aria-label="Next"
                    >
                        <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                </>
            )}

            {/* Thumbnail strip */}
            {images.length > 1 && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((url, i) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                            className={`relative w-12 h-12 border overflow-hidden transition-all ${i === idx ? 'border-foreground opacity-100' : 'border-border opacity-50 hover:opacity-80'}`}
                        >
                            <Image src={url} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

/** Color image dialog — shows only the color swatch image, no design chrome */
const ColorImageDialog = ({
    colorName,
    imageUrl,
    onClose,
}: {
    colorName: string;
    imageUrl: string;
    onClose: () => void;
}) => {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center border border-border text-foreground hover:bg-accent transition-colors"
                aria-label="Close"
            >
                <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <div
                className="relative w-full max-w-sm aspect-square overflow-hidden border border-border shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <Image src={imageUrl} alt={colorName} fill className="object-cover" sizes="480px" priority />
                {/* Minimal label at bottom */}
                <div className="absolute bottom-0 inset-x-0 py-3 px-4 bg-background/80 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-widest text-foreground font-medium text-center">{colorName}</p>
                </div>
            </div>
        </div>
    );
};

/** Reusable native select */
const SelectField = ({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
}) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</label>
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="h-11 w-full border border-border bg-transparent px-4 pr-8 text-sm text-foreground appearance-none focus:outline-none focus:border-foreground transition-colors cursor-pointer"
            >
                {options.map(o => <option key={o}>{o}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
        </div>
    </div>
);

/** Section divider with label */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[10px] uppercase tracking-widest font-semibold text-foreground mb-5 flex items-center gap-3">
        <span className="inline-block w-4 h-px bg-foreground/30" />
        {children}
    </h3>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
    /**
     * The nested `data` object from BlindsProductDetailResponse.
     * Usually accessed as: const { product } = useGetBlindsDetailsByProductId(id)
     * Pass `product` directly here.
     */
    product: NonNullable<BlindsProductDetailResponse['data']>;
}

const ShopProductDetailsView = ({ product }: Props) => {
    // Derived lists
    const imageUrls = product.images.map(i => i.imageUrl);
    const colors = product.colors;

    // Gallery state
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIdx, setLightboxIdx] = useState(0);

    const openLightbox = useCallback((idx: number) => {
        setLightboxIdx(idx);
        setLightboxOpen(true);
    }, []);

    // Color dialog state
    const [colorDialog, setColorDialog] = useState<{ name: string; imageUrl: string } | null>(null);

    // Order state
    const [selectedColor, setSelectedColor] = useState(colors[0] ?? null);
    const [selectedPreset, setSelectedPreset] = useState<typeof STANDARD_SIZES[0] | null>(null);
    const [widthCm, setWidthCm] = useState('');
    const [heightCm, setHeightCm] = useState('');
    const [panels, setPanels] = useState(1);
    const [mountingType, setMountingType] = useState(MOUNTING_OPTIONS[0]);
    const [controlSide, setControlSide] = useState(CONTROL_OPTIONS[0]);
    const [controlType, setControlType] = useState(CONTROL_TYPE_OPTIONS[0]);
    const [notes, setNotes] = useState('');
    const [branch, setBranch] = useState(BRANCHES[0]);

    const isReady = !!widthCm && !!heightCm && Number(widthCm) > 0 && Number(heightCm) > 0;

    const price = useMemo<PriceBreakdown | null>(() => {
        const w = Number(widthCm);
        const h = Number(heightCm);
        if (!w || !h || w <= 0 || h <= 0) return null;
        return calcPrice(w, h, product.unitPrice, panels);
    }, [widthCm, heightCm, panels, product.unitPrice]);

    const handlePresetSelect = (preset: typeof STANDARD_SIZES[0]) => {
        setSelectedPreset(preset);
        setWidthCm(String(preset.width));
        setHeightCm(String(preset.height));
    };

    const handleDimChange = (field: 'w' | 'h', val: string) => {
        setSelectedPreset(null);
        field === 'w' ? setWidthCm(val) : setHeightCm(val);
    };

    const handleAddToCart = () => {
        if (!isReady || !price) return;
        const payload: BlindOrderFields = {
            productId: product.id,
            productName: product.name,
            productCode: product.productCode,
            selectedColor: selectedColor?.name ?? '',
            widthCm: Number(widthCm),
            heightCm: Number(heightCm),
            panels,
            mountingType,
            controlSide,
            controlType,
            notes,
            branch: branch.id,
            priceBreakdown: price,
        };
        console.log('ADD TO CART:', payload);
        // TODO: dispatch to cart store
    };

    const maxFabricWidth = parseInt(product.fabricWidth ?? '280', 10) || 280;

    return (
        <>
            {/* ── Lightbox ── */}
            {lightboxOpen && imageUrls.length > 0 && (
                <Lightbox
                    images={imageUrls}
                    initialIndex={lightboxIdx}
                    onClose={() => setLightboxOpen(false)}
                />
            )}

            {/* ── Color Image Dialog ── */}
            {colorDialog && (
                <ColorImageDialog
                    colorName={colorDialog.name}
                    imageUrl={colorDialog.imageUrl}
                    onClose={() => setColorDialog(null)}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-24 items-start w-full">

                {/* ════════════════════════════════════════════════════
                    LEFT — GALLERY
                ════════════════════════════════════════════════════ */}
                <div className="flex flex-col gap-4 lg:sticky lg:top-24">

                    {/* Main image */}
                    <div
                        className="relative aspect-[4/5] w-full bg-muted border border-border overflow-hidden group cursor-zoom-in"
                        onClick={() => openLightbox(activeImageIdx)}
                        role="button"
                        tabIndex={0}
                        aria-label="Open full-size image"
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') openLightbox(activeImageIdx); }}
                    >
                        {imageUrls.length > 0 ? (
                            <Image
                                src={imageUrls[activeImageIdx]}
                                alt={product.name}
                                fill
                                priority
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 font-serif text-sm bg-accent/20">
                                Image Unavailable
                            </div>
                        )}

                        {/* Zoom hint */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm px-2.5 py-1.5 border border-border/60">
                            <ZoomIn className="w-3 h-3 text-foreground" strokeWidth={1.5} />
                            <span className="text-[9px] uppercase tracking-widest text-foreground font-medium">View</span>
                        </div>

                        {/* Status badge */}
                        {product.status && product.status !== 'active' && (
                            <div className="absolute top-3 left-3">
                                <span className="text-[9px] uppercase tracking-widest font-medium px-2 py-1 bg-background/80 backdrop-blur-sm border border-border text-muted-foreground">
                                    {product.status}
                                </span>
                            </div>
                        )}

                        {/* Image counter */}
                        {imageUrls.length > 1 && (
                            <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm border border-border/60 px-2 py-1">
                                <span className="text-[9px] uppercase tracking-widest text-foreground font-medium">
                                    {activeImageIdx + 1} / {imageUrls.length}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Thumbnail strip */}
                    {imageUrls.length > 1 && (
                        <div className="grid grid-cols-5 gap-2">
                            {imageUrls.map((url, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImageIdx(idx)}
                                    className={`relative aspect-square overflow-hidden border transition-all duration-200 ${activeImageIdx === idx
                                        ? 'border-foreground opacity-100 ring-1 ring-foreground/20'
                                        : 'border-border opacity-55 hover:opacity-90 hover:border-foreground/40'
                                        }`}
                                    aria-label={`View image ${idx + 1}`}
                                >
                                    <Image src={url} alt={`${product.name} ${idx + 1}`} fill className="object-cover" sizes="80px" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── Specs card — visible on desktop in the gallery column ── */}
                    <div className="hidden lg:block border border-border mt-2">
                        <div className="px-5 py-4 border-b border-border bg-accent/20">
                            <span className="text-[10px] uppercase tracking-widest font-semibold text-foreground flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5" strokeWidth={1.5} />
                                Technical Specifications
                            </span>
                        </div>
                        <div className="divide-y divide-border">
                            {([
                                { icon: Package, label: 'Composition', value: product.composition },
                                { icon: Maximize2, label: 'Fabric Width', value: product.fabricWidth },
                                { icon: Ruler, label: 'Thickness', value: product.thickness },
                                { icon: Package, label: 'Packing', value: product.packing },
                                ...(product.characteristic ? [{ icon: Info, label: 'Characteristic', value: product.characteristic }] : []),
                            ] as { icon: React.ElementType; label: string; value: string | null }[])
                                .filter(r => !!r.value)
                                .map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="flex items-start gap-4 px-5 py-3 hover:bg-accent/30 transition-colors">
                                        <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium w-28 shrink-0 pt-px">{label}</span>
                                        <span className="text-xs text-foreground font-medium leading-relaxed">{value}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════
                    RIGHT — PRODUCT INFO + CONFIGURATOR
                ════════════════════════════════════════════════════ */}
                <div className="flex flex-col min-w-0">

                    {/* 1 · Header ──────────────────────────────────── */}
                    <div className="flex flex-col gap-3 border-b border-border pb-7">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium border border-border/60 px-2.5 py-1">
                                {product.type}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                                {product.productCode}
                            </span>
                        </div>
                        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-wide text-foreground leading-tight">
                            {product.name}
                        </h1>
                        <div className="w-10 h-px bg-border" />
                        {product.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {product.description}
                            </p>
                        )}
                        {/* Price pill */}
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="font-serif text-2xl text-foreground font-medium tracking-wide">
                                {php(product.unitPrice)}
                            </span>
                            <span className="text-xs text-muted-foreground">/ sq·ft</span>
                        </div>
                    </div>

                    {/* 2 · Branch ──────────────────────────────────── */}
                    <div className="py-7 border-b border-border">
                        <SectionLabel>Select Branch</SectionLabel>
                        <div className="flex flex-col gap-3">
                            {BRANCHES.map(b => {
                                const active = branch.id === b.id;
                                return (
                                    <button
                                        key={b.id}
                                        onClick={() => setBranch(b)}
                                        className={`w-full flex flex-col gap-2 p-4 border text-left transition-all duration-200 ${active
                                            ? 'border-foreground bg-foreground/[0.03]'
                                            : 'border-border hover:border-foreground/40'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-sm font-medium text-foreground">{b.name}</span>
                                            {active && (
                                                <span className="shrink-0 text-[9px] uppercase tracking-widest bg-foreground text-background px-2 py-0.5 font-semibold">
                                                    Selected
                                                </span>
                                            )}
                                        </div>
                                        <span className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={1.5} />
                                            {b.address}
                                        </span>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Phone className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                                                {b.phone} / {b.mobile}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Mail className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                                                {b.email}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3 · Color ───────────────────────────────────── */}
                    {colors.length > 0 && (
                        <div className="py-7 border-b border-border">
                            <div className="flex items-center justify-between mb-5">
                                <SectionLabel>Fabric Color</SectionLabel>
                                {selectedColor && (
                                    <span className="text-xs text-muted-foreground font-medium">
                                        Selected: {selectedColor.name}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {colors.map(color => {
                                    const sel = selectedColor?.id === color.id;
                                    return (
                                        <div key={color.id} className="cursor-pointer flex flex-col items-center gap-2 group">
                                            {/* Swatch — click selects and opens dialog */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => {
                                                        setSelectedColor(color);
                                                        setColorDialog({ name: color.name, imageUrl: color.imageUrl });
                                                    }}
                                                    className={`block p-1 border rounded-full transition-all duration-200 ${sel
                                                        ? 'border-foreground'
                                                        : 'border-transparent group-hover:border-border'
                                                        }`}
                                                    aria-label={`Select and view color ${color.name}`}
                                                >
                                                    <div className="relative w-10 h-10 rounded-full border border-border/50 shadow-sm overflow-hidden">
                                                        <Image
                                                            src={color.imageUrl}
                                                            alt={color.name}
                                                            fill
                                                            sizes="40px"
                                                            className="object-cover"
                                                        />
                                                        {/* Zoom overlay inside swatch */}
                                                        <div className="absolute inset-0 bg-background/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                            <ZoomIn className="w-4 h-4 text-foreground drop-shadow-md" strokeWidth={2} />
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                            <span className={`text-[10px] uppercase tracking-widest transition-colors leading-none ${sel
                                                ? 'text-foreground'
                                                : 'text-muted-foreground group-hover:text-foreground'
                                                }`}>
                                                {color.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-4 flex items-center gap-1.5">
                                <ZoomIn className="w-3 h-3" strokeWidth={1.5} />
                                Click a swatch to select and preview the full color image.
                            </p>
                        </div>
                    )}

                    {/* 4 · Size ────────────────────────────────────── */}
                    <div className="py-7 border-b border-border">
                        <div className="flex items-start justify-between gap-4 mb-1">
                            <SectionLabel>Select Size (cm)</SectionLabel>
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                                <Info className="w-3 h-3" strokeWidth={1.5} />
                                Width × Height
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-5 -mt-3">
                            Choose a standard size or enter your exact measurements below.
                        </p>

                        {/* Presets */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                            {STANDARD_SIZES.map(preset => {
                                const active = selectedPreset?.label === preset.label;
                                return (
                                    <button
                                        key={preset.label}
                                        onClick={() => handlePresetSelect(preset)}
                                        className={`relative flex flex-col items-center justify-center px-3 py-3 border text-center transition-all duration-200 gap-1 ${active
                                            ? 'border-foreground bg-foreground text-background'
                                            : 'border-border hover:border-foreground/40 bg-transparent text-foreground'
                                            }`}
                                    >
                                        <span className="text-xs font-medium tracking-wide">{preset.label}</span>
                                        <span className={`text-[9px] font-medium ${active ? 'text-background/60' : 'text-muted-foreground'}`}>cm</span>
                                        {preset.popular && (
                                            <span className={`absolute top-1.5 right-1.5 text-[8px] uppercase tracking-widest font-semibold px-1 ${active ? 'text-background/70' : 'text-muted-foreground'}`}>
                                                ★
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom inputs */}
                        <div className="grid grid-cols-2 gap-4">
                            {([
                                { field: 'w' as const, label: 'Width (cm)', val: widthCm, hint: `Max: ${product.fabricWidth ?? '280cm'}`, ph: 'e.g. 120' },
                                { field: 'h' as const, label: 'Height (cm)', val: heightCm, hint: 'Standard drop up to 300cm', ph: 'e.g. 200' },
                            ]).map(({ field, label, val, hint, ph }) => (
                                <div key={field} className="flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                                        {label}
                                    </label>
                                    <input
                                        type="number"
                                        min={20}
                                        max={field === 'w' ? maxFabricWidth : 3000}
                                        placeholder={ph}
                                        value={val}
                                        onChange={e => handleDimChange(field, e.target.value)}
                                        className="h-11 border border-border bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
                                    />
                                    <span className="text-[10px] text-muted-foreground">{hint}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 5 · Configuration ───────────────────────────── */}
                    <div className="py-7 border-b border-border">
                        <SectionLabel>Configuration</SectionLabel>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {/* Panels */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Panels</label>
                                <div className="flex items-center border border-border h-11">
                                    <button
                                        onClick={() => setPanels(p => Math.max(1, p - 1))}
                                        className="w-11 h-full flex items-center justify-center text-foreground hover:bg-accent transition-colors text-lg font-light shrink-0"
                                        aria-label="Decrease panels"
                                    >
                                        −
                                    </button>
                                    <span className="flex-1 text-center text-sm font-medium text-foreground">{panels}</span>
                                    <button
                                        onClick={() => setPanels(p => p + 1)}
                                        className="w-11 h-full flex items-center justify-center text-foreground hover:bg-accent transition-colors text-lg font-light shrink-0"
                                        aria-label="Increase panels"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <SelectField label="Mounting Type" value={mountingType} options={MOUNTING_OPTIONS} onChange={setMountingType} />
                            <SelectField label="Control Side" value={controlSide} options={CONTROL_OPTIONS} onChange={setControlSide} />
                            <SelectField label="Control Type" value={controlType} options={CONTROL_TYPE_OPTIONS} onChange={setControlType} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                                Special Notes <span className="normal-case text-muted-foreground/60">(optional)</span>
                            </label>
                            <textarea
                                rows={2}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="e.g. arched window, specific bracket type, delivery instructions…"
                                className="border border-border bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors resize-none"
                            />
                        </div>
                    </div>

                    {/* 6 · Price Estimate ──────────────────────────── */}
                    <div className="py-7 border-b border-border">
                        <SectionLabel>Price Estimate</SectionLabel>

                        {!isReady ? (
                            <div className="flex items-start gap-3 px-4 py-4 border border-dashed border-border bg-accent/20">
                                <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Enter width and height above to see your instant price estimate.
                                </p>
                            </div>
                        ) : price ? (
                            <div className="border border-border overflow-hidden">
                                {([
                                    { label: 'Dimensions', value: `${price.widthCm} × ${price.heightCm} cm`, sub: null, shaded: true },
                                    { label: 'Area', value: `${price.sqFt.toFixed(3)} sq/ft`, sub: '(W÷100) × (H÷100) × 10.76', shaded: false },
                                    {
                                        label: 'Chargeable',
                                        value: `${price.chargeableSqFt.toFixed(3)} sq/ft`,
                                        sub: price.minimumApplied ? `Min. ${MIN_SQFT} sq/ft applied` : null,
                                        shaded: true,
                                    },
                                    { label: 'Unit Price', value: `${php(price.unitPrice)} / sq/ft`, sub: null, shaded: false },
                                    {
                                        label: 'Per Panel',
                                        value: php(price.subTotalPerPanel),
                                        sub: `${php(price.unitPrice)} × ${price.chargeableSqFt.toFixed(3)}`,
                                        shaded: true,
                                    },
                                    { label: 'Panels', value: `× ${price.panels}`, sub: null, shaded: false },
                                ] as { label: string; value: string; sub: string | null; shaded: boolean }[]).map(({ label, value, sub, shaded }) => (
                                    <div key={label} className={`grid grid-cols-2 px-4 py-3 ${shaded ? 'bg-accent/20' : ''}`}>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
                                            {sub && <span className="text-[10px] text-muted-foreground/60">{sub}</span>}
                                        </div>
                                        <span className="text-sm text-right font-medium text-foreground self-center">{value}</span>
                                    </div>
                                ))}

                                <div className="flex items-center justify-between px-4 py-4 bg-foreground text-background">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70">Total Estimate</span>
                                        <span className="text-[10px] opacity-50">excl. installation / delivery</span>
                                    </div>
                                    <span className="text-2xl font-serif font-medium tracking-wide">{php(price.total)}</span>
                                </div>

                                <p className="px-4 py-2.5 text-[10px] text-muted-foreground bg-accent/20 leading-relaxed">
                                    Estimate only. Final price confirmed upon official measurement and order conforme.
                                    50% down payment required upon conforme; 50% upon delivery &amp; installation.
                                </p>
                            </div>
                        ) : null}
                    </div>

                    {/* 7 · CTA ─────────────────────────────────────── */}
                    <div className="flex flex-col gap-3 py-7 border-b border-border">
                        {!isReady && (
                            <p className="text-[11px] text-muted-foreground text-center pb-1">
                                Please select a size to continue.
                            </p>
                        )}
                        <button
                            onClick={handleAddToCart}
                            disabled={!isReady}
                            className="flex items-center justify-center gap-3 h-14 w-full bg-foreground text-background uppercase tracking-widest text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ShoppingCart className="w-4 h-4" strokeWidth={1.5} />
                            Add to Cart
                        </button>
                    </div>

                    {/* 8 · Value props ─────────────────────────────── */}
                    <div className="grid grid-cols-3 gap-4 py-7 border-b border-border">
                        {([
                            { Icon: Ruler, title: 'Custom Made', sub: 'Tailored to exact size' },
                            { Icon: Wrench, title: 'Installation', sub: 'Expert fitting available' },
                            { Icon: ShieldCheck, title: '1 Year Warranty', sub: 'Factory defects covered' },
                        ] as const).map(({ Icon, title, sub }) => (
                            <div key={title} className="flex flex-col items-center text-center gap-1.5">
                                <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                                <span className="text-[10px] uppercase tracking-widest font-medium text-foreground leading-tight">{title}</span>
                                <span className="text-[10px] text-muted-foreground leading-snug">{sub}</span>
                            </div>
                        ))}
                    </div>

                    {/* 9 · Specs — mobile only (desktop shows in left column) ── */}
                    <div className="lg:hidden py-7">
                        <SectionLabel>Technical Specifications</SectionLabel>
                        <div className="grid grid-cols-1 divide-y divide-border border-y border-border">
                            {([
                                { label: 'Composition', value: product.composition },
                                { label: 'Fabric Width', value: product.fabricWidth },
                                { label: 'Thickness', value: product.thickness },
                                { label: 'Packing', value: product.packing },
                                { label: 'Unit Price', value: `${php(product.unitPrice)} / sq·ft` },
                                ...(product.characteristic ? [{ label: 'Characteristic', value: product.characteristic }] : []),
                            ] as { label: string; value: string | null }[])
                                .filter(r => !!r.value)
                                .map(({ label, value }) => (
                                    <div key={label} className="grid grid-cols-2 py-4 gap-4 items-start hover:bg-accent/30 transition-colors px-1">
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</span>
                                        <span className="text-xs text-foreground font-medium leading-relaxed">{value}</span>
                                    </div>
                                ))}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default ShopProductDetailsView;