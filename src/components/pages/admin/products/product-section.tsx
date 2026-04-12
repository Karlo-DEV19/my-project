"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Eye, Trash2, Edit3, MoreVertical, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { useGetBlindsProducts } from "@/app/api/hooks/use-product-blinds"
import { ProductsTableHeader } from "./products-table-header"
import { InventorySkeleton } from "./table-skeleton"
import DataPagination from "@/components/ui/data-pagination"
import { useRouter } from "next/navigation"

const ProductSection = () => {
    const [mounted, setMounted] = useState(false)
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(12)
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState<string | null>(null)

    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    const { blinds, pagination, isPending } = useGetBlindsProducts({
        page,
        limit: perPage,
        search,
        status
    })

    const MAX_COLORS_DISPLAY = 4

    if (!mounted) return <InventorySkeleton />

    return (
        <div className="space-y-8">
            <ProductsTableHeader
                search={search}
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
                status={status}
                onStatusChange={(v) => { setStatus(v); setPage(1); }}
            />

            {isPending ? (
                <InventorySkeleton />
            ) : blinds && blinds.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {blinds.map((product) => (
                        <div
                            key={product.id}
                            className="group relative flex flex-col rounded-2xl border border-border/60 bg-card p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
                        >
                            {/* PREMIUM INSET IMAGE SECTION */}
                            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted/50">
                                {/* Status Badge - Moved to top left of image for clear visibility */}
                                <div className="absolute left-3 top-3 z-10">
                                    <Badge
                                        variant={product.status === "active" ? "default" : "secondary"}
                                        className="bg-background/90 text-foreground backdrop-blur-md hover:bg-background/100 shadow-sm capitalize"
                                    >
                                        {product.status}
                                    </Badge>
                                </div>

                                {product.images?.[0]?.imageUrl ? (
                                    <Image
                                        src={product.images[0].imageUrl}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                        <Package className="h-10 w-10 opacity-20" />
                                    </div>
                                )}
                            </div>

                            {/* STRUCTURED BODY SECTION */}
                            <div className="flex flex-1 flex-col pt-4 px-1 pb-1">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            {product.productCode} • {product.type}
                                        </p>
                                        <h3 className="line-clamp-1 text-base font-bold tracking-tight text-foreground">
                                            {product.name}
                                        </h3>
                                    </div>

                                    {/* CLEAN ACTIONS MENU */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                            <DropdownMenuItem onClick={() => { router.push(`/admin/products/blinds/${product.id}`) }} className="cursor-pointer">
                                                <Eye className="mr-2 h-4 w-4" /> View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { router.push(`/admin/products/blinds/${product.id}/edit`) }} className="cursor-pointer">
                                                <Edit3 className="mr-2 h-4 w-4" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => { }} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* FOOTER (Price & Colors) */}
                                <div className="mt-auto flex items-end justify-between pt-6">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-medium text-muted-foreground">Price (sq.ft)</span>
                                        <span className="text-lg font-bold text-foreground">
                                            ₱{product.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="flex -space-x-2">
                                            <TooltipProvider delayDuration={100}>
                                                {product.colors?.slice(0, MAX_COLORS_DISPLAY).map((color, idx) => (
                                                    <Tooltip key={idx}>
                                                        <TooltipTrigger asChild>
                                                            <div className="relative h-8 w-8 rounded-full border-2 border-card ring-1 ring-border/50 overflow-hidden bg-muted shadow-sm transition-transform hover:z-10 hover:scale-110">
                                                                <Image
                                                                    src={color.imageUrl as string}
                                                                    alt={color.name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="text-xs font-medium">
                                                            {color.name}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ))}
                                            </TooltipProvider>

                                            {product.colors && product.colors.length > MAX_COLORS_DISPLAY && (
                                                <div className="relative z-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-secondary text-[10px] font-bold text-secondary-foreground ring-1 ring-border/50">
                                                    +{product.colors.length - MAX_COLORS_DISPLAY}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border/60 bg-card/50">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                        <Package className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">No inventory found</h3>
                    <p className="text-sm text-muted-foreground mt-1">Adjust your search or filters to find products.</p>
                </div>
            )}

            {pagination && (
                <div className="mt-8 border-t border-border/50 pt-6">
                    <DataPagination
                        pagination={{
                            currentPage: pagination.page,
                            totalPages: pagination.totalPages,
                            totalItems: pagination.total,
                            perPage: pagination.limit,
                            hasNextPage: pagination.hasNextPage,
                            hasPrevPage: pagination.hasPrevPage,
                        }}
                        onPageChange={setPage}
                        onPerPageChange={(v) => { setPerPage(v); setPage(1); }}
                        itemLabel="product"
                        isLoading={isPending}
                    />
                </div>
            )}
        </div>
    )
}

export default ProductSection