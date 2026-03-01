import React from 'react';
import Image from 'next/image';
import { ImageIcon, ShoppingCart } from 'lucide-react';

export const blindsProducts = [
    {
        id: "CB-43",
        name: "Cherry Blossom",
        code: "CB 43",
        type: "Combi Shades",
        composition: "Polyester 100%",
        fabricWidth: "250cm",
        packing: "50m/Roll",
        thickness: "0.3mm",
        characteristic: "With flower design",
        availableColors: ["Red", "Green", "Blue", "Other"],
        imageUrls: [
            "/images/blinds/cherry-blossom-1.jpg",
            "/images/blinds/cherry-blossom-2.jpg",
            "/images/blinds/cherry-blossom-3.jpg"
        ]
    },
    {
        id: "C-101",
        name: "CUBE",
        code: "C 101 - C 105",
        type: "Combi Shades",
        composition: "Polyester 100%",
        fabricWidth: "280cm",
        packing: "50m/Roll",
        thickness: "0.54mm",
        characteristic: "",
        availableColors: ["Beige", "Brown", "Choco", "Violet", "Wine"],
        imageUrls: [
            "/images/blinds/cube-1.jpg",
            "/images/blinds/cube-2.jpg",
            "/images/blinds/cube-3.jpg"
        ]
    },
    {
        id: "LN-201",
        name: "Linen Touch",
        code: "LN 201",
        type: "Combi Shades",
        composition: "Polyester 100%",
        fabricWidth: "300cm",
        packing: "50m/Roll",
        thickness: "0.45mm",
        characteristic: "Soft woven texture",
        availableColors: ["White", "Light Gray", "Cream", "Sand"],
        imageUrls: [
            "/images/blinds/linen-touch-1.jpg",
            "/images/blinds/linen-touch-2.jpg"
        ]
    },
    {
        id: "MD-301",
        name: "Modern Stripe",
        code: "MD 301",
        type: "Combi Shades",
        composition: "Polyester 100%",
        fabricWidth: "280cm",
        packing: "50m/Roll",
        thickness: "0.4mm",
        characteristic: "Horizontal stripe design",
        availableColors: ["Gray", "Black", "Beige", "Brown"],
        imageUrls: [
            "/images/blinds/modern-stripe-1.jpg",
            "/images/blinds/modern-stripe-2.jpg",
            "/images/blinds/modern-stripe-3.jpg"
        ]
    }
];

const BestSeller = () => {
    return (
        <section className="py-24 bg-background text-foreground font-sans">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">

                {/* Header */}
                <div className="flex flex-col items-center justify-center text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif tracking-wide mb-4">
                        Best Sellers
                    </h2>
                    <div className="w-16 h-[1px] bg-foreground/20 mb-6"></div>
                </div>

                {/* Product Grid - 4 Columns exactly like the reference image */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                    {blindsProducts.map((product) => (
                        <div key={product.id} className="group flex flex-col items-center text-center">

                            {/* Main Image */}
                            <div className="relative w-full aspect-[4/5] mb-6 overflow-hidden bg-muted">
                                {product.imageUrls[0] ? (
                                    <Image
                                        src={product.imageUrls[0]}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                        <ImageIcon className="w-8 h-8 opacity-50" />
                                    </div>
                                )}
                            </div>

                            {/* Title & Code */}
                            <h3 className="text-xl font-serif tracking-wide text-foreground mb-1">
                                {product.name}
                            </h3>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">
                                {product.code}
                            </p>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 max-w-[250px]">
                                {product.type} • {product.composition}
                                {product.characteristic && ` • ${product.characteristic}`}
                            </p>

                            {/* Thumbnails */}
                            {product.imageUrls.length > 0 && (
                                <div className="flex items-center justify-center gap-2 mb-6">
                                    {product.imageUrls.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="relative w-10 h-10 border border-border/50 hover:border-foreground transition-colors duration-200 cursor-pointer overflow-hidden"
                                        >
                                            <Image
                                                src={img}
                                                alt={`${product.name} thumbnail ${idx + 1}`}
                                                fill
                                                sizes="40px"
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add to Cart Button */}
                            <button className="mt-auto flex items-center justify-center gap-2 w-full max-w-[200px] px-6 py-2.5 border border-foreground text-foreground text-sm font-medium tracking-wide uppercase hover:bg-foreground hover:text-background transition-all duration-300">
                                <ShoppingCart className="w-4 h-4" />
                                Add to Cart
                            </button>

                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BestSeller;