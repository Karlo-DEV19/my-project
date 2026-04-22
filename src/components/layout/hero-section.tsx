'use client';
import { BlindsReveal } from './blinds-reveal';

const HeroSection = () => {
    return (
        <section className="relative h-dvh w-full flex flex-col overflow-hidden bg-background transition-colors duration-300">
            <BlindsReveal />
        </section>
    );
};

export default HeroSection;