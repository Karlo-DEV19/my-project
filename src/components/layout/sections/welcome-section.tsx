'use client';
import React from 'react';
import Image from 'next/image';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const WelcomeSection = () => {
    const features = [
        "Premium Combi Shades",
        "Custom Fit & Installation",
        "Expert Design Consultation",
        "Durable Korean Materials"
    ];

    return (
        <section className="py-24 bg-background text-foreground font-sans">
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
                        <div className="col-span-1 row-span-2 relative overflow-hidden bg-muted mt-8 border border-border/50 hover:border-foreground transition-colors duration-300">
                            <Image
                                src="/images/welcome/blinds-detail-1.jpg"
                                alt="Close up of combi blinds texture"
                                fill
                                className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                        </div>

                        {/* Top Right Image */}
                        <div className="col-span-1 border border-border/50 hover:border-foreground transition-colors duration-300 relative overflow-hidden bg-muted">
                            <Image
                                src="/images/welcome/blinds-room-1.jpg"
                                alt="Modern living room with Korean blinds"
                                fill
                                className="object-cover transition-transform duration-700 ease-in-out delay-100 group-hover:scale-105"
                            />
                        </div>

                        {/* Bottom Right Image */}
                        <div className="col-span-1 relative overflow-hidden bg-muted border border-border/50 hover:border-foreground transition-colors duration-300">
                            <Image
                                src="/images/welcome/blinds-room-2.jpg"
                                alt="Elegant bedroom window treatment"
                                fill
                                className="object-cover transition-transform duration-700 ease-in-out delay-200 group-hover:scale-105"
                            />
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
                            <button className="flex items-center justify-center gap-2 px-8 py-3.5 border border-foreground text-foreground text-sm font-medium tracking-wide uppercase hover:bg-foreground hover:text-background transition-all duration-300 w-max">
                                Explore Collection
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default WelcomeSection;