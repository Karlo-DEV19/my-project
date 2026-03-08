"use client"

import { memo, useCallback } from "react"
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
} from "@/components/ui/pagination"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Types
export interface PaginationData {
    currentPage: number
    totalPages: number
    totalItems: number
    perPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
}

export interface DataPaginationProps {
    pagination: PaginationData
    onPageChange: (page: number) => void
    onPerPageChange?: (perPage: number) => void
    perPageOptions?: number[]
    showPerPageSelector?: boolean
    showResultsInfo?: boolean
    showFirstLast?: boolean
    maxVisiblePages?: number
    isLoading?: boolean
    className?: string
    itemLabel?: string
    itemLabelPlural?: string
}

// Default options
const DEFAULT_PER_PAGE_OPTIONS = [10, 20, 50, 100]

function DataPagination({
    pagination,
    onPageChange,
    onPerPageChange,
    perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
    showPerPageSelector = true,
    showResultsInfo = true,
    showFirstLast = true,
    maxVisiblePages = 5,
    isLoading = false,
    className,
    itemLabel = "item",
    itemLabelPlural = "items",
}: DataPaginationProps) {
    const {
        currentPage,
        totalPages,
        totalItems,
        perPage,
        hasNextPage,
        hasPrevPage,
    } = pagination

    // Calculate display range
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1
    const endItem = Math.min(currentPage * perPage, totalItems)

    // Generate page numbers
    const getPageNumbers = useCallback((): (number | "ellipsis-start" | "ellipsis-end")[] => {
        const pages: (number | "ellipsis-start" | "ellipsis-end")[] = []

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
            return pages
        }

        pages.push(1)

        const leftBound = Math.max(2, currentPage - 1)
        const rightBound = Math.min(totalPages - 1, currentPage + 1)

        if (leftBound > 2) {
            pages.push("ellipsis-start")
        }

        for (let i = leftBound; i <= rightBound; i++) {
            if (!pages.includes(i)) {
                pages.push(i)
            }
        }

        if (rightBound < totalPages - 1) {
            pages.push("ellipsis-end")
        }

        if (totalPages > 1 && !pages.includes(totalPages)) {
            pages.push(totalPages)
        }

        return pages
    }, [currentPage, totalPages, maxVisiblePages])

    // Handlers
    const handleFirst = useCallback(() => onPageChange(1), [onPageChange])
    const handlePrev = useCallback(() => onPageChange(currentPage - 1), [onPageChange, currentPage])
    const handleNext = useCallback(() => onPageChange(currentPage + 1), [onPageChange, currentPage])
    const handleLast = useCallback(() => onPageChange(totalPages), [onPageChange, totalPages])

    const handlePerPageChange = useCallback(
        (value: string) => {
            onPerPageChange?.(parseInt(value, 10))
        },
        [onPerPageChange]
    )

    // Don't render if no items
    if (totalItems === 0) return null

    const pages = getPageNumbers()

    return (
        <div
            className={cn(
                "flex flex-col gap-4 pt-6 mt-4 border-t border-border font-sans",
                "sm:flex-row sm:items-center sm:justify-between",
                isLoading && "opacity-50 pointer-events-none animate-pulse",
                className
            )}
        >
            {/* Left: Results Info & Per Page */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">

                {/* Results Info - Premium Typography */}
                {showResultsInfo && (
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                        Showing <span className="text-foreground">{startItem}</span> - <span className="text-foreground">{endItem}</span> of <span className="text-foreground">{totalItems}</span> {totalItems === 1 ? itemLabel : itemLabelPlural}
                    </p>
                )}

                {/* Per Page Selector */}
                {showPerPageSelector && onPerPageChange && (
                    <div className="flex items-center gap-3">
                        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium whitespace-nowrap">
                            Rows
                        </span>
                        <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
                            <SelectTrigger className="h-9 w-[72px] rounded-none border-border bg-transparent focus:ring-1 focus:ring-primary text-xs font-medium">
                                <SelectValue placeholder={perPage} />
                            </SelectTrigger>
                            <SelectContent align="start" className="rounded-none border-border">
                                {perPageOptions.map((option) => (
                                    <SelectItem key={option} value={option.toString()} className="text-xs font-medium rounded-none focus:bg-accent focus:text-accent-foreground cursor-pointer">
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Right: Pagination Controls */}
            <Pagination className="mx-0 w-auto">
                <PaginationContent className="gap-1.5">

                    {/* First Page */}
                    {showFirstLast && (
                        <PaginationItem className="hidden sm:block">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-none border-border bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-30"
                                onClick={handleFirst}
                                disabled={!hasPrevPage}
                                aria-label="Go to first page"
                            >
                                <ChevronsLeft className="h-4 w-4" strokeWidth={1.5} />
                            </Button>
                        </PaginationItem>
                    )}

                    {/* Previous Page */}
                    <PaginationItem>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-none border-border bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-30"
                            onClick={handlePrev}
                            disabled={!hasPrevPage}
                            aria-label="Go to previous page"
                        >
                            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                    </PaginationItem>

                    {/* Page Numbers */}
                    {pages.map((page, index) => (
                        <PaginationItem
                            key={typeof page === "number" ? page : `${page}-${index}`}
                            className={cn(
                                typeof page === "number" && page !== currentPage && "hidden sm:block"
                            )}
                        >
                            {typeof page === "number" ? (
                                <Button
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="icon"
                                    className={cn(
                                        "h-9 w-9 rounded-none text-xs font-medium transition-colors",
                                        currentPage === page
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : "border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
                                        currentPage === page && "pointer-events-none"
                                    )}
                                    onClick={() => onPageChange(page)}
                                    aria-label={`Go to page ${page}`}
                                    aria-current={currentPage === page ? "page" : undefined}
                                >
                                    {page}
                                </Button>
                            ) : (
                                <span className="flex h-9 w-9 items-center justify-center">
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                </span>
                            )}
                        </PaginationItem>
                    ))}

                    {/* Next Page */}
                    <PaginationItem>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-none border-border bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-30"
                            onClick={handleNext}
                            disabled={!hasNextPage}
                            aria-label="Go to next page"
                        >
                            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                    </PaginationItem>

                    {/* Last Page */}
                    {showFirstLast && (
                        <PaginationItem className="hidden sm:block">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-none border-border bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-30"
                                onClick={handleLast}
                                disabled={!hasNextPage}
                                aria-label="Go to last page"
                            >
                                <ChevronsRight className="h-4 w-4" strokeWidth={1.5} />
                            </Button>
                        </PaginationItem>
                    )}
                </PaginationContent>
            </Pagination>
        </div>
    )
}

export default memo(DataPagination)