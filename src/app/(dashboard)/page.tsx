'use client';
// app/page.tsx
import HeroSection from '@/components/layout/hero-section';
import AboutSection from '@/components/layout/sections/about';
import BestSeller from '@/components/layout/sections/best-seller';
import ChatSection from '@/components/layout/sections/chat-section';
import NewArrival from '@/components/layout/sections/new-arrival';
import OurCustomerSays from '@/components/layout/sections/our-customer-says';
import OurSystemWorks from '@/components/layout/sections/our-system-works';
import RecentInstallation from '@/components/layout/sections/recent-installation';
import WelcomeSection from '@/components/layout/sections/welcome-section';

const HomePage = () => {
    return (
        <div className="flex flex-col w-full">

            {/* 1. HERO SECTION */}
            {/* No margin-bottom here because the Hero handles its own height (100dvh) */}
            <div className="relative z-10">
                <HeroSection />
            </div>

            {/* 2. SPACING CONNECTOR */}
            {/* This creates a visual break. You can adjust 'h-24' or 'h-32' for more/less space. */}
            <div className="w-full h-24 md:h-32" />

            {/* 3. WELCOME SECTION */}
            {/* We add a subtle fade-in or just structural padding to ensure it breathes */}
            <div className="relative z-20 ">
                <WelcomeSection />
            </div>

            {/* OPTIONAL: Divider Line between sections if you want a sharp boundary */}
            {/* <div className="w-full max-w-5xl mx-auto h-px bg-zinc-100 my-12" /> */}
            <BestSeller />

            {/* 4. RECENT INSTALLATIONS */}
            <RecentInstallation />

            {/* 5. NEW ARRIVALS */}
            <NewArrival />

            {/* 6. ABOUT SECTION */}
            <AboutSection />

            {/* 7. CUSTOMER STORIES */}
            <OurCustomerSays />

            {/* 8. HOW OUR SYSTEM WORKS */}
            <OurSystemWorks />

            {/* 9. CHAT SECTION */}
            <ChatSection />
        </div>
    );
};

export default HomePage;