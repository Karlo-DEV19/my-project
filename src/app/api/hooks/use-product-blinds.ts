// src/lib/hooks/useCreateNewBlinds.ts
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosApiClient } from "../axiosApiClient";
import { BestSellerProduct, BlindsProduct, BlindsProductDetailResponse, CreateBlindsResponse, GetAllBestSellerProductBlinds, GetAllNewArrivalProductBlinds, GetBlindsProductsResponse, NewArrivalProduct } from "@/lib/types/product-blinds-type";


export function useCreateNewBlinds() {
    const queryClient = useQueryClient();

    // 1️⃣ API Request Function
    const createNewBlinds = async (data: any): Promise<CreateBlindsResponse> => {
        const response = await axiosApiClient.post<CreateBlindsResponse>(
            "/product-blinds",
            data
        );
        console.log(response);
        return response.data;
    };

    // 2️⃣ Mutation Hook
    const mutation = useMutation({
        mutationFn: createNewBlinds,
        onSuccess: () => {
            // Refresh blinds products list after creating a new one
            queryClient.invalidateQueries({ queryKey: ["blindsProducts"] });
        },
        onError: (error) => {
            console.error("Create Blinds Product Error:", error);
        },
    });

    // 3️⃣ Return Hook Object
    return {
        createNewBlinds: mutation.mutateAsync,
        isPending: mutation.isPending,
        isError: mutation.isError,
        error: mutation.error,
        isSuccess: mutation.isSuccess,
    };
}

// =========================
// GET BLINDS PRODUCTS
// =========================
interface UseGetBlindsProductsProps {
    page?: number;
    limit?: number;
    search?: string;
    status?: string | null;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export function useGetBlindsProducts({
    page = 1,
    limit = 10,
    search = "",
    status = null,
    sortBy = "createdAt",
    sortOrder = "desc",
}: UseGetBlindsProductsProps = {}) {
    const query = useQuery({
        queryKey: ["blindsProducts", { page, limit, search, status, sortBy, sortOrder }],
        queryFn: async (): Promise<GetBlindsProductsResponse> => {
            const { data } = await axiosApiClient.get<GetBlindsProductsResponse>(
                "/product-blinds",
                {
                    params: { page, limit, search, status, sortBy, sortOrder },
                }
            );
            return data;
        },
        placeholderData: keepPreviousData,
    });

    return {
        // Ensuring type safety for the component
        blinds: (query.data?.blinds ?? []) as BlindsProduct[],
        pagination: query.data?.pagination,
        filters: query.data?.filters,
        ...query,
    };
}


export function useGetBlindsDetailsByProductId(productId: string | undefined | null) {
    const query = useQuery({
        // The productId in the key ensures data is cached specifically for this record
        queryKey: ["blindsProduct", productId],

        queryFn: async (): Promise<BlindsProductDetailResponse> => {
            const { data } = await axiosApiClient.get<BlindsProductDetailResponse>(
                `/product-blinds/${productId}`
            );
            return data;
        },

        // Optimization: Prevent the query from running if the ID is invalid
        enabled: !!productId && productId !== "" && productId !== "null" && productId !== "undefined",

        // Cache Management
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 10 * 60 * 1000,    // Keep unused data in memory for 10 minutes

        // Error resilience
        retry: (failureCount, error: any) => {
            // Don't retry if the product simply doesn't exist (404)
            if (error?.response?.status === 404) return false;
            return failureCount < 2;
        }
    });

    return {
        // Safe access to the nested data
        product: query.data?.data,
        ...query,
    };
}


interface UseGetBlindsProductsProps {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    keepPreviousData?: any; // optional placeholder data
}

// -------------------- New Arrival Hook --------------------
export function useGetAllNewArrival({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "createdAt",
    sortOrder = "desc",
    keepPreviousData,
}: UseGetBlindsProductsProps = {}) {
    const query = useQuery({
        queryKey: ["newArrivalBlinds", { page, limit, search, sortBy, sortOrder }],
        queryFn: async (): Promise<GetAllNewArrivalProductBlinds> => {
            const { data } = await axiosApiClient.get<GetAllNewArrivalProductBlinds>(
                "/product-blinds/new-arrival",
                { params: { page, limit, search, sortBy, sortOrder } }
            );
            return data;
        },
        placeholderData: keepPreviousData,
    });

    return {
        blinds: query.data?.blinds ?? ([] as NewArrivalProduct[]),
        pagination: query.data?.pagination,
        ...query,
    };
}

// -------------------- Best Seller Hook --------------------
export function useGetAllBestSeller({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "createdAt",
    sortOrder = "desc",
    keepPreviousData,
}: UseGetBlindsProductsProps = {}) {
    const query = useQuery({
        queryKey: ["bestSellerBlinds", { page, limit, search, sortBy, sortOrder }],
        queryFn: async (): Promise<GetAllBestSellerProductBlinds> => {
            const { data } = await axiosApiClient.get<GetAllBestSellerProductBlinds>(
                "/product-blinds/best-seller",
                { params: { page, limit, search, sortBy, sortOrder } }
            );
            return data;
        },
        placeholderData: keepPreviousData,
    });

    return {
        blinds: query.data?.blinds ?? ([] as BestSellerProduct[]),
        pagination: query.data?.pagination,
        ...query,
    };
}