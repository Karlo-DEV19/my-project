'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

const testimonials = [
    {
        id: 1,
        name: "Sarah Jenkins",
        role: "Homeowner",
        text: "The Korean combi blinds from MJ Decor completely transformed our living room. The quality is outstanding, and the light control is exactly what we needed. Highly recommend their premium collection!",
        rating: 5,
        initials: "SJ"
    },
    {
        id: 2,
        name: "Michael Chen",
        role: "Interior Designer",
        text: "As a designer, I'm extremely particular about window treatments. I've sourced from many suppliers, but the craftsmanship and fabric quality from MJ Decor 888 consistently exceed my expectations. My clients are always thrilled.",
        rating: 5,
        initials: "MC"
    },
    {
        id: 3,
        name: "Elena Rodriguez",
        role: "Local Business Owner",
        text: "We installed their Zebra shades in our new office space. Not only do they look incredibly sleek and modern, but the installation process was seamless. The team was professional from start to finish.",
        rating: 5,
        initials: "ER"
    },
    {
        id: 4,
        name: "David Thompson",
        role: "Property Manager",
        text: "Durable, cost-effective, and aesthetically pleasing. We've started outfitting all our new rental units with blinds from MJ Decor. The return on investment in the 'feel' of the apartments is amazing.",
        rating: 4,
        initials: "DT"
    }
];

const OurCustomerSays = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
    const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

    const onInit = useCallback((emblaApi: any) => {
        setScrollSnaps(emblaApi.scrollSnapList());
    }, []);

    const onSelect = useCallback((emblaApi: any) => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, []);

    useEffect(() => {
        if (!emblaApi) return;
        onInit(emblaApi);
        onSelect(emblaApi);
        emblaApi.on('reInit', onInit);
        emblaApi.on('reInit', onSelect);
        emblaApi.on('select', onSelect);
    }, [emblaApi, onInit, onSelect]);

    useEffect(() => {
        if (!emblaApi) return;
        const interval = setInterval(() => {
            emblaApi.scrollNext();
        }, 5000);
        return () => clearInterval(interval);
    }, [emblaApi]);

    return (
        <section className="py-24 bg-background text-foreground font-sans relative overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">

                {/* Header - Aligned with BestSeller */}
                <div className="flex flex-col items-center justify-center text-center mb-16 relative">
                    <h2 className="text-3xl md:text-4xl font-serif tracking-wide mb-4">
                        Our Customer Says
                    </h2>
                    <div className="w-16 h-px bg-foreground/20 mb-8 md:mb-0"></div>

                    {/* Custom Navigation Arrows (Desktop) - Positioned absolutely to top right for balance */}
                    <div className="hidden md:flex items-center gap-3 absolute right-0 top-0">
                        <button
                            onClick={scrollPrev}
                            className="w-10 h-10 flex items-center justify-center border border-foreground/20 text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-300"
                            aria-label="Previous testimonial"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={scrollNext}
                            className="w-10 h-10 flex items-center justify-center border border-foreground/20 text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-300"
                            aria-label="Next testimonial"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Carousel Area */}
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex -ml-4 md:-ml-8 py-4">
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-4 md:pl-8"
                            >
                                <div className="bg-muted/10 flex flex-col h-full p-8 md:p-10 border border-border/50 hover:border-foreground/20 transition-all duration-300 group rounded-none">

                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-8 w-full">
                                        <Quote className="w-8 h-8 text-foreground/20 group-hover:text-primary transition-colors duration-300" />
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3.5 h-3.5 ${i < testimonial.rating ? 'fill-foreground text-foreground' : 'text-foreground/20'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Testimonial Text */}
                                    <p className="text-muted-foreground text-sm leading-loose mb-10 flex-1 relative font-serif italic">
                                        "{testimonial.text}"
                                    </p>

                                    {/* Author Info */}
                                    <div className="flex items-center gap-4 mt-auto">
                                        <div className="w-10 h-10 bg-foreground flex items-center justify-center text-background font-serif font-bold tracking-widest text-xs shrink-0">
                                            {testimonial.initials}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-foreground tracking-wide font-medium text-sm">
                                                {testimonial.name}
                                            </span>
                                            <span className="text-muted-foreground text-[10px] uppercase tracking-widest mt-1">
                                                {testimonial.role}
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pagination Dots (Mobile & Desktop) */}
                <div className="flex items-center justify-center gap-3 mt-12">
                    {scrollSnaps.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollTo(index)}
                            className={`h-[2px] transition-all duration-300 ${index === selectedIndex
                                    ? 'w-8 bg-foreground'
                                    : 'w-4 bg-foreground/20 hover:bg-foreground/50'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>

            </div>
        </section>
    );
};

export default OurCustomerSays;