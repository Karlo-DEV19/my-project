'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const BlindsReveal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // For full height, we can use more slats to ensure smooth 3D effect.
  const slatsCount = 20;
  const slats = Array.from({ length: slatsCount });

  const handleMouseEnter = () => {
    if (!isOpen) {
      hoverTimerRef.current = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    setIsOpen(false);
  };

  const handleClick = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsOpen(!isOpen);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return (
    <div
      className="relative w-full h-[100dvh] cursor-pointer overflow-hidden group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* 1. Underlying Reveal Image */}
      <div className="absolute inset-0 z-0 bg-muted">
        <Image
          src="/images/hero-blinds.png"
          alt="Premium Blinds Display"
          fill
          priority
          sizes="100vw"
          className={`object-cover transition-transform duration-[2000ms] ease-out ${isOpen ? 'scale-105' : 'scale-100'}`}
        />
        {/* Dark overlay for text contrast */}
        <div className={`absolute inset-0 bg-black/50 transition-opacity duration-1000 ${isOpen ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* 2. Hidden Content (Appears when Open) */}
      <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center transition-all duration-1000 delay-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
        <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
          <Star className="w-3.5 h-3.5 fill-primary text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">Experience Innovation</span>
        </div>

        <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-6 leading-tight drop-shadow-2xl">
          MJ Decors <br />
          <span className="text-white/90 italic font-light text-3xl md:text-5xl lg:text-6xl">Mastering Light & Space.</span>
        </h2>

        <p className="text-white/80 max-w-2xl mx-auto mb-10 text-sm md:text-base leading-relaxed">
          Experience the finest Korean window blinds. Elevate your interior with our signature combi shades, combining elegant design with precise light control.
        </p>

        <Link href="/shop" onClick={(e) => e.stopPropagation()}>
          <button className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/90 transition-colors rounded-none">
            View More Blinds
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>

      {/* 3. The 3D Blinds Slats */}
      <div
        className="absolute inset-0 z-20 flex flex-col pointer-events-none"
        style={{ perspective: '1200px' }}
      >
        {slats.map((_, i) => (
          <div
            key={i}
            className="w-full flex-1 bg-background border-b border-border shadow-[0_4px_6px_rgba(0,0,0,0.05)] origin-top transition-transform duration-[1200ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{
              transitionDelay: isOpen ? `${i * 35}ms` : `${(slatsCount - i) * 20}ms`,
              transform: isOpen ? 'rotateX(-85deg)' : 'rotateX(0deg)',
            }}
          >
            {/* Slat surface gradient map to give 3D cylinder feel */}
            <div className="w-full h-full bg-gradient-to-b from-foreground/5 to-transparent"></div>
          </div>
        ))}
      </div>

      {/* 4. Closed State Overlay / Instructions */}
      <div className={`absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-700 pointer-events-none ${isOpen ? 'opacity-0' : 'opacity-100'}`}>
        <div className="bg-background/80 backdrop-blur-md px-12 py-10 border border-border shadow-2xl text-center flex flex-col items-center">
          <div className="w-16 h-16 border-2 border-primary text-foreground flex items-center justify-center font-bold text-3xl mb-6">
            M
          </div>
          <h1 className="text-foreground text-2xl font-serif tracking-[0.2em] uppercase">MJ Decors</h1>
          <p className="text-primary text-xs uppercase tracking-[0.3em] mt-4 animate-pulse font-bold">Hover for 2s or Click to Reveal</p>
        </div>
      </div>
    </div>
  );
};