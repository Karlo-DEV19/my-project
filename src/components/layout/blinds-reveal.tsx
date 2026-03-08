'use client';
import React, { useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import Image from 'next/image';

export const BlindsReveal = () => {
  const [isHovered, setIsHovered] = useState(false);
  const slatsCount = 14;
  const slats = Array.from({ length: slatsCount });

  return (
    <div
      className="relative w-full h-full min-h-[400px] cursor-pointer overflow-hidden rounded-lg shadow-2xl group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Underlying Reveal Image */}
      <div className="absolute inset-0 z-0 bg-muted">
        <Image
          src="/images/hero-blinds.png"
          alt="Premium Blinds Display"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={`object-cover transition-transform duration-[1500ms] ease-out ${isHovered ? 'scale-105' : 'scale-100'}`}
        />
        {/* Dark overlay for text contrast */}
        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-1000 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* 2. Hidden Content (Appears on Hover) */}
      <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center transition-all duration-700 delay-200 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
          <Star className="w-3.5 h-3.5 fill-primary text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">Experience Innovation</span>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-5xl font-serif text-white mb-6 leading-tight drop-shadow-lg">
          A New Vision <br />
          <span className="text-white/90 italic font-light text-3xl md:text-4xl">for your space.</span>
        </h2>
      </div>

      {/* 3. The 3D Blinds Slats */}
      <div
        className="absolute inset-0 z-20 flex flex-col pointer-events-none"
        style={{ perspective: '1200px' }}
      >
        {slats.map((_, i) => (
          <div
            key={i}
            className="w-full flex-1 bg-background border-b border-border shadow-[0_4px_6px_rgba(0,0,0,0.05)] origin-top transition-transform duration-[800ms] ease-out"
            style={{
              transitionDelay: `${i * 35}ms`,
              transform: isHovered ? 'rotateX(-85deg)' : 'rotateX(0deg)',
            }}
          >
            {/* Slat surface gradient map to give 3D cylinder feel */}
            <div className="w-full h-full bg-gradient-to-b from-foreground/5 to-transparent"></div>
          </div>
        ))}
      </div>

      {/* 4. Closed State Overlay / Instructions */}
      <div className={`absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-700 pointer-events-none ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
        <div className="bg-background/80 backdrop-blur-md px-10 py-8 border border-border shadow-2xl text-center flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-primary text-foreground flex items-center justify-center font-bold text-2xl mb-4">
            M
          </div>
          <h1 className="text-foreground text-xl font-serif tracking-[0.2em] uppercase">Open To Reveal</h1>
          <p className="text-primary text-[10px] uppercase tracking-[0.3em] mt-3 animate-pulse font-bold">Hover Over Me</p>
        </div>
      </div>
    </div>
  );
};