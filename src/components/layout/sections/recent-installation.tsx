"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";

const installations = [
  {
    id: 1,
    title: "Modern Condo Living Room",
    location: "Quezon City",
    blinds: "Zebra Combi Blinds",
    image: "/recent installion pic/condo.png",
  },
  {
    id: 2,
    title: "Warm Neutral Bedroom",
    location: "Makati",
    blinds: "Blackout Roller Blinds",
    image: "/recent installion pic/bedroom.png",
  },
  {
    id: 3,
    title: "Clean Home Office",
    location: "Pasig",
    blinds: "Combi Blinds",
    image: "/recent installion pic/office.png",
  },
  {
    id: 4,
    title: "Minimal Dining Area",
    location: "Taguig",
    blinds: "Sheer Combi Blinds",
    image: "/recent installion pic/dinning.png",
  },
  {
    id: 5,
    title: "Bright Corner Window",
    location: "Marikina",
    blinds: "Light-filtering Roller",
    image: "/recent installion pic/corner.png",
  },
  {
    id: 6,
    title: "Cozy Studio Setup",
    location: "Manila",
    blinds: "Fabric-look Combi",
    image: "/recent installion pic/studio.png",
  },
];

type Installation = (typeof installations)[0];

// ─── Swipe Hook ───────────────────────────────────────────────────────────────
function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const delta = touchStartX.current - touchEndX.current;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      delta > 0 ? onSwipeLeft() : onSwipeRight();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}

