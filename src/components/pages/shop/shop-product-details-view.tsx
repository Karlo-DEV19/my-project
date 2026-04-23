'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
    Ruler, ShieldCheck, Wrench, Scissors, ChevronDown, Info,
    MapPin, Phone, Mail, ShoppingCart, X, ZoomIn, ChevronLeft, ChevronRight,
    Package, Layers, Maximize2,
} from 'lucide-react';
import { useCartStore, type BlindOrderFields } from '@/lib/zustand/use-cart-store';
import { BlindsProductDetailResponse } from '@/lib/types/product-blinds-type';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ProductData = NonNullable<BlindsProductDetailResponse['data']>

interface Props {
    /** Product is guaranteed non-null by the time this component renders */
    product: ProductData
}

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

// ─── Constants ─────────────────────────────────────────────────────────────────

const CM_TO_SQFT = 10.76;
const MIN_SQFT = 10;

/** Hard limits enforced on width and height inputs */
const DIM_LIMITS = { widthMax: 260, heightMax: 300, min: 1 } as const;

const BRANCHES = [
    {
        id: 'cubao',
        name: 'MJ Decors Cubao Branch',
        address: '35 20th Avenue, Murphy Cubao, Quezon City, Philippines 1109',
        phone: '(02) 8932-8888',
        mobile: '0917-694-8888',
        email: 'mjdecor888@gmail.com',
    },
] as const;

const STANDARD_SIZES = [
    { label: '60 × 120', width: 60, height: 120, popular: false },
    { label: '90 × 150', width: 90, height: 150, popular: true },
    { label: '120 × 160', width: 120, height: 160, popular: false },
    { label: '120 × 200', width: 120, height: 200, popular: true },
    { label: '150 × 200', width: 150, height: 200, popular: false },
    { label: '160 × 220', width: 160, height: 220, popular: false },
    { label: '180 × 220', width: 180, height: 220, popular: true },
    { label: '200 × 240', width: 200, height: 240, popular: false },
] as const;

const MOUNTING_OPTIONS = ['Inside Mount', 'Outside Mount'] as const;
const CONTROL_OPTIONS = ['Right Hand', 'Left Hand'] as const;
const CONTROL_TYPE_OPTIONS = ['Yarn', 'Beads',] as const;

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

