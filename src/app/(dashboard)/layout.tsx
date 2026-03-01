// components/layouts/DashboardLayout.tsx
'use client';

import Footer from '@/components/layout/footer';
import Header from '@/components/layout/header';
import React, { Suspense, useState, useEffect } from 'react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const [showHeader, setShowHeader] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show header after scrolling past the hero section (e.g., 100vh)
            const scrollThreshold = window.innerHeight * 0.8; // 80% of viewport height
            setShowHeader(window.scrollY > scrollThreshold);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="relative min-h-screen min-h-[100dvh] bg-background text-foreground antialiased">
            {/* Sticky Header - appears on scroll */}
            <Header isVisible={showHeader} />

            {/* Main Content Area */}
            <main
                className="flex-1 flex flex-col w-full"
                role="main"
                aria-label="Main content"
            >
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center min-h-screen">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-muted-foreground text-sm">Loading...</span>
                            </div>
                        </div>
                    }
                >
                    {children}
                </Suspense>
            </main>

            <Footer />
        </div>
    );
};

export default DashboardLayout;