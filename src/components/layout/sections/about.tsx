import React from "react";

const AboutSection = () => {
    return (
        <section id="about" className="py-24 bg-background text-foreground font-sans">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col items-center justify-center text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-serif tracking-wide mb-3">
                        ABOUT US
                    </h2>
                    <div className="w-16 h-[1px] bg-foreground/20 mb-4" />
                    <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
                        MJ Decor 888 provides high-quality blinds and window solutions
                        tailored for modern homes and commercial spaces. We combine
                        durability, aesthetics, and smart installation systems to ensure
                        long-lasting performance.
                    </p>
                </div>

                {/* Short highlight strip */}
                <div className="mb-14 flex flex-wrap items-center justify-center gap-4 text-xs md:text-sm text-muted-foreground">
                    <span className="px-4 py-1.5 rounded-full bg-muted">
                        8+ years installing blinds in homes and condos
                    </span>
                    <span className="px-4 py-1.5 rounded-full bg-muted">
                        Professional on-site measurement & fitting
                    </span>
                    <span className="px-4 py-1.5 rounded-full bg-muted">
                        Friendly support from inquiry to after-sales
                    </span>
                </div>

                {/* Content grid like ecommerce feature section */}
                <div className="grid grid-cols-1 md:grid-cols-[1.3fr,1fr] gap-10 md:gap-14 items-start">
                    {/* Left: brand story */}
                    <div>
                        <h3 className="text-2xl md:text-3xl font-serif tracking-wide mb-4">
                            Crafted for everyday living, not just for show.
                        </h3>
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
                            We built MJ Decor888 to make premium window treatments more
                            accessible, transparent, and convenient. From quick consultations
                            to meticulous installations, our process is designed so you can
                            upgrade your space without stress.
                        </p>
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8">
                            Every blind we install is measured to fit, chosen to match your
                            light and privacy needs, and installed by a team that treats your
                            home with respect—similar to how modern ecommerce brands obsess
                            over a seamless customer journey.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <span className="px-4 py-2 text-xs md:text-sm border border-border rounded-full tracking-[0.18em] uppercase text-muted-foreground">
                                Korean Combi Blinds
                            </span>
                            <span className="px-4 py-2 text-xs md:text-sm border border-border rounded-full tracking-[0.18em] uppercase text-muted-foreground">
                                Roller & Blackout
                            </span>
                            <span className="px-4 py-2 text-xs md:text-sm border border-border rounded-full tracking-[0.18em] uppercase text-muted-foreground">
                                Condo-Friendly Solutions
                            </span>
                        </div>
                    </div>

                    {/* Right: plain text */}
                    <div>
                        <h4 className="text-base md:text-lg font-semibold mb-3">
                            Our commitment to you
                        </h4>
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                            From the first message you send us to the day your blinds are
                            installed, we focus on clear communication, honest timelines, and
                            a clean finish. Our goal is simple: make it easy for you to choose
                            the right blinds and feel confident every step of the way.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;