'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Home, Info, ShoppingBag, Search, X, Menu, ShoppingCart } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/zustand/use-cart-store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeaderProps {
    isVisible: boolean;
    isFixed?: boolean;
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Shop', href: '/shop', icon: ShoppingBag },
    { label: 'About', href: '/about', icon: Info },
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
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const openSearch = useCallback(() => setSearchOpen(true), []);
    const closeSearch = useCallback(() => setSearchOpen(false), []);

    return (
        <header
            className={cn(
                'font-sans',
                isFixed
                    ? 'sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border'
                    : cn(
                        'fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]',
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
                        <div className="w-9 h-9 bg-foreground text-background flex items-center justify-center font-bold text-base transition-transform duration-300 group-hover:rotate-90 shrink-0">
                            M
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

                        <CartButton />
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

                                <CartButton />

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
                                                    onClick={() => setMobileMenuOpen(false)}
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
    );
};

export default Header;