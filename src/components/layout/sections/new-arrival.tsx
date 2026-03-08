import React from "react";
import Image from "next/image";

const newArrivals = [
    {
        id: 1,
        name: "Nordic Sheer Combi",
        tag: "New • Combi Blinds",
        image: "/new arrival/nordic.png",
    },
    {
        id: 2,
        name: "Warm Beige Roller",
        tag: "New • Roller Blinds",
        image: "/new arrival/warm.png",
    },
    {
        id: 3,
        name: "Soft Day & Night",
        tag: "New • Zebra Blinds",
        image: "/new arrival/day and night.png",
    },
    {
        id: 4,
        name: "Studio Blackout",
        tag: "New • Blackout",
        image: "/new arrival/studio black.png",
    },
    {
        id: 5,
        name: "Linen Texture",
        tag: "New • Fabric Look",
        image: "/new arrival/linen tex.png",
    },
    {
        id: 6,
        name: "Modern Stripe Shade",
        tag: "New • Patterned",
        image: "/new arrival/stripe.png",
    },
];

const NewArrival = () => {
    return (
        <section className="py-24 bg-background text-foreground font-sans">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col items-center justify-center text-center mb-14">
                    <h2 className="text-3xl md:text-4xl font-serif tracking-wide mb-3">
                        New Arrivals
                    </h2>
                    <div className="w-16 h-[1px] bg-foreground/20 mb-4" />
                    <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
                        Fresh blinds just added to the MJ Decor888 collection—perfect for
                        modern interiors looking for a subtle upgrade.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {newArrivals.map((item) => (
                        <article
                            key={item.id}
                            className="group border border-border/60 bg-card text-card-foreground overflow-hidden flex flex-col"
                        >
                            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                />
                            </div>
                            <div className="px-5 py-5 md:px-6 md:py-6 flex flex-col gap-2">
                                <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground">
                                    {item.tag}
                                </p>
                                <h3 className="text-base md:text-lg font-serif tracking-wide">
                                    {item.name}
                                </h3>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NewArrival;