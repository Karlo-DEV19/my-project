import ProductSection from "@/components/pages/admin/products/product-section"
import { InventorySkeleton } from "@/components/pages/admin/products/table-skeleton"
import React, { Suspense } from "react"

/**
 * ProductsPage
 * * Acts as a container that enables concurrent rendering.
 * The TableSkeleton will show until the data inside ProductSection is ready.
 */
const ProductsPage = () => {
    return (
        <main className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
            <Suspense fallback={<InventorySkeleton />}>
                <ProductSection />
            </Suspense>
        </main>
    )
}

export default ProductsPage