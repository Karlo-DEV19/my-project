import React from 'react';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { blindsProducts } from '@/lib/utils';
import Link from 'next/link';

const BestSeller = () => {
    // Only display the first 4 products as best sellers
    const bestSellers = blindsProducts.slice(0, 4);

    return (
        <section className="py-24 bg-background text-foreground font-sans border-t border-border/40">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">

                {/* Header */}
                <div className="flex flex-col items-center justify-center text-center mb-16">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
                        Our Collection
                    </span>
                    <h2 className="text-3xl md:text-5xl font-serif tracking-wide text-foreground mb-6">
                        Best Sellers
                    </h2>
                    <div className="w-12 h-px bg-foreground/30"></div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {bestSellers.map((product) => (
                        <div key={product.id} className="group flex flex-col h-full bg-card transition-all duration-500 rounded-none outline-none focus-visible:ring-1 focus-visible:ring-primary border border-transparent hover:border-border/60">

                            {/* Main Image Container */}
                            <Link href={`/shop/${product.id}`} className="relative w-full aspect-[4/5] mb-6 overflow-hidden bg-muted block">
                                {product.imageUrls && product.imageUrls.length > 0 ? (
                                    <Image
                                        src={product.imageUrls[0]}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-105"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 font-serif text-sm bg-accent/20">
                                        Image Unavailable
                                    </div>
                                )}

                                {/* Quick View Overlay */}
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background/90 via-background/60 to-transparent opacity-0 translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 flex justify-center">
                                    <span className="bg-foreground text-background px-6 py-2.5 text-[10px] uppercase tracking-widest font-medium shadow-lg w-full text-center">
                                        View Details
                                    </span>
                                </div>
                            </Link>

                            {/* Product Info */}
                            <div className="flex flex-col flex-grow text-center items-center px-4 pb-6">
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
                                    {product.code}
                                </span>
                                <h3 className="text-lg font-serif tracking-wide text-foreground mb-2 group-hover:text-primary transition-colors">
                                    <Link href={`/shop/${product.id}`}>
                                        {product.name}
                                    </Link>
                                </h3>

                                <p className="text-xs text-muted-foreground line-clamp-2 max-w-[250px] leading-relaxed mb-6">
                                    {product.description || `${product.type} • ${product.composition}`}
                                </p>

                                {/* Swatches & Cart Button Wrapper */}
                                <div className="mt-auto flex flex-col items-center w-full gap-5">

                                    {/* Color Swatches as Images */}
                                    <div className="flex items-center justify-center gap-2">
                                        {product.availableColors.slice(0, 4).map((color, idx) => (
                                            <div
                                                key={idx}
                                                title={color.name}
                                                className="relative w-7 h-7 rounded-full border border-border/80 shadow-sm transition-transform hover:-translate-y-1 overflow-hidden ring-1 ring-background cursor-pointer"
                                            >
                                                <Image
                                                    src={color.image}
                                                    alt={color.name}
                                                    fill
                                                    sizes="28px"
                                                    className="object-cover"
                                                />
                                            </div>
                                        ))}
                                        {product.availableColors.length > 4 && (
                                            <span className="text-[10px] text-muted-foreground font-medium ml-1">
                                                +{product.availableColors.length - 4}
                                            </span>
                                        )}
                                    </div>

                                    {/* Add to Cart Button */}
                                    <button className="flex items-center justify-center gap-2 w-full max-w-[200px] px-6 py-3 bg-transparent border border-foreground text-foreground text-[10px] font-medium tracking-widest uppercase hover:bg-foreground hover:text-background transition-colors duration-300">
                                        <ShoppingCart className="w-3.5 h-3.5" />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* View All Button */}
                <div className="mt-16 text-center">
                    <Link href="/shop" className="inline-block px-10 py-3.5 border border-foreground text-foreground text-[10px] font-medium tracking-widest uppercase hover:bg-foreground hover:text-background transition-colors duration-300">
                        View All Products
                    </Link>
                </div>

            </div>
        </section>
    );
};

export default BestSeller;