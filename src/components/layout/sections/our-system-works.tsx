import React from "react";
import { CalendarRange, Ruler, Palette, Wrench } from "lucide-react";

const steps = [
    {
        id: 1,
        label: "Step 01",
        title: "Schedule Measurement",
        icon: CalendarRange,
        description:
            "Send us your window sizes or book a site visit for precise on‑site measurement.",
    },
    {
        id: 2,
        label: "Step 02",
        title: "Design & Selection",
        icon: Palette,
        description:
            "Choose from our curated Korean combi, roller, and zebra blinds to match your space.",
    },
    {
        id: 3,
        label: "Step 03",
        title: "Custom Fabrication",
        icon: Ruler,
        description:
            "We cut and assemble your blinds to exact specifications using durable premium materials.",
    },
    {
        id: 4,
        label: "Step 04",
        title: "Professional Installation",
        icon: Wrench,
        description:
            "Our team installs your blinds cleanly and securely—ready to master light & privacy.",
    },
];

const OurSystemWorks = () => {
    return (
        <section className="py-24 bg-background text-foreground font-sans">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif tracking-wide mb-4">
                        Our System Works
                    </h2>
                    <div className="w-16 h-[1px] bg-foreground/20 mb-6" />
                    <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                        A simple, guided process from first measurement to final installation—
                        designed to make upgrading your blinds effortless.
                    </p>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className="relative flex flex-col h-full border border-border/60 bg-card text-card-foreground px-6 py-8 md:px-7 md:py-9 overflow-hidden group"
                        >
                            {/* Number badge */}
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground">
                                    {step.label}
                                </span>
                                <div className="w-10 h-10 flex items-center justify-center border border-border/70 group-hover:border-primary transition-colors duration-300">
                                    <step.icon className="w-5 h-5 text-foreground" />
                                </div>
                            </div>

                            <h3 className="text-lg font-serif tracking-wide mb-3">
                                {step.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                                {step.description}
                            </p>

                            {/* Divider line / accent */}
                            <div className="mt-6 h-[1px] w-10 bg-foreground/30 group-hover:w-16 group-hover:bg-primary transition-all duration-300" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default OurSystemWorks;