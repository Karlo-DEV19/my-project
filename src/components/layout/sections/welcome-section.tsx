'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const WelcomeSection = () => {
    const [activeImage, setActiveImage] = useState<"tall" | "top" | "bottom" | null>(null);

    const features = [
        "Premium Combi Shades",
        "Custom Fit & Installation",
        "Expert Design Consultation",
        "Durable Korean Materials"
    ];

    return (
        <section className="py-24 bg-background text-foreground font-sans transition-colors duration-300">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">

                {/* Header - Aligned with BestSeller & OurCustomerSays */}
                <div className="flex flex-col items-center justify-center text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif tracking-wide mb-4">
                        Mastering Light & Space
                    </h2>
                    <div className="w-16 h-[1px] bg-foreground/20 mb-6"></div>

                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                        We believe that every window is an opportunity to elevate your environment.
                        Our curated collection of premium Korean combi blinds offers the perfect synthesis
                        of light control, privacy, and contemporary design.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                    {/* Left Column: Visual Grid */}
                    <div className="relative grid grid-cols-2 gap-4 h-[500px] lg:h-[600px] group">

                        {/* Tall Image */}
                        <div
                            className={`col-span-1 row-span-2 relative overflow-hidden bg-muted mt-8 border border-border/50 hover:border-foreground transition-colors duration-300 cursor-pointer transform duration-500 ease-out
                                ${activeImage === "tall" ? "scale-[1.04] shadow-2xl shadow-black/30" : activeImage ? "scale-[0.97] opacity-70" : "scale-100"}`}
                            onClick={() => setActiveImage(prev => prev === "tall" ? null : "tall")}
                        >
                            <Image
                                src="/welcome-section-pic/elegant.png"
                                alt="Elegant window treatment from MJ Decor"
                                fill
                                className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                            {activeImage === "tall" && (
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-4 pt-8 text-left">
                                    <p className="text-xs font-medium tracking-[0.2em] text-background/80 uppercase">
                                        Signature Look
                                    </p>
                                    <p className="text-sm text-background">
                                        Tap any photo to spotlight your favorite style.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Top Right Image */}
                        <div
                            className={`col-span-1 border border-border/50 hover:border-foreground transition-colors duration-300 relative overflow-hidden bg-muted cursor-pointer transform duration-500 ease-out
                                ${activeImage === "top" ? "scale-[1.04] shadow-xl shadow-black/25" : activeImage ? "scale-[0.97] opacity-70" : "scale-100"}`}
                            onClick={() => setActiveImage(prev => prev === "top" ? null : "top")}
                        >
                            <Image
                                src="/welcome-section-pic/close up.png"
                                alt="Modern living room with MJ Decor blinds"
                                fill
                                className="object-cover transition-transform duration-700 ease-in-out delay-100 group-hover:scale-105"
                            />
                            {activeImage === "top" && (
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/50 via-black/10 to-transparent" />
                            )}
                        </div>

                        {/* Bottom Right Image */}
                        <div
                            className={`col-span-1 relative overflow-hidden bg-muted border border-border/50 hover:border-foreground transition-colors duration-300 cursor-pointer transform duration-500 ease-out
                                ${activeImage === "bottom" ? "scale-[1.04] shadow-xl shadow-black/25" : activeImage ? "scale-[0.97] opacity-70" : "scale-100"}`}
                            onClick={() => setActiveImage(prev => prev === "bottom" ? null : "bottom")}
                        >
                            <Image
                                src="/welcome-section-pic/modern.png"
                                alt="Close-up of premium combi blinds texture"
                                fill
                                className="object-cover transition-transform duration-700 ease-in-out delay-200 group-hover:scale-105"
                            />
                            {activeImage === "bottom" && (
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/45 via-transparent to-transparent" />
                            )}
                        </div>
                    </div>

                    {/* Right Column: Content & Features */}
                    <div className="flex flex-col justify-center">
                        <h3 className="text-2xl font-serif tracking-wide text-foreground mb-6">
                            Crafted for the Modern Home
                        </h3>

                        <p className="text-muted-foreground leading-relaxed mb-10">
                            From the initial selection to seamless installation, our dedicated team ensures
                            your vision comes to life. We source only the finest fabrics and materials,
                            guaranteeing durability without compromising on style.
                        </p>

                        {/* Feature List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 mb-12">
                            {features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="shrink-0 w-6 h-6 flex items-center justify-center text-foreground">
                                        <CheckCircle2 className="w-5 h-5 opacity-70" strokeWidth={1.5} />
                                    </div>
                                    <span className="text-sm font-medium text-foreground tracking-wide">
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div>
                            <Link
                                href="/shop"
                                className="flex items-center justify-center gap-2 px-8 py-3.5 border border-foreground text-foreground text-sm font-medium tracking-wide uppercase hover:bg-foreground hover:text-background transition-all duration-300 w-max"
                            >
                                Explore Collection
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default WelcomeSection;