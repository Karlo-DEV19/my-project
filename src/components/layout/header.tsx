'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Search, Home, ShoppingBag, Info, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from '@/lib/utils';

interface HeaderProps {
    isVisible: boolean;
}

const Header = ({ isVisible }: HeaderProps) => {
    // Moved the navItems here so it can be managed globally
    const navItems = [
        { label: 'Home', href: '#', icon: Home },
        { label: 'Shop', href: '#shop', icon: ShoppingBag },
        { label: 'About', href: '#about', icon: Info },
        { label: 'Contact', href: '#contact', icon: Phone },
    ];

    return (
        <header
            className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]',
                isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none',
                'bg-background/80 backdrop-blur-md border-b border-border/10'
            )}
        >
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="flex items-center justify-between h-20 sm:h-24">

                    {/* 1. Logo Section */}
                    <Link href="/" className="flex items-center gap-4 group cursor-pointer shrink-0">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-foreground text-background flex items-center justify-center font-bold text-lg lg:text-xl transition-transform group-hover:rotate-90">
                            M
                        </div>
                        <div className="flex flex-col">
                            <span className="text-foreground text-sm font-bold tracking-widest uppercase">MJ Decor 888</span>
                            <span className="text-muted-foreground text-[10px] tracking-tighter uppercase">Window Solutions</span>
                        </div>
                    </Link>

                    {/* 2. Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1 bg-muted/50 backdrop-blur-xl border border-border p-1 rounded-full">
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm transition-all rounded-full border border-transparent hover:border-border"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* 3. Actions (Desktop) */}
                    <div className="hidden lg:flex items-center gap-4 shrink-0">
                        <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted rounded-full">
                            <Search className="w-5 h-5" />
                        </Button>
                        <Button className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-bold tracking-widest uppercase text-xs px-8 h-[46px]">
                            Get Quote
                        </Button>
                    </div>

                    {/* 4. Mobile Menu (Sheet) */}
                    <div className="lg:hidden flex items-center gap-4 shrink-0">
                        <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted rounded-full sm:flex hidden">
                            <Search className="w-5 h-5" />
                        </Button>
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-foreground border border-border bg-background/50 backdrop-blur-sm shadow-sm hover:bg-muted relative z-50 rounded-none">
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] bg-background/95 backdrop-blur-xl border-l border-border p-8 flex flex-col justify-center">
                                <SheetTitle className="sr-only">Menu</SheetTitle>
                                <div className="flex flex-col gap-8">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            className="flex items-center gap-4 text-2xl font-serif text-muted-foreground hover:text-foreground transition-colors group"
                                        >
                                            <item.icon className="w-6 h-6 opacity-50 group-hover:opacity-100 group-hover:text-primary transition-opacity" />
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                                <div className="mt-16 pt-8 border-t border-border flex flex-col gap-4">
                                    <Button variant="outline" className="w-full text-foreground border-border font-bold tracking-widest uppercase text-xs h-12 flex items-center justify-center gap-2 rounded-none sm:hidden">
                                        <Search className="w-4 h-4" /> Search
                                    </Button>
                                    <Button className="w-full bg-foreground text-background font-bold tracking-widest uppercase text-xs h-12 rounded-none">
                                        Get a Quote
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                </div>
            </div>
        </header>
    );
};

export default Header;