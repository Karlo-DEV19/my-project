'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Home, Info, LogOut, Menu, Mail, Package, Search, ShoppingBag, ShoppingCart, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/zustand/use-cart-store';
import { createClient } from '@/lib/supabase/client';
import { axiosApiClient } from '@/app/api/axiosApiClient';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/theme-toggle';
import { AuthDialogContent } from '@/components/customer-auth';
import type { AuthCallbackMessage } from '@/app/auth/callback/page';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeaderProps {
    isVisible: boolean;
    isFixed?: boolean;
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Shop', href: '/shop', icon: ShoppingBag },
    { label: 'About', href: '/#about', icon: Info },
    { label: 'Contact', href: '/contact', icon: Mail },
] as const;

// ─── Cart Button ──────────────────────────────────────────────────────────────

const CartButton = React.memo(() => {
    const { itemCount, openCartSheet } = useCartStore();

    return (
        <button
            onClick={openCartSheet}
            className="relative flex items-center justify-center w-10 h-10 text-foreground hover:bg-accent transition-colors border border-transparent hover:border-border"
            aria-label={`Open cart (${itemCount} items)`}
        >
            <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={1.5} />
            {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-foreground text-background text-[9px] font-bold leading-none px-1 rounded-none">
                    {itemCount > 99 ? '99+' : itemCount}
                </span>
            )}
        </button>
    );
});

CartButton.displayName = 'CartButton';

// ─── Login Button (Magic Link + Session) ─────────────────────────────────────────────

