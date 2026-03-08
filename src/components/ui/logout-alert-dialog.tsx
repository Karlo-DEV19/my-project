'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { signOut } from '../../../actions/auth';

interface LogoutDialogProps {
    children: React.ReactNode;
}

export const LogoutDialog = ({ children }: LogoutDialogProps) => {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // ✅ OPTIMIZATION: useCallback prevents the function from being recreated on every render
    const handleLogout = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
        // Prevent the dialog from closing instantly so we can show the loading state
        e.preventDefault();

        if (isLoggingOut) return;
        setIsLoggingOut(true);

        try {
            // 1. Call your database/auth logout function here
            await signOut();

            // 2. Redirect the user back to the login page
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            setIsLoggingOut(false); // Only stop loading if it fails
        }
    }, [router, isLoggingOut]);

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>

            {/* ✅ THEME FIX: Using standard bg-background and border-border */}
            <AlertDialogContent className="rounded-none border border-border bg-background font-sans p-8 max-w-[440px] shadow-lg">
                <AlertDialogHeader className="mb-2 flex flex-col items-start space-y-4">
                    <AlertDialogTitle className="font-serif text-2xl tracking-wide text-foreground">
                        End Session
                    </AlertDialogTitle>

                    {/* ✅ THEME FIX: Semantic divider using bg-border */}
                    <div className="w-12 h-px bg-border"></div>

                    <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                        Are you sure you want to sign out of the portal? You will need to enter your credentials to access the system again.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-8 flex flex-row gap-3 sm:space-x-0">
                    <AlertDialogCancel
                        disabled={isLoggingOut}
                        // ✅ THEME FIX: Standard hover:bg-accent hover:text-accent-foreground
                        className="flex-1 rounded-none border border-border bg-transparent hover:bg-accent hover:text-accent-foreground text-foreground text-xs font-medium uppercase tracking-widest h-12 transition-colors m-0"
                    >
                        Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        // ✅ THEME FIX: Using primary theme colors instead of hardcoded blacks/whites
                        className="flex-1 rounded-none border border-primary bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium uppercase tracking-widest h-12 transition-colors m-0 flex items-center justify-center gap-2"
                    >
                        {isLoggingOut ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Signing out...
                            </>
                        ) : (
                            'Confirm Sign Out'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};