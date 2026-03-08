// components/providers/AuthProvider.tsx
'use client';

import React, { createContext, useContext, useMemo } from 'react';

// 1. Define the exact shape of your session data
export type UserSession = {
    isAuthenticated: boolean;
    user: {
        id: string;
        email?: string;
        role: string;
    } | null;
};

// 2. Set safe defaults
const AuthContext = createContext<UserSession>({
    isAuthenticated: false,
    user: null,
});

export const AuthProvider = ({
    children,
    session,
}: {
    children: React.ReactNode;
    session: UserSession;
}) => {
    // 3. THE OPTIMIZATION: Memoize the session!
    // This guarantees components won't re-render unless the actual auth state changes.
    const memoizedSession = useMemo(() => session, [
        session.isAuthenticated,
        session.user?.id,
        session.user?.role
    ]);

    // ✅ FIX: The formatting here is now strictly valid JSX
    return (
        <AuthContext.Provider value={memoizedSession}>
            {children}
        </AuthContext.Provider>
    );
};

// 4. Custom hook with error handling
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used strictly within an AuthProvider');
    }

    return context;
};