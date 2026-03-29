import { useMutation, useQuery } from "@tanstack/react-query"
import { axiosApiClient } from "../axiosApiClient"

export interface CheckoutOrderAddress {
    unitFloor?: string
    street: string
    barangay: string
    city: string
    province: string
    zipCode: string
}

export interface CheckoutOrderCoordinates {
    lat: number
    lng: number
    formattedAddress: string
}

export interface CheckoutOrderItem {
    productId: string
    colorId?: string
    quantity: number
}

export type PaymentMethodType = "gcash" | "paymaya"

export interface CheckoutOrderPayload {
    firstName: string
    lastName: string
    email: string
    phone: string
    phoneSecondary?: string
    paymentMethod: PaymentMethodType
    agreeTerms: true
    deliveryNotes?: string
    address: CheckoutOrderAddress
    coordinates: CheckoutOrderCoordinates
    items: CheckoutOrderItem[]
    // Cart totals computed client-side — must match what PayMongo charges
    subtotal: number
    vat: number
    totalAmount: number
}

export interface CheckoutOrderSummary {
    subtotal: number
    vat: number
    totalAmount: number
    itemCount: number
}

export interface CheckoutOrderResponseData {
    orderId: string
    trackingNumber: string
    referenceNumber: string
    checkoutUrl: string
    sessionId: string | null
    expiresAt: string | null
    summary: CheckoutOrderSummary
}

export interface CheckoutOrderResponse {
    success: boolean
    message: string
    data: CheckoutOrderResponseData
}

// ── GET ORDER DETAILS STATUS ─────────────────────────────────────────

export interface OrderDetails {
    id: string
    trackingNumber: string
    referenceNumber: string
    status: string
    paymentStatus: string
    paymentMethod: string
    orderType: string
    subtotal: string
    vat: string
    deliveryFee: string
    totalAmount: string
    confirmedAt: string | null
    cancelledAt: string | null
    cancellationReason: string | null
    createdAt: string
    updatedAt: string
}

export interface OrderPaymentDetails {
    status: string
    paymentMethod: string
    amountPaid: string
    vat: string
    netAmount: string
    paidAt: string | null
    expiresAt: string | null
}

export interface GetOrderDetailsStatusResponse {
    success: boolean
    data: {
        order: OrderDetails
        payment: OrderPaymentDetails | null
    }
}

// ── GET ALL ORDERS ───────────────────────────────────────────────────

export interface OrderSummaryPayment {
    orderId: string
    status: string
    amountPaid: string | null
    paidAt: string | null
}

export interface OrderSummary {
    id: string
    trackingNumber: string
    referenceNumber: string
    status: string
    paymentStatus: string
    paymentMethod: string
    orderType: string
    customerFirstName: string
    customerLastName: string
    customerEmail: string
    customerPhone: string
    totalAmount: string
    createdAt: string
    updatedAt: string
    payment: OrderSummaryPayment | null
}

export interface PaginationDetails {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
}

export interface GetAllOrdersResponse {
    success: boolean
    data: OrderSummary[]
    pagination: PaginationDetails
}

const checkoutOrderRequest = async (
    payload: CheckoutOrderPayload
): Promise<CheckoutOrderResponse> => {
    try {
        console.log("[checkoutOrderRequest] Payload:", payload)
        const response = await axiosApiClient.post<CheckoutOrderResponse>(
            "/orders/checkout",
            payload
        )
        console.log("[checkoutOrderRequest] Response:", response.data)
        return response.data
    } catch (error: any) {
        console.error("[checkoutOrderRequest] Error:", error)
        if (error.response) {
            console.error("[checkoutOrderRequest] Status:", error.response.status)
            console.error("[checkoutOrderRequest] Data:", error.response.data)
        }
        throw error
    }
}

export const useCheckoutOrder = () => {
    const mutation = useMutation<CheckoutOrderResponse, Error, CheckoutOrderPayload>({
        mutationFn: checkoutOrderRequest,
    })

    return {
        checkoutOrder: mutation.mutate,
        checkoutOrderAsync: mutation.mutateAsync,
        isPending: mutation.isPending,
        isSuccess: mutation.isSuccess,
        isError: mutation.isError,
        error: mutation.error,
        data: mutation.data,
    }
}

export const useGetOrderDetailsStatus = (referenceNumber: string) => {
    const getOrderDetailsStatus = async (): Promise<GetOrderDetailsStatusResponse> => {
        const response = await axiosApiClient.get<GetOrderDetailsStatusResponse>(
            "/orders/get-order-details-status",
            {
                params: {
                    referenceNumber: referenceNumber,
                },
            }
        )
        return response.data
    }

    const query = useQuery({
        queryKey: ["order-details-status", referenceNumber],
        queryFn: getOrderDetailsStatus,
        enabled: !!referenceNumber,
    })

    return {
        isPending: query.isPending,
        isSuccess: query.isSuccess,
        isError: query.isError,
        error: query.error,
        data: query.data,
        refetch: query.refetch,
    }
}

interface GetAllOrdersFilters {
    page?: number
    limit?: number
    search?: string
    status?: string
}

export const useGetAllOrders = (filters: GetAllOrdersFilters = {}) => {
    const getAllOrders = async (): Promise<GetAllOrdersResponse> => {
        const response = await axiosApiClient.get<GetAllOrdersResponse>(
            "/orders/get-all-orders",
            {
                params: filters,
            }
        )
        return response.data
    }

    const query = useQuery({
        queryKey: ["all-orders", filters],
        queryFn: getAllOrders,
    })

    return {
        getAllOrders: query.refetch,
        isPending: query.isPending,
        isSuccess: query.isSuccess,
        isError: query.isError,
        error: query.error,
        data: query.data,
    }
}