function LoginButton() {
    const queryClient = useQueryClient();
    const { registerOpenAuthModal } = useCartStore();
    // loginOpen  → controls the centered Dialog (logged-out flow)
    // menuOpen   → controls the user account dropdown (logged-in flow)
    const [loginOpen, setLoginOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);

    // ── Register auth modal opener with cart store ─────────────────────────────
    // This allows CartSheet to open the login dialog when guest clicks Checkout.
    useEffect(() => {
        registerOpenAuthModal(() => setLoginOpen(true));
    }, [registerOpenAuthModal]);
    const menuRef = useRef<HTMLDivElement>(null);

    // ── Init session + subscribe to auth state changes ────────────────────────────
    useEffect(() => {
        let sub: { unsubscribe: () => void } | null = null;
        let bc: BroadcastChannel | null = null;

        const init = async () => {
            const supabase = await createClient();

            // Read current session immediately
            const { data } = await supabase.auth.getSession();
            setSession(data.session);

            // ── Sync localStorage user for cart/checkout autofill ─────────────
            if (data.session?.user) {
                const u = data.session.user;
                try {
                    localStorage.setItem('user', JSON.stringify({
                        id: u.id,
                        email: u.email ?? '',
                        name: (u.user_metadata?.full_name as string | undefined)
                            ?? (u.user_metadata?.name as string | undefined)
                            ?? '',
                    }));
                } catch { /* storage unavailable */ }
            }

            // Keep UI in sync with real-time auth changes (magic link callback, logout, etc.)
            const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
                setSession(newSession);

                if (_event === 'SIGNED_IN' && newSession?.user?.email) {
                    setLoginOpen(false);

                    // ── Write to localStorage so cart checkout guard works ─────
                    try {
                        const u = newSession.user;
                        localStorage.setItem('user', JSON.stringify({
                            id: u.id,
                            email: u.email ?? '',
                            name: (u.user_metadata?.full_name as string | undefined)
                                ?? (u.user_metadata?.name as string | undefined)
                                ?? '',
                        }));
                    } catch { /* storage unavailable */ }

                    // ── Sync user into the database ───────────────────────────────
                    try {
                        const user = newSession.user;
                        const name =
                            (user.user_metadata?.full_name as string | undefined) ??
                            (user.user_metadata?.name as string | undefined);
                        await axiosApiClient.post('/users/sync', {
                            id: user.id,
                            email: user.email,
                            ...(name ? { name } : {}),
                        });
                        // Refresh admin accounts list if it is mounted in the same session
                        queryClient.invalidateQueries({ queryKey: ['users'] });
                    } catch (err) {
                        // Non-fatal: log but never block the login flow
                        console.warn('[user-sync] failed:', err);
                    }
                }

                if (_event === 'SIGNED_OUT') {
                    // ── Clear localStorage so the cart guard re-gates correctly ─
                    try { localStorage.removeItem('user'); } catch { /* storage unavailable */ }
                }
            });
            sub = listener.subscription;

            // ── BroadcastChannel: react to magic-link callback tab ────────────
            // The callback page broadcasts session tokens after OTP exchange.
            // We call setSession() — NOT getSession() — because getSession()
            // returns the stale in-memory cache (null in the original tab).
            // setSession() hydrates the cache and fires onAuthStateChange.
            try {
                bc = new BroadcastChannel('mj-auth-callback');
                bc.onmessage = async (evt: MessageEvent<AuthCallbackMessage>) => {
                    if (evt.data?.event === 'SIGNED_IN') {
                        const { data: { session: newSess }, error } =
                            await supabase.auth.setSession({
                                access_token: evt.data.accessToken,
                                refresh_token: evt.data.refreshToken,
                            });

                        if (!error && newSess) {
                            setSession(newSess);
                            setLoginOpen(false);
                            toast.success('Signed in successfully', {
                                description: newSess.user.email,
                            });
                        }
                    }
                };
            } catch {
                // BroadcastChannel not supported — onAuthStateChange covers this
            }
        };

        init();
        return () => {
            sub?.unsubscribe();
            bc?.close();
        };
    }, [queryClient]);

    // ── Close logged-in menu on outside click ──────────────────────────────────
    useEffect(() => {
        if (!menuOpen) return;
        function onClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [menuOpen]);

    // ── Close logged-in menu on ESC ────────────────────────────────────────────
    useEffect(() => {
        if (!menuOpen) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setMenuOpen(false);
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [menuOpen]);

    // ── Logout ───────────────────────────────────────────────────────────────────
    const handleLogout = async () => {
        const supabase = await createClient();
        await supabase.auth.signOut();
        // SIGNED_OUT event from onAuthStateChange also removes the item,
        // but clear immediately for snappier UI response.
        try { localStorage.removeItem('user'); } catch { /* storage unavailable */ }
        setMenuOpen(false);
        toast.success('Logged out');
    };

    // ── Render: LOGGED IN ───────────────────────────────────────────────────────────
    if (session) {
        return (
            <div ref={menuRef} className="relative">
                {/* Avatar trigger */}
                <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="flex items-center justify-center w-9 h-9 bg-foreground text-background hover:opacity-80 transition-opacity focus-visible:outline-none"
                    aria-label="Account menu"
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                >
                    <User className="w-[15px] h-[15px]" strokeWidth={1.5} />
                </button>

                {/* Account dropdown */}
                {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-background border border-border shadow-xl z-[200] animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden">
                        {/* Email display */}
                        <div className="px-4 py-3 border-b border-border">
                            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Signed in as</p>
                            <p className="text-xs text-foreground truncate">{session.user.email}</p>
                        </div>

                        {/* Nav links */}
                        <div className="py-1 border-b border-border">
                            <Link
                                href="/orders"
                                onClick={() => setMenuOpen(false)}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                            >
                                <Package className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                                Orders
                            </Link>
                            <Link
                                href="/profile"
                                onClick={() => setMenuOpen(false)}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                            >
                                <User className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                                Profile
                            </Link>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        >
                            <LogOut className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                            Log out
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ── Render: LOGGED OUT — centered Dialog ───────────────────────────────────
    // AuthDialogContent manages its own form/sent step state.
    // key={loginOpen} resets it cleanly each time the dialog opens.
    return (
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
            <DialogTrigger asChild>
                <button
                    className="flex items-center gap-1.5 px-3 h-9 text-[11px] font-semibold uppercase tracking-widest text-foreground border border-border hover:bg-accent transition-colors"
                    aria-label="Login"
                >
                    <User className="w-[14px] h-[14px]" strokeWidth={1.5} />
                    Login
                </button>
            </DialogTrigger>

            <DialogContent
                className="sm:max-w-sm w-full p-6 shadow-2xl rounded-none border border-border"
            >
                {/* ── Accessibility: required by Radix for screen readers ────── */}
                {/* Visually hidden — branding is rendered inside AuthDialogContent */}
                <DialogTitle className="sr-only">
                    Sign in to MJ Decors
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Enter your email address to receive a secure sign-in link.
                    No password required.
                </DialogDescription>

                <AuthDialogContent
                    key={String(loginOpen)}
                    onAuthenticated={(email) => {
                        setLoginOpen(false);
                        toast.success('Signed in successfully', { description: email });
                        // The session was established server-side (cookie). The client-side
                        // Supabase instance hasn't seen the SIGNED_IN event yet, so we pull
                        // the fresh session from the cookie immediately to update the header.
                        createClient().then((supabase) => {
                            supabase.auth.getSession().then(({ data }) => {
                                setSession(data.session);
                            });
                        });
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}


// ─── Search Bar (inline, replaces nav) ───────────────────────────────────────

const SearchBar = ({
    onClose,
}: {
    onClose: () => void;
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Auto-focus when search opens
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="flex-1 flex items-center gap-3 animate-in slide-in-from-right-4 fade-in duration-200">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <input
                ref={inputRef}
                type="text"
                placeholder="Search fabrics, blinds, shades…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none border-0 ring-0"
            // UI only — no handler needed
            />
            <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
                aria-label="Close search"
            >
                <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
        </div>
    );
};

// ─── Header ───────────────────────────────────────────────────────────────────

const Header = ({ isVisible, isFixed }: HeaderProps) => {
    const pathname = usePathname();
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const openSearch = useCallback(() => setSearchOpen(true), []);
    const closeSearch = useCallback(() => setSearchOpen(false), []);



    const handleAboutClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (pathname === '/') {
            event.preventDefault();
            const aboutSection = document.getElementById('about');
            if (aboutSection) {
                const headerOffset = 96; // approx header height
                const elementPosition = aboutSection.getBoundingClientRect().top + window.scrollY;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth',
                });
            }
        }
    };

    return (
        <>
            <header
                className={cn(
                    'font-sans',
                    isFixed
                        ? 'sticky top-0 z-99 bg-background/95 backdrop-blur-md border-b border-border'
                        : cn(
                            'fixed top-0 left-0 right-0 z-99 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]',
                            isVisible
                                ? 'translate-y-0 opacity-100'
                                : '-translate-y-full opacity-0 pointer-events-none',
                            'bg-background/90 backdrop-blur-md border-b border-border/20'
                        )
                )}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-18 sm:h-20" style={{ height: '72px' }}>

                        {/* ── Logo ── */}
                        <Link
                            href="/"
                            className={cn(
                                'flex items-center gap-3.5 group shrink-0 transition-all duration-200',
                                searchOpen && 'lg:opacity-100 opacity-0 pointer-events-none w-0 overflow-hidden lg:w-auto'
                            )}
                            tabIndex={searchOpen ? -1 : 0}
                            aria-hidden={searchOpen}
                        >
                            <div className="w-9 h-9 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:rotate-90">
                                <img
                                    src="/logo pic/logo.png"
                                    alt="Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="hidden sm:flex flex-col leading-none">
                                <span className="text-foreground text-[11px] font-bold tracking-[0.2em] uppercase">
                                    MJ Decor 888
                                </span>
                                <span className="text-muted-foreground text-[9px] tracking-widest uppercase mt-0.5">
                                    Window Solutions
                                </span>
                            </div>
                        </Link>

                        {/* ── Desktop center: nav OR search ── */}
                        <div className="hidden lg:flex flex-1 items-center justify-center px-8">
                            {searchOpen ? (
                                <SearchBar onClose={closeSearch} />
                            ) : (
                                <nav className="flex items-center gap-1 bg-muted/40 border border-border/60 p-1 rounded-full backdrop-blur-xl">
                                    {NAV_ITEMS.map(item => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={item.label === 'About' ? handleAboutClick : undefined}
                                            className="px-5 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm transition-all rounded-full border border-transparent hover:border-border/60"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </nav>
                            )}
                        </div>

                        {/* ── Desktop right actions ── */}
                        <div className="hidden lg:flex items-center gap-2 shrink-0">
                            {!searchOpen && (
                                <button
                                    onClick={openSearch}
                                    className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-transparent hover:border-border"
                                    aria-label="Open search"
                                >
                                    <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
                                </button>
                            )}

                            <ThemeToggle />
                            <CartButton />
                            <LoginButton />
                        </div>

                        {/* ── Mobile right actions ── */}
                        <div className="lg:hidden flex items-center gap-2 shrink-0">
                            {/* Mobile: show search inline when open */}
                            {searchOpen ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <SearchBar onClose={closeSearch} />
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={openSearch}
                                        className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                        aria-label="Search"
                                    >
                                        <Search className="w-[17px] h-[17px]" strokeWidth={1.5} />
                                    </button>

                                    <ThemeToggle className="w-9 h-9" />
                                    <CartButton />
                                    <LoginButton />

                                    {/* Mobile sheet menu */}
                                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                        <SheetTrigger asChild>
                                            <button
                                                className="w-9 h-9 flex items-center justify-center text-foreground border border-border hover:bg-accent transition-colors"
                                                aria-label="Open menu"
                                            >
                                                <Menu className="w-4 h-4" strokeWidth={1.5} />
                                            </button>
                                        </SheetTrigger>
                                        <SheetContent
                                            side="right"
                                            className="w-[280px] bg-background border-l border-border p-0 flex flex-col"
                                        >
                                            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

                                            {/* Mobile menu header */}
                                            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center font-bold text-sm">
                                                        M
                                                    </div>
                                                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">
                                                        MJ Decor 888
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Nav links */}
                                            <nav className="flex flex-col px-4 py-6 gap-1 flex-1">
                                                {NAV_ITEMS.map(item => (
                                                    <Link
                                                        key={item.label}
                                                        href={item.href}
                                                        onClick={(e) => {
                                                            if (item.label === 'About') handleAboutClick(e);
                                                            setMobileMenuOpen(false);
                                                        }}
                                                        className="flex items-center gap-4 px-3 py-3.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-all group"
                                                    >
                                                        <item.icon
                                                            className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity shrink-0"
                                                            strokeWidth={1.5}
                                                        />
                                                        <span className="font-serif text-xl tracking-wide">
                                                            {item.label}
                                                        </span>
                                                    </Link>
                                                ))}
                                            </nav>
                                        </SheetContent>
                                    </Sheet>
                                </>
                            )}
                        </div>

                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;