'use client';

import React, { useState, useMemo } from 'react';
import ShopHeader from './shop-header';
import DataPagination from '@/components/ui/data-pagination';
import { blindsProducts } from '@/lib/utils';
import ProductGrid from './shop-grid-products';



export default function ShopSection() {
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(12);

    const { currentProducts, paginationData } = useMemo(() => {
        const totalItems = blindsProducts.length;
        const totalPages = Math.ceil(totalItems / perPage);

        const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));

        const startIndex = (safeCurrentPage - 1) * perPage;
        const slicedProducts = blindsProducts.slice(startIndex, startIndex + perPage);

        return {
            currentProducts: slicedProducts,
            paginationData: {
                currentPage: safeCurrentPage,
                totalPages,
                totalItems,
                perPage,
                hasNextPage: safeCurrentPage < totalPages,
                hasPrevPage: safeCurrentPage > 1,
            }
        };
    }, [currentPage, perPage]);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    return (
        <section className="w-full max-w-7xl mx-auto p-6 md:p-10 lg:p-12 animate-in fade-in duration-500 font-sans">
            <ShopHeader
                title="Curated Collections"
                subtitle="Explore our premium selection of Korean window treatments, precision-engineered for modern living spaces."
            />

            <div className="mt-8 mb-12">
                <ProductGrid products={currentProducts} />
            </div>

            <DataPagination
                pagination={paginationData}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                perPageOptions={[4, 8, 12, 24]}
                itemLabel="fabric"
                itemLabelPlural="fabrics"
            />
        </section>
    );
}