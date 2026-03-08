"use client"
import { Toaster } from '@/components/ui/sonner';
import {
    QueryClient,
    QueryClientProvider,
    DefaultOptions
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

// Separate query configuration for better maintainability
const queryConfig: DefaultOptions = {
    queries: {
        // Caching & Stale Time
        staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime) - keep unused data in cache

        // Refetching Behavior
        refetchOnWindowFocus: false, // Good for admin systems
        refetchOnReconnect: true, // Refetch when internet reconnects
        refetchOnMount: true, // Refetch when component mounts

        // Retry Logic
        retry: (failureCount, error: any) => {
            // Don't retry on 4xx errors (client errors)
            if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false;
            }
            // Retry up to 2 times for server errors
            return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

        // Performance
        structuralSharing: true, // Prevent unnecessary re-renders
        throwOnError: false, // Handle errors gracefully
    },
    mutations: {
        retry: (failureCount, error: any) => {
            // Never retry mutations on client errors
            if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false;
            }
            // Only retry once for server errors
            return failureCount < 1;
        },
        retryDelay: 1000,

        // Global mutation callbacks (optional)
        onError: (error: any) => {
            console.error('Mutation error:', error);
            // You can add global error handling here
        },
    },
};

export default function QueryProvider({
    children
}: {
    children: React.ReactNode
}) {
    // ✅ Use useState with function initialization (you did this correctly!)
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: queryConfig,
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* Only show devtools in development */}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools
                    initialIsOpen={false}
                    buttonPosition="bottom-right"
                />
            )}
            <Toaster />
        </QueryClientProvider>
    );
}