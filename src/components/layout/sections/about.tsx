import React from "react";

const AboutSection = () => {
    return (
        <section id="about" className="py-24 md:py-28 bg-background text-foreground font-sans">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-12 md:mb-16">
                    <p className="text-xs md:text-sm tracking-[0.25em] uppercase text-muted-foreground mb-3">
                        About MJ Decor 888
                    </p>
                    <h2 className="text-3xl md:text-4xl font-serif tracking-wide mb-4">
                        Direct manufacturer & blinds specialist
                        </h2>
                    <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
                        A trusted Korean brand of blinds and textiles, now serving homes and businesses across the
                        Philippines with premium window solutions.
                    </p>
                </div>

                {/* Content grid */}
                <div className="grid grid-cols-1 md:grid-cols-[1.1fr,1.3fr] gap-10 md:gap-14 items-start">
                    {/* Left: key highlights */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-muted/40 border border-border/60 rounded-xl px-4 py-4">
                                <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                                    Origin
                                </p>
                                <p className="text-sm font-medium">
                                    Direct manufacturing company and wholesale blinds brand from South Korea.
                                </p>
                            </div>
                            <div className="bg-muted/40 border border-border/60 rounded-xl px-4 py-4">
                                <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                                    Experience
                                </p>
                                <p className="text-sm font-medium">
                                    Over 20 years of quality blinds and textile expertise trusted in Korea.
                                </p>
                            </div>
                            <div className="bg-muted/40 border border-border/60 rounded-xl px-4 py-4">
                                <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                                    Philippine factory
                                </p>
                                <p className="text-sm font-medium">
                                    Factory in full operation since 2013, located in Cubao, Quezon City.
                                </p>
                            </div>
                            <div className="bg-muted/40 border border-border/60 rounded-xl px-4 py-4">
                                <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                                    Promise
                                </p>
                                <p className="text-sm font-medium">
                                    Competitive pricing, strong design, and consistent product quality for every order.
                                </p>
                            </div>
                        </div>
                        
                    </div>

                    {/* Right: full story text */}
                    <div>
                        <div className="bg-muted/30 border border-border rounded-2xl p-6 md:p-8 space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                            <p>
                                MJ Decor 888 Inc. is a direct manufacturing company and a wholesaler brand of blinds
                                from South Korea which is now here in the Philippines. Your one-stop customized
                                lifestyle designer that makes your space elegant and helps make your dreams come true.
                                Our creative designs attract people around the world with unforgettable concepts.
                            </p>
                            <p>
                                MJ Decor 888 is now making history in the Philippines to serve and feel you better. The
                                most trusted and leading quality brand of blinds and textile in Korea for more than 20
                                years. For global vision expansion, we created our own unique designs and textile
                                fabrics in Korea and have now extended our factory here in Manila, Philippines, which
                                has been in full operation since 2013, located in Cubao, Quezon City.
                            </p>
                            <p>
                                We assure you of our competitiveness among other brands in this field, in terms of
                                prices, design, and product quality, and we invite you to enjoy our discounts for every
                                order you may have.
                            </p>
                            <p>
                                We assure that our brand MJ Decor 888 will give you satisfaction in all respects. We
                                have been supplying our products to many customers across the Philippines and continue
                                to grow with every home and space we help transform.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;