'use client';

import { useState } from 'react';
import HeroSection from '@/components/layout/hero-section';
import AboutSection from '@/components/layout/sections/about';
import BestSeller from '@/components/layout/sections/best-seller';
import ChatSection from '@/components/layout/sections/chat-section';
import NewArrival from '@/components/layout/sections/new-arrival';
import OurCustomerSays from '@/components/layout/sections/our-customer-says';
import OurSystemWorks from '@/components/layout/sections/our-system-works';
import RecentInstallation from '@/components/layout/sections/recent-installation';
import WelcomeSection from '@/components/layout/sections/welcome-section';
import { useGetAllBestSeller, useGetAllNewArrival } from '../api/hooks/use-product-blinds';

// Adjust the path to where your hooks actually live
const HomePage = () => {
    // Separate states so paginating one doesn't paginate the other
    const [bestSellerPage, setBestSellerPage] = useState(1);
    const [newArrivalPage, setNewArrivalPage] = useState(1);
    const limit = 4;

    // Fetch Best Sellers
    const {
        blinds: bestSellers,
        pagination: bsPagination,
        isLoading: bsLoading
    } = useGetAllBestSeller({
        page: bestSellerPage,
        limit,
        keepPreviousData: true
    });

    // Fetch New Arrivals
    const {
        blinds: newArrivals,
        pagination: naPagination,
        isLoading: naLoading
    } = useGetAllNewArrival({
        page: newArrivalPage,
        limit,
        keepPreviousData: true
    });

    console.log("new arrivals", newArrivals)

    return (
        <div className="flex flex-col w-full">
            {/* 1. HERO SECTION */}
            <div className="relative z-10">
                <HeroSection />
            </div>

            {/* 2. SPACING CONNECTOR */}
            <div className="w-full h-24 md:h-32" />

            {/* 3. WELCOME SECTION */}
            <div className="relative z-20">
                <WelcomeSection />
            </div>

            {/* 4. BEST SELLER SECTION */}
            <BestSeller
                products={bestSellers}
                pagination={bsPagination}
                isLoading={bsLoading}
                onPageChange={setBestSellerPage}
            />

            {/* 5. RECENT INSTALLATIONS */}
            <RecentInstallation />

            {/* 6. NEW ARRIVALS */}
            <NewArrival
                products={newArrivals}
                pagination={naPagination}
                isLoading={naLoading}
                onPageChange={setNewArrivalPage}
            />

            {/* 7. ABOUT SECTION */}
            <AboutSection />

            {/* 8. CUSTOMER STORIES */}
            <OurCustomerSays />

            {/* 9. HOW OUR SYSTEM WORKS */}
            <OurSystemWorks />

            {/* 10. CHAT SECTION */}
            <ChatSection />
        </div>
    );
};

export default HomePage;