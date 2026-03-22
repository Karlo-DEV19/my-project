import { useMutation } from "@tanstack/react-query"
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