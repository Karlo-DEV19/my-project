"use client"

import React from "react"
import { Loader2 } from "lucide-react"

interface NavigationLoaderProps {
    isVisible: boolean
    title?: string
}

export function NavigationLoader({ isVisible, title = "Navigating..." }: NavigationLoaderProps) {
    if (!isVisible) return null

    return (
        <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm transition-opacity duration-300">
            <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 shadow-2xl">
                {/* Native Tailwind Spinner */}
                <div className="relative flex h-12 w-12 items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>

                <div className="text-center">
                    <p className="text-sm font-bold tracking-tight">{title}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground animate-pulse mt-1">
                        Rendering Page
                    </p>
                </div>
            </div>
        </div>
    )
}