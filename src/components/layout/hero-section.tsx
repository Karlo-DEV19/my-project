'use client';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowRight, Home, Info, Phone, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { BlindsReveal } from './blinds-reveal';

const HeroSection = () => {
    const navItems = [
        { label: 'Home', href: '#', icon: Home },
        { label: 'Shop', href: '#shop', icon: ShoppingBag },
        { label: 'About', href: '#about', icon: Info },
        { label: 'Contact', href: '#contact', icon: Phone },
    ];

    const scrollToContent = () => {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    };

    return (
        <section className="relative min-h-[700px] h-[100dvh] w-full flex flex-col overflow-hidden bg-background">

            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/hero-blinds.png"
                    alt="Premium Korean Window Blinds"
                    fill
                    priority
                    className="object-cover grayscale-[20%] brightness-[0.85]"
                />
                <div className="absolute inset-0 bg-background/80 lg:bg-background/90" />
            </div>

            {/* Main Content Area - Split Layout */}
            <div className="relative z-10 flex-1 flex items-center w-full pt-20 lg:pt-0">
                <div className="container mx-auto px-6 max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-20 h-full py-8 lg:py-0">

                    {/* Left Column: Typography & CTA */}
                    <div className="w-full lg:w-[45%] flex flex-col justify-center relative z-20 text-center lg:text-left mt-8 lg:mt-0">
                        <div className="inline-flex items-center justify-center lg:justify-start gap-3 mb-6 lg:mb-8">
                            <div className="w-8 lg:w-10 h-[1px] bg-primary"></div>
                            <span className="text-[10px] lg:text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground">Premium Quality</span>
                            <div className="w-8 h-[1px] bg-primary lg:hidden"></div>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif text-foreground leading-[1.1] mb-6 drop-shadow-sm">
                            Mastering <br />
                            <span className="italic text-primary">Light & Space.</span>
                        </h1>

                        <p className="text-base lg:text-lg text-muted-foreground leading-relaxed mb-10 max-w-md mx-auto lg:mx-0 bg-background/50 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none p-4 lg:p-0 rounded-xl lg:rounded-none border border-border/50 lg:border-none">
                            Experience the finest Korean window blinds. Elevate your interior with our signature combi shades, combining elegant design with precise light control.
                        </p>

                        <div className="flex flex-col sm:flex-row shadow-xl w-full sm:w-fit mx-auto lg:mx-0">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto rounded-none bg-foreground text-background hover:bg-foreground/90 h-14 px-8 text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em]"
                            >
                                View Collection
                                <ArrowRight className="w-4 h-4 ml-3" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full sm:w-auto rounded-none bg-background text-foreground border-border hover:bg-muted h-14 px-8 text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em]"
                            >
                                Get a Quote
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Blinds Reveal Component */}
                    <div className="w-full lg:w-[55%] h-[350px] sm:h-[450px] lg:h-[75vh] relative z-10 lg:pt-0 mt-8 lg:mt-0">
                        <BlindsReveal />
                    </div>

                </div>
            </div>
        </section>
    );
};
export default HeroSection;