// ─── Arrow Button ─────────────────────────────────────────────────────────────
function ArrowButton({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={direction === "left" ? "Previous" : "Next"}
      className={`
        absolute top-1/2 -translate-y-1/2 z-20
        ${direction === "left" ? "left-3 md:left-5" : "right-3 md:right-5"}
        w-9 h-9 md:w-11 md:h-11
        flex items-center justify-center
        rounded-full border border-white/50 bg-black/60 backdrop-blur-md
        text-white hover:bg-white/20 hover:border-white/60
        transition-all duration-300 group
      `}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 ${direction === "left"
            ? "group-hover:-translate-x-0.5"
            : "group-hover:translate-x-0.5"
          }`}
      >
        {direction === "left" ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        )}
      </svg>
    </button>
  );
}

// ─── Dot Indicators ───────────────────────────────────────────────────────────
function DotIndicators({
  total,
  current,
  onSelect,
}: {
  total: number;
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mt-5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          aria-label={`Go to slide ${i + 1}`}
          className={`rounded-full transition-all duration-300 ${i === current
              ? "w-6 h-[3px] bg-foreground"
              : "w-[3px] h-[3px] bg-foreground/30 hover:bg-foreground/60"
            }`}
        />
      ))}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function InstallationModal({
  item,
  onClose,
  onNext,
  onPrev,
  currentIndex,
  total,
}: {
  item: Installation;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  total: number;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  useEffect(() => {
    setZoomed(false);
    setScale(1);
  }, [currentIndex]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNext, onPrev]);

  const swipe = useSwipe(onNext, onPrev);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomed) {
      setZoomed(false);
      setScale(1);
    } else {
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setOrigin({ x, y });
      setScale(2.2);
      setZoomed(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm px-3 py-4 md:px-6 md:py-6"
      style={{ paddingTop: "72px" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#111111] rounded-xl overflow-hidden shadow-2xl flex flex-col"
        style={{ maxHeight: "calc(100vh - 90px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div>
            <p className="text-[9px] tracking-[0.3em] uppercase text-white/30 mb-0.5">
              {currentIndex + 1} / {total}
            </p>
            <h2
              className="text-sm md:text-base text-white font-serif leading-tight"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              {item.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="ml-4 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white/60 hover:text-white transition-all duration-200"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row overflow-hidden flex-1 min-h-0">

          {/* Image */}
          <div
            className="relative flex-1 bg-black overflow-hidden"
            style={{ minHeight: "200px" }}
            {...swipe}
          >
            <div
              className={`relative w-full h-full ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: `${origin.x}% ${origin.y}%`,
                transition: "transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
              }}
              onClick={handleImageClick}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 60vw, 768px"
                className="object-cover select-none"
                draggable={false}
                priority
              />
            </div>

            {!zoomed && (
              <>
                <ArrowButton direction="left" onClick={onPrev} />
                <ArrowButton direction="right" onClick={onNext} />
              </>
            )}

            {!zoomed && (
              <div className="absolute top-3 left-3 text-[9px] tracking-[0.2em] uppercase text-white/30 pointer-events-none select-none bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
                Click to zoom
              </div>
            )}
          </div>

          {/* Details sidebar */}
          <div className="w-full md:w-56 lg:w-64 flex-shrink-0 flex flex-col justify-center px-5 py-5 md:py-6 bg-[#0f0f0f] border-t border-white/10 md:border-t-0 md:border-l md:border-white/10 overflow-y-auto">
            <p className="text-[9px] tracking-[0.3em] uppercase text-white/80 mb-4 font-medium">
              Installation Details
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-[9px] tracking-[0.25em] uppercase text-white/25 mb-1">Location</p>
                <p className="text-sm text-white/90">{item.location}</p>
              </div>
              <div className="w-full h-px bg-white/8" />
              <div>
                <p className="text-[9px] tracking-[0.25em] uppercase text-white/25 mb-1">Blinds Type</p>
                <p className="text-sm text-white/90">{item.blinds}</p>
              </div>
              <div className="w-full h-px bg-white/8" />
              <div>
                <p className="text-[9px] tracking-[0.25em] uppercase text-white/25 mb-1">Details</p>
                <p className="text-xs text-white/90 leading-relaxed">
                  Premium blinds, customised for optimal light control and refined aesthetic appeal — tailored for modern living.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${i === currentIndex
                      ? "w-5 h-[2px] bg-white/60"
                      : "w-[2px] h-[2px] bg-white/20"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const RecentInstallation = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [animating, setAnimating] = useState(false);

  const total = installations.length;

  const goTo = useCallback(
    (next: number, dir: "left" | "right") => {
      if (animating) return;
      setDirection(dir);
      setAnimating(true);
      setTimeout(() => {
        setCurrentIndex((next + total) % total);
        setAnimating(false);
      }, 380);
    },
    [animating, total]
  );

  const goNext = useCallback(() => goTo(currentIndex + 1, "right"), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1, "left"), [currentIndex, goTo]);

  const swipe = useSwipe(goNext, goPrev);
  const item = installations[currentIndex];

  useEffect(() => {
    if (modalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, modalOpen]);

  return (
    <>
      <section className="py-24 bg-background text-foreground font-sans overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-12">
            <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-4 font-medium">
              Portfolio
            </p>
            <h2
              className="text-3xl md:text-5xl tracking-wide mb-4"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              Recent Installations
            </h2>
            <div className="w-12 h-px bg-foreground/20 mb-5" />
            <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
              A glimpse of how MJ Decor888 blinds look installed in real homes and spaces.
            </p>
          </div>

          {/* Slider */}
          <div className="relative select-none" {...swipe}>

            <div
              className="relative w-full overflow-hidden rounded-xl bg-muted cursor-pointer"
              style={{ aspectRatio: "16/9" }}
              onClick={() => setModalOpen(true)}
            >
              <div
                key={currentIndex}
                className="absolute inset-0"
                style={{
                  opacity: animating ? 0 : 1,
                  transform: animating
                    ? `translateX(${direction === "right" ? "-3%" : "3%"})`
                    : "translateX(0)",
                  transition: "opacity 0.38s ease, transform 0.38s ease",
                }}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 896px"
                  className="object-cover"
                  priority
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

              <div className="absolute inset-x-0 bottom-0 px-6 md:px-8 py-6 md:py-8 pointer-events-none">
                <p className="text-[9px] tracking-[0.35em] uppercase text-white/50 mb-1.5 font-medium">
                  {item.location}&nbsp;·&nbsp;{item.blinds}
                </p>
                <h3
                  className="text-xl md:text-3xl text-white"
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                  {item.title}
                </h3>
              </div>

              <div className="absolute top-5 right-5 pointer-events-none">
                <div className="flex items-center gap-1.5 bg-blue-500 backdrop-blur-sm border border-blue-500 rounded-full px-3 py-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3 text-white/60">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                  <span className="text-[9px] tracking-[0.2em] uppercase text-white/50">Expand</span>
                </div>
              </div>

              <div className="absolute top-5 left-6 pointer-events-none">
                <span className="text-[10px] tracking-[0.3em] text-white/40 font-light">
                  {String(currentIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </span>
              </div>

              <ArrowButton direction="left" onClick={goPrev} />
              <ArrowButton direction="right" onClick={goNext} />
            </div>

            <DotIndicators
              total={total}
              current={currentIndex}
              onSelect={(i) => goTo(i, i > currentIndex ? "right" : "left")}
            />

            <div className="flex gap-2 md:gap-3 mt-5 overflow-x-auto pb-1 scrollbar-none">
              {installations.map((inst, i) => (
                <button
                  key={inst.id}
                  onClick={() => goTo(i, i > currentIndex ? "right" : "left")}
                  aria-label={`View ${inst.title}`}
                  className={`relative flex-shrink-0 rounded-md overflow-hidden transition-all duration-300 ${i === currentIndex
                      ? "ring-2 ring-foreground/70 opacity-100"
                      : "opacity-40 hover:opacity-70"
                    }`}
                  style={{ width: 64, height: 44 }}
                >
                  <Image
                    src={inst.image}
                    alt={inst.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {modalOpen && (
        <InstallationModal
          item={installations[currentIndex]}
          currentIndex={currentIndex}
          total={total}
          onClose={() => setModalOpen(false)}
          onNext={goNext}
          onPrev={goPrev}
        />
      )}
    </>
  );
};

export default RecentInstallation;