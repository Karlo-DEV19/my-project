'use client';

import React, { useState, useCallback } from 'react';
import ShopHeader from './shop-header';
import DataPagination from '@/components/ui/data-pagination';
import ProductGrid from './shop-grid-products';
import { useGetBlindsProducts } from '@/app/api/hooks/use-product-blinds';
export default function ShopSection() {
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(12);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const { blinds, pagination, isLoading, isFetching } = useGetBlindsProducts({
        page: currentPage,
        limit: perPage,
        search,
        status,
        sortBy,
        sortOrder,
    });

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handlePerPageChange = useCallback((newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    }, []);

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        setCurrentPage(1);
    }, []);

    const handleStatusChange = useCallback((value: string | null) => {
        setStatus(value);
        setCurrentPage(1);
    }, []);

    const handleSortChange = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        setCurrentPage(1);
    }, []);

    const paginationData = pagination
        ? {
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            totalItems: pagination.total,
            perPage: pagination.limit,
            hasNextPage: pagination.hasNextPage,
            hasPrevPage: pagination.hasPrevPage,
        }
        : {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            perPage,
            hasNextPage: false,
            hasPrevPage: false,
        };

    return (
        <section className="w-full max-w-7xl mx-auto p-6 md:p-10 lg:p-12 animate-in fade-in duration-500 font-sans">
            <ShopHeader
                title="Curated Collections"
                subtitle="Explore our premium selection of Korean window treatments, precision-engineered for modern living spaces."
                search={search}
                status={status}
                sortBy={sortBy}
                sortOrder={sortOrder}
                totalItems={pagination?.total ?? 0}
                onSearchChange={handleSearchChange}
                onStatusChange={handleStatusChange}
                onSortChange={handleSortChange}
            />

            <div className={`mt-8 mb-12 transition-opacity duration-300 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                <ProductGrid products={blinds} isLoading={isLoading} />
            </div>

            {!isLoading && paginationData.totalItems > 0 && (
                <DataPagination
                    pagination={paginationData}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    perPageOptions={[4, 8, 12, 24]}
                    itemLabel="fabric"
                    itemLabelPlural="fabrics"
                />
            )}
        </section>
    );
}