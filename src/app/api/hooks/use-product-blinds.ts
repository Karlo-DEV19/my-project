// src/lib/hooks/useCreateNewBlinds.ts
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosApiClient } from "../axiosApiClient";
import { BestSellerProduct, BlindsProduct, BlindsProductDetailResponse, CreateBlindsResponse, EditProductPayload, GetAllBestSellerProductBlinds, GetAllNewArrivalProductBlinds, GetBlindsProductsResponse, NewArrivalProduct } from "@/lib/types/product-blinds-type";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpdateBlindsParams {
    id: string;
    payload: EditProductPayload;
}

interface UpdateBlindsResponse {
    success: boolean;
    message: string;
    data: {
        id: string;
        productCode: string;
        name: string;
        description: string | null;
        type: string | null;
        collection: string;
        status: string;
        composition: string | null;
        fabricWidth: string | null;
        thickness: string | null;
        packing: string | null;
        characteristic: string | null;
        unitPrice: number;
        createdAt: string;
        updatedAt: string;
        images: {
            id: string;
            productId: string;
            imageUrl: string;
            createdAt: string;
        }[];
        colors: {
            id: string;
            productId: string;
            name: string;
            imageUrl: string;
            createdAt: string;
        }[];
    };
}

// ─── API Request ──────────────────────────────────────────────────────────────

const updateBlindsRequest = async ({
    id,
    payload,
}: UpdateBlindsParams): Promise<UpdateBlindsResponse> => {
    console.log("id", id);
    console.log("payload", payload);
    const { data } = await axiosApiClient.put<UpdateBlindsResponse>(
        `/product-blinds/${id}/update`,
        payload
    );
    return data;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useUpdateBlindsById = () => {
    const queryClient = useQueryClient();

    // ✅ Fixed: added the missing < generic bracket
    const mutation = useMutation<UpdateBlindsResponse, Error, UpdateBlindsParams>(
        {
            mutationFn: updateBlindsRequest,
            onSuccess: (data, variables) => {
                queryClient.invalidateQueries({ queryKey: ["blindsProducts"] });
                queryClient.invalidateQueries({
                    queryKey: ["blinds-product", variables.id],
                });
                queryClient.setQueryData(["blinds-product", variables.id], data.data);
            },
            onError: (error) => {
                console.error("[useUpdateBlindsById] Error:", error);
            },
        }
    );

    return {
        updateBlinds: mutation.mutate,
        updateBlindsAsync: mutation.mutateAsync,
        isUpdating: mutation.isPending,
        isSuccess: mutation.isSuccess,
        isError: mutation.isError,
        error: mutation.error,
        data: mutation.data,
        reset: mutation.reset,
    };
};

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
        queryKey: ["blindsProduct", productId],
        queryFn: async (): Promise<BlindsProductDetailResponse> => {
            // Replace `axiosApiClient` with your actual configured axios instance
            const { data } = await axiosApiClient.get<BlindsProductDetailResponse>(
                `/product-blinds/${productId}`
            );
            return data;
        },
        enabled: !!productId && productId !== "null" && productId !== "undefined",
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,   // 10 minutes
        retry: (failureCount, error: any) => {
            if (error?.response?.status === 404) return false;
            return failureCount < 2;
        }
    });

    return {
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

// -------------------- Delete Hook --------------------
export function useDeleteBlinds() {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        { success: boolean; message: string },
        Error,
        { productId: string; userId?: string }
    >({
        mutationFn: async ({ productId, userId }) => {
            const params = userId ? `?userId=${encodeURIComponent(userId)}` : "";
            const { data } = await axiosApiClient.delete(`/product-blinds/${productId}${params}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blindsProducts"] });
        },
        onError: (error) => {
            console.error("[useDeleteBlinds] Error:", error);
        },
    });

    return {
        deleteBlinds: mutation.mutateAsync,
        isDeleting: mutation.isPending,
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