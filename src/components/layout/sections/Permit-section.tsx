"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

const permits = [
  {
    id: 1,
    title: "Business Permit",
    description: "Officially registered and authorized to operate.",
    image: "/permit/permit.png",
  },
  {
    id: 2,
    title: "Registration",
    description: "Recognized and registered business entity.",
    image: "/permit/permit1.png",
  },
  {
    id: 3,
    title: "Award & Certificate",
    description: "",
    image: "/permit/permit3.png",
  },
];

const PermitSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % permits.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const item = permits[currentIndex];

  return (
    <section className="py-24 bg-background text-foreground font-sans overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">

        {/* Header (MATCHED STYLE) */}
        <div className="flex flex-col items-center text-center mb-12">
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-4 font-medium">
            Trust & Legality
          </p>

          <h2
            className="text-3xl md:text-5xl tracking-wide mb-4"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            Licensed & Verified
          </h2>

          <div className="w-12 h-px bg-foreground/20 mb-5" />

          <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
            We operate with full legal compliance, ensuring every project is backed by verified permits and trusted standards.
          </p>
        </div>

        {/* IMAGE (MATCHED STYLE) */}
        <div className="relative w-full overflow-hidden rounded-xl bg-muted cursor-pointer"
          style={{ aspectRatio: "16/9" }}>

          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-contain p-6"
          />

          {/* Gradient overlay (same as recent installation) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Text overlay */}
          <div className="absolute inset-x-0 bottom-0 px-6 md:px-8 py-6">
            <p className="text-[9px] tracking-[0.35em] uppercase text-white/50 mb-1.5">
              Official Document
            </p>

            <h3
              className="text-xl md:text-3xl text-white"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              {item.title}
            </h3>

            <p className="text-xs md:text-sm text-white/70 mt-1">
              {item.description}
            </p>
          </div>

          {/* Counter */}
          <div className="absolute top-5 left-6">
            <span className="text-[10px] tracking-[0.3em] text-white/40">
              {String(currentIndex + 1).padStart(2, "0")} / {String(permits.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PermitSection;