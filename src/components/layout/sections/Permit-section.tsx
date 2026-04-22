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

export default function PermitSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // AUTO SLIDE (pause pag zoom)
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
      <section className="py-24 bg-background text-foreground">
        <div className="container mx-auto max-w-5xl px-4">

          {/* IMAGE */}
          <div
            onClick={() => setIsZoomed(true)}
            className="relative w-full cursor-zoom-in overflow-hidden rounded-xl bg-muted"
            style={{ aspectRatio: "16/9" }}
          >
            <Image
              src={item.image}
              alt=""
              fill
              className="object-contain p-6 hover:scale-105 transition duration-500"
            />
          </div>
        </div>
      </section>

      {/* 🔥 FULL VIEW MODAL */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">

          {/* CLOSE */}
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-6 right-6 text-white text-2xl"
          >
            ✕
          </button>

          {/* LEFT */}
          <button
            onClick={prev}
            className="absolute left-4 text-white text-3xl px-3"
          >
            ‹
          </button>

          {/* RIGHT */}
          <button
            onClick={next}
            className="absolute right-4 text-white text-3xl px-3"
          >
            ›
          </button>

          {/* IMAGE */}
          <div className="relative w-[90%] h-[85%] overflow-auto">

            {/* 👉 REAL ZOOM USING CSS SCALE */}
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={item.image}
                className="max-w-full max-h-full object-contain cursor-zoom-in hover:scale-150 transition duration-300"
              />
            </div>

          </div>
        </div>
      )}
    </>
  );
}