const Lightbox = ({
    images, initialIndex, onClose,
}: {
    images: string[]
    initialIndex: number
    onClose: () => void
}) => {
    const [idx, setIdx] = useState(initialIndex);
    const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length]);
    const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length]);

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
            <button onClick={onClose}
                className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center border border-border text-foreground hover:bg-accent transition-colors"
                aria-label="Close lightbox">
                <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                {idx + 1} / {images.length}
            </div>
            <div className="relative w-full max-w-4xl h-[80vh] mx-6" onClick={e => e.stopPropagation()}>
                <Image src={images[idx]} alt={`Product image ${idx + 1}`} fill className="object-contain" sizes="100vw" priority />
            </div>
            {images.length > 1 && (
                <>
                    <button onClick={(e) => { e.stopPropagation(); prev(); }}
                        className="absolute left-4 md:left-8 w-10 h-10 flex items-center justify-center border border-border bg-background text-foreground hover:bg-accent transition-colors"
                        aria-label="Previous image">
                        <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); next(); }}
                        className="absolute right-4 md:right-8 w-10 h-10 flex items-center justify-center border border-border bg-background text-foreground hover:bg-accent transition-colors"
                        aria-label="Next image">
                        <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                </>
            )}
            {images.length > 1 && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((url, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                            className={`relative w-12 h-12 border overflow-hidden transition-all ${i === idx ? 'border-foreground opacity-100' : 'border-border opacity-50 hover:opacity-80'}`}
                            aria-label={`Go to image ${i + 1}`}>
                            <Image src={url} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const ColorImageDialog = ({
    colorName, imageUrl, onClose,
}: {
    colorName: string
    imageUrl: string
    onClose: () => void
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
            <button onClick={onClose}
                className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center border border-border text-foreground hover:bg-accent transition-colors"
                aria-label="Close color preview">
                <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <div
                className="relative w-full max-w-sm aspect-square overflow-hidden border border-border shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <Image src={imageUrl} alt={colorName} fill className="object-cover" sizes="480px" priority />
                <div className="absolute bottom-0 inset-x-0 py-3 px-4 bg-background/80 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-widest text-foreground font-medium text-center">{colorName}</p>
                </div>
            </div>
        </div>
    );
};

const SelectField = ({
    label, value, options, onChange,
}: {
    label: string
    value: string
    options: readonly string[]
    onChange: (v: string) => void
}) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</label>
        <div className="relative">
            <select value={value} onChange={e => onChange(e.target.value)}
                className="h-11 w-full border border-border bg-transparent px-4 pr-8 text-sm text-foreground appearance-none focus:outline-none focus:border-foreground transition-colors cursor-pointer">
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
        </div>
    </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[10px] uppercase tracking-widest font-semibold text-foreground mb-5 flex items-center gap-3">
        <span className="inline-block w-4 h-px bg-foreground/30" />
        {children}
    </h3>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ShopProductDetailsView = ({ product }: Props) => {
    // Subscribe to addToCart only — avoids re-renders from unrelated state changes
    const addToCart = useCartStore(s => s.addToCart);

    const imageUrls = useMemo(() => product.images.map(i => i.imageUrl), [product.images]);
    const colors = product.colors;

    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIdx, setLightboxIdx] = useState(0);

    const openLightbox = useCallback((idx: number) => {
        setLightboxIdx(idx);
        setLightboxOpen(true);
    }, []);

    const [colorDialog, setColorDialog] = useState<{ name: string; imageUrl: string } | null>(null);

    // Default to first color if available
    const [selectedColor, setSelectedColor] = useState<typeof colors[0] | null>(
        colors.length > 0 ? colors[0] : null
    );
    const [selectedPreset, setSelectedPreset] = useState<typeof STANDARD_SIZES[number] | null>(null);
    const [widthCm, setWidthCm] = useState('');
    const [heightCm, setHeightCm] = useState('');
    const [dimErrors, setDimErrors] = useState<{ w: string | null; h: string | null }>({ w: null, h: null });
    const [panels, setPanels] = useState(1);
    const [mountingType, setMountingType] = useState<string>(MOUNTING_OPTIONS[0]);
    const [controlSide, setControlSide] = useState<string>(CONTROL_OPTIONS[0]);
    const [controlType, setControlType] = useState<string>(CONTROL_TYPE_OPTIONS[0]);
    const [notes, setNotes] = useState('');
    const [branch, setBranch] = useState(BRANCHES[0]);

    // Reset image index when product changes (navigating between products)
    useEffect(() => {
        setActiveImageIdx(0);
    }, [product.id]);

    const isReady = !!widthCm && !!heightCm && Number(widthCm) > 0 && Number(heightCm) > 0;

    const price = useMemo<PriceBreakdown | null>(() => {
        const w = Number(widthCm);
        const h = Number(heightCm);
        if (!w || !h || w <= 0 || h <= 0) return null;
        return calcPrice(w, h, product.unitPrice, panels);
    }, [widthCm, heightCm, panels, product.unitPrice]);

    const handlePresetSelect = useCallback((preset: typeof STANDARD_SIZES[number]) => {
        setSelectedPreset(preset);
        setWidthCm(String(preset.width));
        setHeightCm(String(preset.height));
        setDimErrors({ w: null, h: null });
    }, []);

    const handleDimChange = useCallback((field: 'w' | 'h', val: string) => {
        setSelectedPreset(null);

        // Allow empty string so user can clear the field
        if (val === '') {
            if (field === 'w') setWidthCm('');
            else setHeightCm('');
            setDimErrors(prev => ({ ...prev, [field]: null }));
            return;
        }

        // Reject non-numeric input
        const parsed = Number(val);
        if (!Number.isFinite(parsed)) return;

        const max = field === 'w' ? DIM_LIMITS.widthMax : DIM_LIMITS.heightMax;
        const label = field === 'w' ? 'Width' : 'Height';

        if (parsed < DIM_LIMITS.min) {
            // Clamp to minimum — do not show an error for partial typing (e.g. "-")
            const clamped = DIM_LIMITS.min;
            if (field === 'w') setWidthCm(String(clamped));
            else setHeightCm(String(clamped));
            setDimErrors(prev => ({ ...prev, [field]: `${label} must be at least ${DIM_LIMITS.min} cm` }));
            return;
        }

        if (parsed > max) {
            // Clamp to maximum and show inline error
            if (field === 'w') setWidthCm(String(max));
            else setHeightCm(String(max));
            setDimErrors(prev => ({ ...prev, [field]: `${label} capped at ${max} cm` }));
            return;
        }

        // Valid value — store and clear any previous error
        if (field === 'w') setWidthCm(val);
        else setHeightCm(val);
        setDimErrors(prev => ({ ...prev, [field]: null }));
    }, []);

    const handleAddToCart = useCallback(() => {
        if (!isReady || !price) return;

        const payload: BlindOrderFields = {
            productId: product.id,
            productName: product.name,
            productCode: product.productCode,
            productImage: imageUrls[0] ?? '',
            selectedColor: selectedColor
                ? {
                    colorId: selectedColor.id,
                    name: selectedColor.name,
                    imageUrl: selectedColor.imageUrl,
                }
                : undefined,
            widthCm: Number(widthCm),
            heightCm: Number(heightCm),
            panels,
            mountingType,
            controlSide,
            controlType,
            notes: notes.trim() || undefined,
            branch: branch.id,
            priceBreakdown: price,
        };

        addToCart(payload);
    }, [
        isReady, price, product, imageUrls, selectedColor,
        widthCm, heightCm, panels, mountingType, controlSide,
        controlType, notes, branch, addToCart,
    ]);

    // Respect both the product's fabric width and the hard 260 cm cap
    const maxFabricWidth = Math.min(parseInt(product.fabricWidth ?? '280', 10) || 280, DIM_LIMITS.widthMax);

    const specRows = useMemo(() => ([
        { icon: Package, label: 'Composition', value: product.composition },
        { icon: Maximize2, label: 'Fabric Width', value: product.fabricWidth },
        { icon: Ruler, label: 'Thickness', value: product.thickness },
        ...(product.characteristic ? [{ icon: Info, label: 'Characteristic', value: product.characteristic }] : []),
    ] as { icon: React.ElementType; label: string; value: string | null }[])
        .filter(r => !!r.value), [product]);

    return (
        <>
            {lightboxOpen && imageUrls.length > 0 && (
                <Lightbox images={imageUrls} initialIndex={lightboxIdx} onClose={() => setLightboxOpen(false)} />
            )}
            {colorDialog && (
                <ColorImageDialog
                    colorName={colorDialog.name}
                    imageUrl={colorDialog.imageUrl}
                    onClose={() => setColorDialog(null)}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-24 items-start w-full">

                {/* ── LEFT: Gallery ─────────────────────────────────── */}
                <div className="flex flex-col gap-4 lg:sticky lg:top-24">
                    <div
                        className="relative aspect-4/5 w-full bg-muted border border-border overflow-hidden group cursor-zoom-in"
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
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm px-2.5 py-1.5 border border-border/60">
                            <ZoomIn className="w-3 h-3 text-foreground" strokeWidth={1.5} />
                            <span className="text-[9px] uppercase tracking-widest text-foreground font-medium">View</span>
                        </div>
                        {product.status && product.status !== 'active' && (
                            <div className="absolute top-3 left-3">
                                <span className="text-[9px] uppercase tracking-widest font-medium px-2 py-1 bg-background/80 backdrop-blur-sm border border-border text-muted-foreground">
                                    {product.status}
                                </span>
                            </div>
                        )}
                        {imageUrls.length > 1 && (
                            <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm border border-border/60 px-2 py-1">
                                <span className="text-[9px] uppercase tracking-widest text-foreground font-medium">
                                    {activeImageIdx + 1} / {imageUrls.length}
                                </span>
                            </div>
                        )}
                    </div>

                    {imageUrls.length > 1 && (
                        <div className="grid grid-cols-5 gap-2">
                            {imageUrls.map((url, idx) => (
                                <button
                                    key={`thumb-${idx}`}
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

                    {/* Specs — desktop only */}
                    {specRows.length > 0 && (
                        <div className="hidden lg:block border border-border mt-2">
                            <div className="px-5 py-4 border-b border-border bg-accent/20">
                                <span className="text-[10px] uppercase tracking-widest font-semibold text-foreground flex items-center gap-2">
                                    <Layers className="w-3.5 h-3.5" strokeWidth={1.5} />
                                    Technical Specifications
                                </span>
                            </div>
                            <div className="divide-y divide-border">
                                {specRows.map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="flex items-start gap-4 px-5 py-3 hover:bg-accent/30 transition-colors">
                                        <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium w-28 shrink-0 pt-px">{label}</span>
                                        <span className="text-xs text-foreground font-medium leading-relaxed">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Configurator ───────────────────────────── */}
                <div className="flex flex-col min-w-0">

                    {/* Header */}
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
                            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                        )}
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="font-serif text-2xl text-foreground font-medium tracking-wide">
                                {php(product.unitPrice)}
                            </span>
                            <span className="text-xs text-muted-foreground">/ sq·ft</span>
                        </div>
                    </div>

                    {/* Color selector */}
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
                                {colors.map((color) => {
                                    const sel = selectedColor?.id === color.id;
                                    return (
                                        <div key={color.id} className="cursor-pointer flex flex-col items-center gap-2 group">
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
                                                    aria-label={`Select color ${color.name}`}
                                                >
                                                    <div className="relative w-10 h-10 rounded-full border border-border/50 shadow-sm overflow-hidden">
                                                        <Image src={color.imageUrl} alt={color.name} fill sizes="40px" className="object-cover" />
                                                        <div className="absolute inset-0 bg-background/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                            <ZoomIn className="w-4 h-4 text-foreground drop-shadow-md" strokeWidth={2} />
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                            <span className={`text-[10px] uppercase tracking-widest transition-colors leading-none ${sel ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
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

                    {/* Size selector */}
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
                        <div className="grid grid-cols-2 gap-4">
                            {([
                                { field: 'w' as const, label: 'Width (cm)', val: widthCm, hint: `Max: ${maxFabricWidth} cm`, ph: 'e.g. 120' },
                                { field: 'h' as const, label: 'Height (cm)', val: heightCm, hint: `Max: ${DIM_LIMITS.heightMax} cm`, ph: 'e.g. 200' },
                            ]).map(({ field, label, val, hint, ph }) => (
                                <div key={field} className="flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</label>
                                    <input
                                        type="number"
                                        min={DIM_LIMITS.min}
                                        max={field === 'w' ? maxFabricWidth : DIM_LIMITS.heightMax}
                                        placeholder={ph}
                                        value={val}
                                        onChange={e => handleDimChange(field, e.target.value)}
                                        className="h-11 border border-border bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
                                    />
                                    {dimErrors[field] ? (
                                        <span className="text-[10px] text-destructive">{dimErrors[field]}</span>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground">{hint}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Configuration */}
                    <div className="py-7 border-b border-border">
                        <SectionLabel>Configuration</SectionLabel>
                        <div className="grid grid-cols-2 gap-4 mb-4">
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
                                placeholder="e.g. arched window, specific bracket type…"
                                className="border border-border bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors resize-none"
                            />
                        </div>
                    </div>

                    {/* Price estimate */}
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
                                    { label: 'Chargeable', value: `${price.chargeableSqFt.toFixed(3)} sq/ft`, sub: price.minimumApplied ? `Min. ${MIN_SQFT} sq/ft applied` : null, shaded: true },
                                    { label: 'Unit Price', value: `${php(price.unitPrice)} / sq/ft`, sub: null, shaded: false },
                                    { label: 'Per Panel', value: php(price.subTotalPerPanel), sub: `${php(price.unitPrice)} × ${price.chargeableSqFt.toFixed(3)}`, shaded: true },
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
                                </p>
                            </div>
                        ) : null}
                    </div>

                    {/* CTA */}
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

                    {/* Value props */}
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

                    {/* Specs — mobile only */}
                    {specRows.length > 0 && (
                        <div className="lg:hidden py-7">
                            <SectionLabel>Technical Specifications</SectionLabel>
                            <div className="grid grid-cols-1 divide-y divide-border border-y border-border">
                                {([
                                    ...specRows,
                                    { label: 'Unit Price', value: `${php(product.unitPrice)} / sq·ft` },
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
                    )}
                </div>
            </div>
        </>
    );
};

export default ShopProductDetailsView;