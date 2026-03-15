import { Skeleton } from "@/components/ui/skeleton"

export function InventorySkeleton() {
    return (
        <div className="space-y-6">
            {/* Header & Filters Skeleton */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </div>

            {/* Responsive Grid Skeleton */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-0 overflow-hidden">
                        <Skeleton className="aspect-[4/3] w-full rounded-none" />
                        <div className="p-5 space-y-4">
                            <div className="flex justify-between items-start gap-2">
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-border">
                                <div className="flex -space-x-2">
                                    <Skeleton className="h-8 w-8 rounded-full border-2 border-background" />
                                    <Skeleton className="h-8 w-8 rounded-full border-2 border-background" />
                                </div>
                                <Skeleton className="h-8 w-24 rounded-md" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}