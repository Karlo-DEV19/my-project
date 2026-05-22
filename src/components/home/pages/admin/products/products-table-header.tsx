"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { NavigationLoader } from "@/components/ui/navigation-loader"

interface ProductsTableHeaderProps {
    search: string
    onSearchChange: (value: string) => void
    status: string | null
    onStatusChange: (value: string | null) => void
}

export function ProductsTableHeader({
    search,
    onSearchChange,
    status,
    onStatusChange,
}: ProductsTableHeaderProps) {
    const router = useRouter()

    // Hydration & Navigation State
    const [mounted, setMounted] = useState(false)
    const [isNavigating, setIsNavigating] = useState(false)
    const [inputValue, setInputValue] = useState(search)

    // Prevent Hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    // Debounce Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearchChange(inputValue)
        }, 400) // Slightly faster debounce for snappiness
        return () => clearTimeout(timer)
    }, [inputValue, onSearchChange])

    const handleAddProduct = () => {
        setIsNavigating(true)
        router.push("/admin/products/blinds/create")
    }

    // Render Skeleton shell if not mounted
    if (!mounted) {
        return <div className="h-[120px] w-full animate-pulse bg-muted/50 rounded-lg" />
    }

    return (
        <>
            <NavigationLoader isVisible={isNavigating} title="Preparing Inventory Form" />

            <div className="flex flex-col gap-6 mb-8">
                {/* Top Row: Title & Action */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Blinds Inventory</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage and track your products and available colors
                        </p>
                    </div>
                    <Button
                        onClick={handleAddProduct}
                        className="w-full cursor-pointer sm:w-auto font-semibold shadow-sm transition-transform active:scale-95"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add New Blind
                    </Button>
                </div>

                {/* Bottom Row: Filters */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative flex-1 md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, code, or type..."
                            className="pl-9 pr-9 h-10 border-border bg-card transition-all focus:ring-1 focus:ring-primary"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        {inputValue && (
                            <button
                                type="button"
                                onClick={() => setInputValue("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Select
                            value={status ?? "all"}
                            onValueChange={(val) => onStatusChange(val === "all" ? null : val)}
                        >
                            <SelectTrigger className="w-full md:w-[160px] h-10 bg-card border-border">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </>
    )
}