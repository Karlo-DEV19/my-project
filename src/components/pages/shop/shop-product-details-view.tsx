'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
    Ruler, ShieldCheck, Wrench, Scissors, ChevronDown, Info,
    MapPin, Phone, Mail, ShoppingCart,
} from 'lucide-react';
import { BlindProduct } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

/** cm × cm → sq/ft conversion factor from the xlsx template */
const CM_TO_SQFT = 10.76;
/** Minimum chargeable sq/ft per panel — from xlsx: =IF(sqFt<=10, 10, sqFt) */
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

// ─── Pricing engine ───────────────────────────────────────────────────────────
// Mirrors the QUOTATION TEMPLATE xlsx formulas exactly:
//   F  = W_cm / 100                      (width in metres)
//   I  = H_cm / 100                      (height in metres)
//   K  = F × I × 10.76                   (sq/ft area)
//   L  = IF(K <= 10, 10, K)              (minimum 10 sq/ft per panel)
//   Q  = UNIT_PRICE × L                  (sub-total per panel)
//   R  = Q × totalPanels                 (grand total)

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

// ─── Component ────────────────────────────────────────────────────────────────

interface Props { product: BlindProduct }

const ShopProductDetailsView = ({ product }: Props) => {
    const [activeImage, setActiveImage] = useState(product.imageUrls[0]);
    const [selectedColor, setSelectedColor] = useState(product.availableColors[0]);
    const [selectedPreset, setSelectedPreset] = useState<typeof STANDARD_SIZES[0] | null>(null);
    const [widthCm, setWidthCm] = useState<string>('');
    const [heightCm, setHeightCm] = useState<string>('');
    const [panels, setPanels] = useState(1);
    const [mountingType, setMountingType] = useState(MOUNTING_OPTIONS[0]);
    const [controlSide, setControlSide] = useState(CONTROL_OPTIONS[0]);
    const [controlType, setControlType] = useState(CONTROL_TYPE_OPTIONS[0]);
    const [notes, setNotes] = useState('');
    const [branch, setBranch] = useState(BRANCHES[0]);

    const isReady = !!widthCm && !!heightCm && Number(widthCm) > 0 && Number(heightCm) > 0;

    // Live price — recalculates on every dimension / panel / product change
    const price = useMemo<PriceBreakdown | null>(() => {
        const w = Number(widthCm);
        const h = Number(heightCm);
        if (!w || !h || w <= 0 || h <= 0) return null;
        return calcPrice(w, h, product.pricePerSqFt, panels);
    }, [widthCm, heightCm, panels, product.pricePerSqFt]);

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
            productId: product.id, productName: product.name, productCode: product.code,
            selectedColor: selectedColor.name,
            widthCm: Number(widthCm), heightCm: Number(heightCm),
            panels, mountingType, controlSide, controlType, notes,
            branch: branch.id, priceBreakdown: price,
        };
        console.log('ADD TO CART:', payload);
        // TODO: dispatch to cart store
    };

    // Reusable select field
    const SelectField = ({ label, value, options, onChange }: {
        label: string; value: string; options: string[]; onChange: (v: string) => void;
    }) => (
        <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</label>
            <div className="relative">
                <select value={value} onChange={e => onChange(e.target.value)}
                    className="h-11 w-full border border-border bg-transparent px-4 pr-8 text-sm text-foreground appearance-none focus:outline-none focus:border-foreground transition-colors cursor-pointer">
                    {options.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

            {/* ── LEFT: Image gallery ────────────────────────────────────── */}
            <div className="flex flex-col gap-4 sticky top-24">
                <div className="relative aspect-[4/5] w-full bg-muted border border-border overflow-hidden group">
                    {activeImage ? (
                        <Image src={activeImage} alt={product.name} fill priority
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 font-serif text-sm bg-accent/20">
                            Image Unavailable
                        </div>
                    )}
                </div>
                {product.imageUrls.length > 1 && (
                    <div className="grid grid-cols-4 gap-4">
                        {product.imageUrls.map((url, idx) => (
                            <button key={idx} onClick={() => setActiveImage(url)}
                                className={`relative aspect-square border overflow-hidden transition-all ${activeImage === url
                                    ? 'border-foreground opacity-100' : 'border-border opacity-60 hover:opacity-100'}`}>
                                <Image src={url} alt={`${product.name} view ${idx + 1}`} fill className="object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── RIGHT: Info & config ───────────────────────────────────── */}
            <div className="flex flex-col">

                {/* 1 · Header */}
                <div className="flex flex-col items-start gap-3 border-b border-border pb-8">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                        {product.type} • {product.code}
                    </span>
                    <h1 className="font-serif text-4xl md:text-5xl tracking-wide text-foreground">{product.name}</h1>
                    <div className="w-12 h-px bg-border my-2" />
                    <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                </div>

                {/* 2 · Branch */}
                <div className="py-8 border-b border-border">
                    <h3 className="text-xs uppercase tracking-widest font-medium text-foreground mb-4">Branch</h3>
                    {BRANCHES.map(b => {
                        const active = branch.id === b.id;
                        return (
                            <button key={b.id} onClick={() => setBranch(b)}
                                className={`w-full flex flex-col gap-1.5 p-4 border text-left transition-all duration-200 ${active
                                    ? 'border-foreground bg-foreground/[0.03]' : 'border-border hover:border-foreground/40'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">{b.name}</span>
                                    {active && <span className="text-[9px] uppercase tracking-widest bg-foreground text-background px-2 py-0.5 font-semibold">Selected</span>}
                                </div>
                                <span className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={1.5} />{b.address}
                                </span>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" strokeWidth={1.5} />{b.phone} / {b.mobile}</span>
                                    <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" strokeWidth={1.5} />{b.email}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* 3 · Color */}
                <div className="py-8 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs uppercase tracking-widest font-medium text-foreground">Select Fabric Color</h3>
                        <span className="text-xs text-muted-foreground font-medium">{selectedColor.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {product.availableColors.map((color, idx) => {
                            const sel = selectedColor.name === color.name;
                            return (
                                <button key={idx} onClick={() => setSelectedColor(color)} className="flex flex-col items-center gap-2 group outline-none">
                                    <div className={`p-1 border rounded-full transition-all duration-300 ${sel ? 'border-foreground' : 'border-transparent group-hover:border-border'}`}>
                                        <div className="relative w-10 h-10 rounded-full border border-border/50 shadow-sm overflow-hidden">
                                            <Image src={color.image} alt={color.name} fill sizes="40px" className="object-cover" />
                                        </div>
                                    </div>
                                    <span className={`text-[10px] uppercase tracking-widest transition-colors ${sel ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>{color.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 4 · Size */}
                <div className="py-8 border-b border-border">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xs uppercase tracking-widest font-medium text-foreground">
                            Select Size <span className="text-muted-foreground">(cm)</span>
                        </h3>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Info className="w-3 h-3" strokeWidth={1.5} />Width × Height
                        </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-5">Choose a standard size or enter your exact measurements below.</p>

                    <div className="grid grid-cols-2 gap-2 mb-6">
                        {STANDARD_SIZES.map(preset => {
                            const active = selectedPreset?.label === preset.label;
                            return (
                                <button key={preset.label} onClick={() => handlePresetSelect(preset)}
                                    className={`relative flex items-center justify-between px-4 py-3 border text-left transition-all duration-200 ${active
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'border-border hover:border-foreground/40 bg-transparent text-foreground'}`}>
                                    <span className="text-sm font-medium tracking-wide">{preset.label} cm</span>
                                    {preset.popular && (
                                        <span className={`text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 ${active ? 'bg-background/20 text-background' : 'bg-accent text-muted-foreground'}`}>
                                            Popular
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {([
                            { field: 'w' as const, label: 'Width (cm)', val: widthCm, max: Number(product.fabricWidth) || 280, hint: `Max: ${product.fabricWidth}`, ph: 'e.g. 120' },
                            { field: 'h' as const, label: 'Height (cm)', val: heightCm, max: 3000, hint: 'Standard drop up to 300cm', ph: 'e.g. 200' },
                        ]).map(({ field, label, val, max, hint, ph }) => (
                            <div key={field} className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</label>
                                <input type="number" min={20} max={max} placeholder={ph} value={val}
                                    onChange={e => handleDimChange(field, e.target.value)}
                                    className="h-11 border border-border bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors" />
                                <span className="text-[10px] text-muted-foreground">{hint}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5 · Configuration */}
                <div className="py-8 border-b border-border">
                    <h3 className="text-xs uppercase tracking-widest font-medium text-foreground mb-5">Configuration</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Panels counter */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Panels</label>
                            <div className="flex items-center border border-border h-11">
                                <button onClick={() => setPanels(p => Math.max(1, p - 1))} className="w-11 h-full flex items-center justify-center text-foreground hover:bg-accent transition-colors text-lg font-light">−</button>
                                <span className="flex-1 text-center text-sm font-medium text-foreground">{panels}</span>
                                <button onClick={() => setPanels(p => p + 1)} className="w-11 h-full flex items-center justify-center text-foreground hover:bg-accent transition-colors text-lg font-light">+</button>
                            </div>
                        </div>
                        <SelectField label="Mounting Type" value={mountingType} options={MOUNTING_OPTIONS} onChange={setMountingType} />
                        <SelectField label="Control Side" value={controlSide} options={CONTROL_OPTIONS} onChange={setControlSide} />
                        <SelectField label="Control Type" value={controlType} options={CONTROL_TYPE_OPTIONS} onChange={setControlType} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Special Notes (optional)</label>
                        <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="e.g. arched window, specific bracket type, delivery instructions…"
                            className="border border-border bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors resize-none" />
                    </div>
                </div>

                {/* 6 · ── LIVE PRICE CALCULATOR ── */}
                <div className="py-8 border-b border-border">
                    <h3 className="text-xs uppercase tracking-widest font-medium text-foreground mb-5">Price Estimate</h3>

                    {!isReady ? (
                        <div className="flex items-center gap-3 px-4 py-5 border border-dashed border-border bg-accent/20">
                            <Info className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                            <p className="text-xs text-muted-foreground">Enter width and height above to see your instant price estimate.</p>
                        </div>
                    ) : price ? (
                        <div className="border border-border overflow-hidden">
                            {/* Breakdown rows */}
                            {([
                                { label: 'Dimensions', value: `${price.widthCm} × ${price.heightCm} cm`, sub: null, shaded: true },
                                { label: 'Area (sq/ft)', value: `${price.sqFt.toFixed(3)} sq/ft`, sub: '(W÷100) × (H÷100) × 10.76', shaded: false },
                                { label: 'Chargeable sq/ft', value: `${price.chargeableSqFt.toFixed(3)} sq/ft`, sub: price.minimumApplied ? `Min. ${MIN_SQFT} sq/ft applied` : null, shaded: true },
                                { label: 'Unit Price', value: `${php(price.unitPrice)} / sq/ft`, sub: null, shaded: false },
                                { label: 'Sub Total (per panel)', value: php(price.subTotalPerPanel), sub: `${php(price.unitPrice)} × ${price.chargeableSqFt.toFixed(3)}`, shaded: true },
                                { label: 'Panels', value: `× ${price.panels}`, sub: null, shaded: false },
                            ] as { label: string; value: string; sub: string | null; shaded: boolean }[]).map(({ label, value, sub, shaded }) => (
                                <div key={label} className={`grid grid-cols-2 px-4 py-3 ${shaded ? 'bg-accent/20' : ''}`}>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
                                        {sub && <span className="text-[10px] text-muted-foreground/60">{sub}</span>}
                                    </div>
                                    <span className="text-sm text-right font-medium text-foreground self-center">{value}</span>
                                </div>
                            ))}

                            {/* Grand total */}
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

                {/* 7 · Add to Cart */}
                <div className="flex flex-col gap-3 py-8 border-b border-border">
                    {!isReady && <p className="text-[11px] text-muted-foreground text-center pb-1">Please select a size to continue.</p>}
                    <button onClick={handleAddToCart} disabled={!isReady}
                        className="flex items-center justify-center gap-3 h-14 w-full bg-foreground text-background uppercase tracking-widest text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        <ShoppingCart className="w-4 h-4" strokeWidth={1.5} />Add to Cart
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 h-10 w-full border border-border/60 bg-transparent text-muted-foreground uppercase tracking-widest text-[10px] font-medium hover:text-foreground hover:border-border transition-colors">
                            <Scissors className="w-3.5 h-3.5" strokeWidth={1.5} />Request Sample
                        </button>
                        <button className="flex items-center justify-center gap-2 h-10 w-full border border-border/60 bg-transparent text-muted-foreground uppercase tracking-widest text-[10px] font-medium hover:text-foreground hover:border-border transition-colors">
                            <Ruler className="w-3.5 h-3.5" strokeWidth={1.5} />Measure Guide
                        </button>
                    </div>
                </div>

                {/* 8 · Value props */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 border-b border-border">
                    {([
                        { Icon: Ruler, title: 'Custom Made', sub: 'Tailored to exact size' },
                        { Icon: Wrench, title: 'Installation', sub: 'Expert fitting available' },
                        { Icon: ShieldCheck, title: '1 Year Warranty', sub: 'Factory defects covered' },
                    ] as const).map(({ Icon, title, sub }) => (
                        <div key={title} className="flex flex-col items-center text-center gap-2">
                            <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                            <span className="text-[10px] uppercase tracking-widest font-medium text-foreground">{title}</span>
                            <span className="text-xs text-muted-foreground">{sub}</span>
                        </div>
                    ))}
                </div>

                {/* 9 · Technical specs */}
                <div className="py-8">
                    <h3 className="text-xs uppercase tracking-widest font-medium text-foreground mb-6">Technical Specifications</h3>
                    <div className="grid grid-cols-1 divide-y divide-border border-y border-border">
                        {([
                            { label: 'Composition', value: product.composition },
                            { label: 'Fabric Width', value: product.fabricWidth },
                            { label: 'Thickness', value: product.thickness },
                            { label: 'Packing', value: product.packing },
                            { label: 'Unit Price', value: `${php(product.pricePerSqFt)} / sq·ft` },
                            ...(product.characteristic ? [{ label: 'Characteristic', value: product.characteristic }] : []),
                        ]).map(({ label, value }) => (
                            <div key={label} className="grid grid-cols-3 py-4 gap-4 items-start hover:bg-accent/30 transition-colors px-2">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{label}</span>
                                <span className="col-span-2 text-sm text-foreground font-medium leading-relaxed">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ShopProductDetailsView;