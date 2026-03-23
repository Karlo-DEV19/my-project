"use client";

import React, { useState } from "react";
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

const RecentInstallation = () => {
    const [selectedInstallation, setSelectedInstallation] = useState<
        typeof installations[0] | null
    >(null);

    const openModal = (item: typeof installations[0]) => {
        setSelectedInstallation(item);
    };

    const closeModal = () => {
        setSelectedInstallation(null);
    };

    return (
        <section className="py-24 bg-background text-foreground font-sans">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col items-center justify-center text-center mb-14">
                    <h2 className="text-3xl md:text-4xl font-serif tracking-wide mb-3">
                        Recent Installations
                    </h2>
                    <div className="w-16 h-[1px] bg-foreground/20 mb-4" />
                    <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
                        A glimpse of how MJ Decor888 blinds look installed in real homes and
                        spaces.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {installations.map((item) => (
                        <article
                            key={item.id}
                            onClick={() => openModal(item)}
                            className="group relative overflow-hidden border border-border/60 bg-card text-card-foreground cursor-pointer"
                        >
                            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                            </div>

                            <div className="absolute inset-x-0 bottom-0 px-4 md:px-5 py-4 md:py-5 text-left">
                                <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-gray-300 mb-1">
                                    {item.location} • {item.blinds}
                                </p>
                                <h3 className="text-base md:text-lg font-serif tracking-wide text-white">
                                    {item.title}
                                </h3>
                            </div>
                        </article>
                    ))}
                </div>
            </div>

           {/* Modal */}
{selectedInstallation && (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 md:p-8"
        onClick={closeModal}
    >
        <div
            className="bg-white rounded-xl max-w-4xl w-full p-6 relative shadow-xl"
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
            >
                ✕
            </button>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                    <Image
                        src={selectedInstallation.image}
                        alt={selectedInstallation.title}
                        width={800}
                        height={600}
                        className="rounded-md object-cover w-full h-full"
                    />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                    <h2 className="text-2xl md:text-3xl font-serif mb-4">
                        {selectedInstallation.title}
                    </h2>
                    <p className="text-gray-700 mb-2">
                        <strong>Location:</strong> {selectedInstallation.location}
                    </p>
                    <p className="text-gray-700 mb-2">
                        <strong>Blinds Type:</strong> {selectedInstallation.blinds}
                    </p>
                    <p className="text-gray-700">
                        <strong>Details:</strong> This installation features premium blinds customized to the space for optimal light control and aesthetic appeal. Perfect for modern living.
                    </p>
                </div>
            </div>
        </div>
    </div>
)}
        </section>
    );
};

export default RecentInstallation;