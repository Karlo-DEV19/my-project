'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Ruler, ShieldCheck, Wrench, Calculator, Scissors } from 'lucide-react';
import { BlindProduct } from './shop-grid-products';
interface ShopProductDetailsViewProps {
    product: BlindProduct;
}

// Enhanced color mapper
const getColorHex = (colorName: string) => {
    const normalize = colorName.toLowerCase().split('/')[0].split('-')[0].trim();
    const colors: Record<string, string> = {
        red: '#7f1d1d', green: '#14532d', blue: '#1e3a8a', beige: '#f5f5dc',
        brown: '#5c4033', choco: '#3e2723', chocolate: '#3e2723', violet: '#4c1d95',
        wine: '#722f37', white: '#ffffff', 'light gray': '#d1d5db', gray: '#6b7280',
        cream: '#fef3c7', sand: '#e6dca8', sandy: '#e6dca8', black: '#000000',
        ivory: '#fffff0', peach: '#ffcdab', lime: '#a3e635', mint: '#a7f3d0',
        pine: '#064e3b', copper: '#b87333', scarlet: '#ff2400', olive: '#3f6212',
        oak: '#8b5a2b', gold: '#d4af37', navy: '#1e3a8a', bronze: '#cd7f32',
        charcoal: '#374151', mustard: '#facc15', yellow: '#fef08a'
    };
    return colors[normalize] || '#e5e5e5';
};

const ShopProductDetailsView = ({ product }: ShopProductDetailsViewProps) => {
    const [activeImage, setActiveImage] = useState(product.imageUrls[0]);
    // ✅ NEW: State to track which color the customer wants a quote for
    const [selectedColor, setSelectedColor] = useState(product.availableColors[0]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

            {/* Left Column: Image Gallery */}
            <div className="flex flex-col gap-4 sticky top-24">
                <div className="relative aspect-[4/5] w-full bg-muted border border-border overflow-hidden group">
                    {activeImage ? (
                        <Image
                            src={activeImage}
                            alt={product.name}
                            fill
                            priority
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 font-serif text-sm bg-accent/20">
                            Image Unavailable
                        </div>
                    )}
                </div>

                {/* Thumbnails */}
                {product.imageUrls.length > 1 && (
                    <div className="grid grid-cols-4 gap-4">
                        {product.imageUrls.map((url, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImage(url)}
                                className={`relative aspect-square border overflow-hidden transition-all ${activeImage === url
                                    ? 'border-foreground opacity-100'
                                    : 'border-border opacity-60 hover:opacity-100'
                                    }`}
                            >
                                <Image src={url} alt={`${product.name} view ${idx + 1}`} fill className="object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Column: Product Information & Actions */}
            <div className="flex flex-col">

                {/* 1. Header Section */}
                <div className="flex flex-col items-start gap-3 border-b border-border pb-8">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                        {product.type} • {product.code}
                    </span>
                    <h1 className="font-serif text-4xl md:text-5xl tracking-wide text-foreground">
                        {product.name}
                    </h1>
                    <div className="w-12 h-px bg-border my-2"></div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {product.description}
                    </p>
                </div>

                {/* 2. Interactive Color Selection */}
                <div className="py-8 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs uppercase tracking-widest font-medium text-foreground">
                            Select Fabric Color
                        </h3>
                        <span className="text-xs text-muted-foreground font-medium">
                            {selectedColor}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {product.availableColors.map((color, idx) => {
                            const isSelected = selectedColor === color;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedColor(color)}
                                    className="flex flex-col items-center gap-2 group outline-none"
                                >
                                    <div className={`p-1 border rounded-full transition-all duration-300 ${isSelected ? 'border-foreground' : 'border-transparent group-hover:border-border'
                                        }`}>
                                        <div
                                            className="w-8 h-8 rounded-full border border-border/50 shadow-sm"
                                            style={{ backgroundColor: getColorHex(color) }}
                                        ></div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. ✅ NEW: Call to Action (Quote & Sample) */}
                <div className="flex flex-col gap-4 py-8 border-b border-border">
                    <button className="flex items-center justify-center gap-3 h-14 w-full bg-foreground text-background uppercase tracking-widest text-xs font-medium hover:bg-foreground/90 transition-colors rounded-none">
                        <Calculator className="w-4 h-4" strokeWidth={1.5} />
                        Get a Quote for this Product
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 h-12 w-full border border-border bg-transparent text-foreground uppercase tracking-widest text-[10px] font-medium hover:bg-accent transition-colors rounded-none">
                            <Scissors className="w-3.5 h-3.5" strokeWidth={1.5} />
                            Request Sample
                        </button>
                        <button className="flex items-center justify-center gap-2 h-12 w-full border border-border bg-transparent text-foreground uppercase tracking-widest text-[10px] font-medium hover:bg-accent transition-colors rounded-none">
                            <Ruler className="w-3.5 h-3.5" strokeWidth={1.5} />
                            Measurement Guide
                        </button>
                    </div>
                </div>

                {/* 4. ✅ NEW: Premium Value Propositions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 border-b border-border">
                    <div className="flex flex-col items-center text-center gap-2">
                        <Ruler className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                        <span className="text-[10px] uppercase tracking-widest font-medium text-foreground">Custom Made</span>
                        <span className="text-xs text-muted-foreground">Tailored to exact size</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <Wrench className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                        <span className="text-[10px] uppercase tracking-widest font-medium text-foreground">Installation</span>
                        <span className="text-xs text-muted-foreground">Expert fitting available</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                        <span className="text-[10px] uppercase tracking-widest font-medium text-foreground">Warranty</span>
                        <span className="text-xs text-muted-foreground">Quality guaranteed</span>
                    </div>
                </div>

                {/* 5. Technical Data Section */}
                <div className="py-8">
                    <h3 className="text-xs uppercase tracking-widest font-medium text-foreground mb-6">
                        Technical Specifications
                    </h3>
                    <div className="grid grid-cols-1 divide-y divide-border border-y border-border">
                        <div className="grid grid-cols-3 py-4 gap-4 items-start hover:bg-accent/30 transition-colors px-2">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Composition</span>
                            <span className="col-span-2 text-sm text-foreground font-medium">{product.composition}</span>
                        </div>
                        <div className="grid grid-cols-3 py-4 gap-4 items-start hover:bg-accent/30 transition-colors px-2">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Fabric Width</span>
                            <span className="col-span-2 text-sm text-foreground font-medium">{product.fabricWidth}</span>
                        </div>
                        <div className="grid grid-cols-3 py-4 gap-4 items-start hover:bg-accent/30 transition-colors px-2">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Thickness</span>
                            <span className="col-span-2 text-sm text-foreground font-medium">{product.thickness}</span>
                        </div>
                        <div className="grid grid-cols-3 py-4 gap-4 items-start hover:bg-accent/30 transition-colors px-2">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Packing</span>
                            <span className="col-span-2 text-sm text-foreground font-medium">{product.packing}</span>
                        </div>
                        {product.characteristic && (
                            <div className="grid grid-cols-3 py-4 gap-4 items-start hover:bg-accent/30 transition-colors px-2">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Characteristic</span>
                                <span className="col-span-2 text-sm text-foreground font-medium leading-relaxed">{product.characteristic}</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ShopProductDetailsView;