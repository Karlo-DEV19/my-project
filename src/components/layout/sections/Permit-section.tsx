"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

//testing lang

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
    description: "Certified for excellence and compliance.",
    image: "/permit/permit3.png",
  },
];

export default function PermitSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (isZoomed) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % permits.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [isZoomed]);

  const next = () =>
    setCurrentIndex((prev) => (prev + 1) % permits.length);

  const prev = () =>
    setCurrentIndex((prev) =>
      prev === 0 ? permits.length - 1 : prev - 1
    );

  const item = permits[currentIndex];

  return (
    <>
      <section className="py-28 bg-background">
        <div className="container mx-auto max-w-5xl px-4">

          {/* 🔥 PREMIUM HEADER */}
          <div className="text-center mb-16">

            <p className="text-xs md:text-sm tracking-[0.4em] uppercase text-muted-foreground mb-4">
              Permits & Certifications
            </p>

            <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight leading-tight">
              Legally Registered & Certified
            </h2>

            <p className="mt-6 text-muted-foreground max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
              We operate with full legal compliance, ensuring every project is backed
              by verified permits and trusted standards.
            </p>

          </div>

          {/* 🔥 HERO CARD */}
          <div
            onClick={() => setIsZoomed(true)}
            className="relative w-full cursor-zoom-in overflow-hidden rounded-xl"
            style={{ aspectRatio: "16/9" }}
          >
            {/* IMAGE */}
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
              className="object-cover"
              priority
            />

            {/* GRADIENT */}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            {/* TEXT BOTTOM LEFT */}
            <div className="absolute bottom-6 left-6 z-10 text-white max-w-md">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/60">
                Official Document
              </p>

              <h3 className="text-xl md:text-2xl font-semibold mt-1">
                {item.title}
              </h3>

              {item.description && (
                <p className="text-sm text-white/80 mt-1">
                  {item.description}
                </p>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* 🔥 MODAL */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">

          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-6 right-6 text-white text-3xl"
          >
            ✕
          </button>

          <button
            onClick={prev}
            className="absolute left-4 text-white text-4xl px-3"
          >
            ‹
          </button>

          <button
            onClick={next}
            className="absolute right-4 text-white text-4xl px-3"
          >
            ›
          </button>

          <div className="relative w-[90%] h-[85%] overflow-auto">
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={item.image}
                alt={item.title}
                className="max-w-full max-h-full object-contain hover:scale-150 transition duration-300"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}