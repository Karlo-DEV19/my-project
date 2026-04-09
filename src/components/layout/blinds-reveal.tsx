'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const BlindsReveal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Vertical slats count
  const slatsCount = 16;
  const slats = Array.from({ length: slatsCount });

  const handleMouseEnter = () => {
    if (!isOpen) {
      hoverTimerRef.current = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsOpen(false);
  };

  const handleClick = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return (
    <div
      className="relative w-full h-[100dvh] cursor-pointer overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* 1. Background Image */}
      <div className="absolute inset-0 z-0 bg-muted">
        <Image
          src="/images/hero-blinds.png"
          alt="Premium Blinds Display"
          fill
          priority
          sizes="100vw"
          className={`object-cover transition-transform duration-[2000ms] ease-out ${
            isOpen ? 'scale-105' : 'scale-100'
          }`}
        />
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-1000 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* 2. Reveal Content — only pointer-events active when fully open */}
      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center transition-all duration-700 ${
          isOpen
            ? 'opacity-100 translate-y-0 delay-500'
            : 'opacity-0 translate-y-8 pointer-events-none delay-0'
        }`}
      >
        <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
          <Star className="w-3.5 h-3.5 fill-primary text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">
            Experience Innovation
          </span>
        </div>

        <p className="text-white/80 max-w-2xl mx-auto mb-10 text-sm md:text-base leading-relaxed">
          Experience the finest Korean window blinds. Elevate your interior with our signature
          combi shades, combining elegant design with precise light control.
        </p>

        <Link href="/shop" onClick={(e) => e.stopPropagation()}>
          <button className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/90 transition-colors rounded-none">
            View More Blinds
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>

      {/* 3. Vertical Blinds Slats */}
      <div
        className="absolute inset-0 z-20 flex flex-row pointer-events-none"
        style={{ perspective: '1200px' }}
      >
        {slats.map((_, i) => (
          <div
            key={i}
            className="h-full flex-1 bg-background border-r border-border origin-left transition-transform"
            style={{
              transitionDuration: '900ms',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: isOpen
                ? `${i * 40}ms`
                : `${(slatsCount - 1 - i) * 25}ms`,
              transform: isOpen ? 'rotateY(-85deg)' : 'rotateY(0deg)',
            }}
          >
            <div className="w-full h-full bg-gradient-to-r from-foreground/5 to-transparent" />
          </div>
        ))}
      </div>

      {/* 4. Closed State Overlay */}
      <div
        className={`absolute inset-0 z-30 flex items-center justify-center pointer-events-none transition-opacity ${
          isOpen ? 'opacity-0 duration-300' : 'opacity-100 duration-700 delay-300'
        }`}
      >
        <div className="bg-background/80 backdrop-blur-md px-12 py-10 border border-border shadow-2xl text-center flex flex-col items-center">
          <div className="w-16 h-16 border-2 border-primary flex items-center justify-center mb-6 overflow-hidden">
            <img
              src="/logo pic/logo.png"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-foreground text-2xl font-serif tracking-[0.2em] uppercase">
            MJ Decors 888
          </h1>
          <p className="text-primary text-xs uppercase tracking-[0.3em] mt-4 animate-pulse font-bold">
            Hover for 2s or Click to Reveal
          </p>
        </div>
      </div>
    </div>
  );
};