
'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY || window.pageYOffset;
            setIsVisible(y > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleClick = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    if (!isVisible) return null;

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label="Scroll to top"
            className={cn(
                'fixed right-4 z-40',
                'bottom-24 md:bottom-28', // positioned above chat box button
                'inline-flex items-center justify-center',
                'h-10 w-10 rounded-full border border-border bg-background/95 shadow-lg',
                'text-foreground hover:bg-muted hover:text-foreground transition-colors'
            )}
        >
            <ArrowUp className="w-4 h-4" />
        </button>
    );
};

export default ScrollToTop;