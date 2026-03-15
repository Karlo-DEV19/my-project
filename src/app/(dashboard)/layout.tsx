'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/providers/auth-provider';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ScrollToTop from '@/components/ui/scroll-to-top';
import AdminSidebar from '@/components/pages/admin/admin-sidebar';
import EmployeeSidebar from '@/components/pages/admin/employee/employee-sider';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const pathname = usePathname() || '';
    const router = useRouter();

    const { isAuthenticated, user } = useAuth();
    const [showHeader, setShowHeader] = useState(false);

    const isAdminRoute = pathname.startsWith('/admin');
    const isHomeRoute = pathname === '/';

    // =======================================================================
    // ROUTE PROTECTION
    // =======================================================================
    useEffect(() => {
        if (isAdminRoute && !isAuthenticated) {
            router.push('/');
        }
    }, [isAdminRoute, isAuthenticated, router]);

    // =======================================================================
    // HEADER SCROLL LOGIC
    // =======================================================================
    useEffect(() => {
        if (isAdminRoute) return;

        if (!isHomeRoute) {
            setShowHeader(true);
            return;
        }

        const handleScroll = () => setShowHeader(window.scrollY > 17);
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pathname, isAdminRoute, isHomeRoute]);

    const LoadingFallback = () => (
        <div className="flex flex-col flex-1 items-center justify-center w-full min-h-[50vh]">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <span className="text-muted-foreground text-sm font-medium tracking-wide">
                Loading application...
            </span>
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
            {!isAdminRoute && (
                <Header isVisible={showHeader} isFixed={!isHomeRoute} />
            )}

            {isAdminRoute ? (
                // ADMIN LAYOUT
                <SidebarProvider>
                    <div className="flex h-screen w-full overflow-hidden">
                        {user?.role === 'admin' ? <AdminSidebar /> : <EmployeeSidebar />}

                        <SidebarInset className="flex-1 overflow-auto bg-background">
                            <header className="sticky top-0 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 z-40">
                                <div className="flex items-center gap-2">
                                    <SidebarTrigger className="-ml-1" />
                                    <div className="font-semibold text-sm">
                                        {user?.role === 'admin' ? 'Admin Panel' : 'Staff Panel'}
                                    </div>
                                </div>
                            </header>
                            <main className="flex-1 w-full p-6 relative" role="main">
                                <Suspense fallback={<LoadingFallback />}>
                                    {children}
                                </Suspense>
                            </main>
                        </SidebarInset>
                    </div>
                </SidebarProvider>
            ) : (
                // PUBLIC LAYOUT
                <main className="flex flex-col flex-1 w-full relative" role="main">
                    <Suspense fallback={<LoadingFallback />}>
                        {children}
                    </Suspense>
                    {/* Scroll to top button (fixed, above chat box) */}
                    <ScrollToTop />
                </main>
            )}

            {!isAdminRoute && <Footer />}
        </div>
    );
};

export default DashboardLayout;