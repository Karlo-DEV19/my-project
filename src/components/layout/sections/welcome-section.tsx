'use client';
import React from 'react';
import Image from 'next/image';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WelcomeSection = () => {
    const features = [
        "Premium Combi Shades",
        "Custom Fit & Installation",
        "Expert Design Consultation",
        "Durable Korean Materials"
    ];

    return (
        <section className="py-24 text-foreground font-sans relative overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">

                {/* Header - Aligned with BestSeller & OurCustomerSays */}
                <div className="flex flex-col items-center justify-center text-center mb-16 relative">
                    <h2 className="text-3xl md:text-4xl font-serif tracking-wide mb-4">
                        Mastering Light & Space
                    </h2>
                    <div className="w-16 h-[1px] bg-foreground/20 mb-8"></div>

                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                        We believe that every window is an opportunity to elevate your environment.
                        Our curated collection of premium Korean combi blinds offers the perfect synthesis
                        of light control, privacy, and contemporary design.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                    {/* Left Column: Visual Grid */}
                    <div className="relative grid grid-cols-2 gap-4 h-[500px] lg:h-[600px] group">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-primary/5 rounded-full blur-[100px] -z-10" />

                        {/* Tall Image */}
                        <div className="col-span-1 row-span-2 relative rounded-2xl overflow-hidden shadow-sm mt-8">
                            <Image
                                src="/images/welcome/blinds-detail-1.jpg"
                                alt="Close up of combi blinds texture"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                        </div>

                        {/* Top Right Image */}
                        <div className="col-span-1 border border-border/50 relative rounded-2xl overflow-hidden shadow-sm bg-muted/20">
                            <Image
                                src="/images/welcome/blinds-room-1.jpg"
                                alt="Modern living room with Korean blinds"
                                fill
                                className="object-cover transition-transform duration-700 delay-100 group-hover:scale-105"
                            />
                        </div>

                        {/* Bottom Right Image */}
                        <div className="col-span-1 relative rounded-2xl overflow-hidden shadow-sm">
                            <Image
                                src="/images/welcome/blinds-room-2.jpg"
                                alt="Elegant bedroom window treatment"
                                fill
                                className="object-cover transition-transform duration-700 delay-200 group-hover:scale-105"
                            />
                        </div>
                    </div>

                    {/* Right Column: Content & Features */}
                    <div className="flex flex-col justify-center">
                        <h3 className="text-2xl font-serif text-foreground mb-6">
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
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground tracking-wide">
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div>
                            <Button
                                size="lg"
                                className="rounded-none bg-foreground text-background hover:bg-foreground/90 h-14 px-8 text-xs font-bold uppercase tracking-[0.2em]"
                            >
                                Explore Collection
                                <ArrowRight className="w-4 h-4 ml-3" />
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default WelcomeSection;