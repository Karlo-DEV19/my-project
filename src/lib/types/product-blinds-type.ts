
export interface CreateBlindsResponse {
    success: boolean;
    product?: {
        id: string;
        productCode: string;
        name: string;
        description: string;
        type: string;
        characteristic?: string;
        composition: string;
        fabricWidth: string;
        packing: string;
        thickness: string;
        unitPrice: number;
        createdAt: string;
        updatedAt: string;
    };
    errors?: Record<string, any>;
    message?: string;
}


// =========================
// TYPES
// =========================

export interface BlindsProductColor {
    name: string;
    imageUrl: string;
}

export interface BlindsProductImage {
    imageUrl: string;
}

export interface BlindsProduct {
    id: string;
    productCode: string;
    name: string;
    type: string;
    composition: string;
    fabricWidth: string;
    packing: string;
    thickness: string;
    status: "active" | "inactive" | "draft" | string;
    unitPrice: number;
    createdAt: string;
    // New nested relations from backend findMany({ with: ... })
    colors: BlindsProductColor[];
    images: BlindsProductImage[];
}

export interface BlindsPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface BlindsFilters {
    search: string;
    status: string | null;
    sortBy: string;
    sortOrder: "asc" | "desc";
}

export interface GetBlindsProductsResponse {
    success: boolean;
    blinds: BlindsProduct[];
    pagination: BlindsPagination;
    filters: BlindsFilters;
}



// view details product blinds by id
export interface BlindsProductDetailResponse {
    success: boolean;
    data: {
        id: string;
        productCode: string;
        name: string;
        description: string | null;
        type: string;
        characteristic: string | null;
        composition: string | null;
        fabricWidth: string | null;
        packing: string | null;
        thickness: string | null;
        status: "active" | "archived" | string;
        unitPrice: number;
        createdAt: string; // ISO Date string
        updatedAt: string; // ISO Date string
        images: BlindsImage[];
        colors: BlindsColor[];
    };
}
// view details product blinds by id
export interface BlindsImage {
    id: string;
    productId: string;
    imageUrl: string;
    createdAt: string;
}
// view details product blinds by id
export interface BlindsColor {
    id: string;
    productId: string;
    name: string;
    imageUrl: string;
    createdAt: string;
}

export interface NewArrivalProductColor {
    name: string
    imageUrl: string
}

export interface NewArrivalProductImage {
    imageUrl: string
}

export interface NewArrivalProduct {
    id: string
    productCode: string
    name: string
    type: string
    composition: string
    fabricWidth: string
    packing: string
    thickness: string
    status: string
    unitPrice: number
    collection: string
    createdAt: string
    colors: NewArrivalProductColor[]
    images: NewArrivalProductImage[]
}

export interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
}

/**
 * Main API response type for fetching all New Arrival blinds products
 */
export interface GetAllNewArrivalProductBlinds {
    success: boolean
    blinds: NewArrivalProduct[]
    pagination: Pagination
}

export interface BestSellerProductColor {
    name: string
    imageUrl: string
}

export interface BestSellerProductImage {
    imageUrl: string
}

export interface BestSellerProduct {
    id: string
    productCode: string
    name: string
    type: string
    composition: string
    fabricWidth: string
    packing: string
    thickness: string
    status: string
    unitPrice: number
    collection: string
    createdAt: string
    colors: BestSellerProductColor[]
    images: BestSellerProductImage[]
}

export interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
}

/**
 * Main API response type for fetching all Best Seller blinds products
 */
export interface GetAllBestSellerProductBlinds {
    success: boolean
    blinds: BestSellerProduct[]
    pagination: Pagination
}