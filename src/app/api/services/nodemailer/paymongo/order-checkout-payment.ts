import axios from "axios"

const PAYMONGO_API_URL = "https://api.paymongo.com/v1"
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || ""

const getAuthHeader = (): string => {
    if (!PAYMONGO_SECRET_KEY) {
        throw new Error("PAYMONGO_SECRET_KEY is not configured")
    }
    return `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ":").toString("base64")}`
}

// ==================== TYPES ====================

export interface PaymentLineItem {
    name: string
    quantity: number
    price: number // in PHP (not centavos)
}

export interface PaymentSessionData {
    orderId: string
    trackingNumber: string
    referenceNumber: string

    // Customer — split fields to match checkout payload
    customerFirstName: string
    customerLastName: string
    customerEmail: string
    customerPhone: string
    customerPhoneSecondary?: string

    // Financials
    amount: number       // total (subtotal + deliveryFee + processingFee)
    subtotal: number
    deliveryFee: number
    processingFee: number

    orderType: "delivery" | "pickup"
    items: PaymentLineItem[]
    paymentMethod: "gcash" | "paymaya"

    // Extra metadata to forward to PayMongo
    metadata?: Record<string, string>
}

export interface PaymentSessionResult {
    success: boolean
    paymentIntentId: string | null
    sessionId: string | null
    checkoutUrl: string | null
    referenceNumber: string
    expiresAt: Date | null
    error?: string
}

export interface PaymentVerificationResult {
    status: string
    amount: number
    paidAt: string | null
    paymentMethod: string | null
    metadata?: Record<string, any>
}

// ==================== HELPERS ====================

function mapPaymentMethod(paymentMethod: string): string[] {
    const map: Record<string, string[]> = {
        gcash: ["gcash"],
        paymaya: ["paymaya"],
    }
    return map[paymentMethod.toLowerCase()] ?? ["gcash"]
}

function buildLineItems(
    items: PaymentLineItem[],
    deliveryFee: number,
    processingFee: number,
    orderType: string,
    currency: string
) {
    const lineItems = items.map((item) => ({
        name: item.name,
        amount: Math.round(item.price * 100),
        currency,
        quantity: item.quantity,
    }))

    if (deliveryFee > 0 && orderType === "delivery") {
        lineItems.push({ name: "Delivery Fee", amount: Math.round(deliveryFee * 100), currency, quantity: 1 })
    }

    if (processingFee > 0) {
        lineItems.push({ name: "Processing Fee", amount: Math.round(processingFee * 100), currency, quantity: 1 })
    }

    return lineItems
}

function validatePaymentSessionData(data: PaymentSessionData): string[] {
    const errors: string[] = []
    if (!data.orderId) errors.push("orderId is required")
    if (!data.trackingNumber) errors.push("trackingNumber is required")
    if (!data.customerFirstName?.trim()) errors.push("customerFirstName is required")
    if (!data.customerLastName?.trim()) errors.push("customerLastName is required")
    if (!data.customerEmail?.trim()) errors.push("customerEmail is required")
    if (!data.customerPhone || data.customerPhone.trim().length < 10) errors.push("Valid customerPhone is required")
    if (!data.amount || data.amount <= 0) errors.push("amount must be greater than 0")
    if (!data.items?.length) errors.push("At least one item is required")
    if (!["gcash", "paymaya"].includes(data.paymentMethod)) errors.push("paymentMethod must be gcash or paymaya")
    return errors
}

// ==================== CREATE PAYMENT SESSION ====================

export async function createOrderPaymentSession(
    paymentData: PaymentSessionData
): Promise<PaymentSessionResult> {
    try {
        console.log("=== PayMongo: Creating Checkout Session ===")
        console.log("Order ID:", paymentData.orderId)
        console.log("Tracking:", paymentData.trackingNumber)
        console.log("Method:", paymentData.paymentMethod)
        console.log("Total:", paymentData.amount)

        const errors = validatePaymentSessionData(paymentData)
        if (errors.length > 0) {
            return {
                success: false,
                paymentIntentId: null,
                sessionId: null,
                checkoutUrl: null,
                referenceNumber: paymentData.referenceNumber,
                expiresAt: null,
                error: `Validation failed: ${errors.join(", ")}`,
            }
        }

        const currency = "PHP"
        const frontendUrl = process.env.FRONTEND_URL
        const fullName = `${paymentData.customerFirstName} ${paymentData.customerLastName}`.trim()
        const paymentMethodTypes = mapPaymentMethod(paymentData.paymentMethod)
        const lineItems = buildLineItems(
            paymentData.items,
            paymentData.deliveryFee,
            paymentData.processingFee,
            paymentData.orderType,
            currency
        )

        const metadata: Record<string, string> = {
            order_id: paymentData.orderId,
            tracking_number: paymentData.trackingNumber,
            reference_number: paymentData.referenceNumber,
            order_type: paymentData.orderType,
            customer_name: fullName,
            customer_email: paymentData.customerEmail,
            customer_phone: paymentData.customerPhone,
            payment_method: paymentData.paymentMethod,
            subtotal: paymentData.subtotal.toString(),
            delivery_fee: paymentData.deliveryFee.toString(),
            processing_fee: paymentData.processingFee.toString(),
            total_amount: paymentData.amount.toString(),
            ...paymentData.metadata,
        }

        const orderTypeLabel =
            paymentData.orderType.charAt(0).toUpperCase() + paymentData.orderType.slice(1)

        const response = await axios.post(
            `${PAYMONGO_API_URL}/checkout_sessions`,
            {
                data: {
                    attributes: {
                        payment_method_types: paymentMethodTypes,
                        line_items: lineItems,
                        payment_intent_data: {
                            capture_type: "automatic",
                            description: `Order ${paymentData.trackingNumber} - ${orderTypeLabel}`,
                            metadata,
                        },
                        success_url: `${frontendUrl}/orders/success?tracking=${paymentData.trackingNumber}&reference=${paymentData.referenceNumber}`,
                        cancel_url: `${frontendUrl}/orders/cancelled?tracking=${paymentData.trackingNumber}&reference=${paymentData.referenceNumber}`,
                        reference_number: paymentData.referenceNumber,
                        description: `Order ${paymentData.trackingNumber} - ${fullName}`,
                        billing: {
                            name: fullName,
                            email: paymentData.customerEmail,
                            phone: paymentData.customerPhone,
                        },
                        metadata,
                    },
                },
            },
            {
                headers: {
                    Authorization: getAuthHeader(),
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                timeout: 30000,
            }
        )

        const session = response.data.data
        const sessionAttrs = session.attributes
        const paymentIntent = sessionAttrs.payment_intent

        console.log("✅ Session created:", session.id)
        console.log("Checkout URL:", sessionAttrs.checkout_url)

        return {
            success: true,
            paymentIntentId: paymentIntent?.id ?? null,
            sessionId: session.id,
            checkoutUrl: sessionAttrs.checkout_url,
            referenceNumber: paymentData.referenceNumber,
            expiresAt: sessionAttrs.expires_at ? new Date(sessionAttrs.expires_at * 1000) : null,
        }
    } catch (error: any) {
        console.error("=== PayMongo: Session Creation Error ===")
        if (error.response) {
            console.error("Status:", error.response.status)
            console.error("Data:", JSON.stringify(error.response.data, null, 2))
        } else {
            console.error("Error:", error.message)
        }

        if (error.code === "ECONNABORTED") {
            return {
                success: false,
                paymentIntentId: null,
                sessionId: null,
                checkoutUrl: null,
                referenceNumber: paymentData.referenceNumber,
                expiresAt: null,
                error: "Payment service timeout. Please try again.",
            }
        }

        return {
            success: false,
            paymentIntentId: null,
            sessionId: null,
            checkoutUrl: null,
            referenceNumber: paymentData.referenceNumber,
            expiresAt: null,
            error:
                error.response?.data?.errors?.[0]?.detail ??
                error.response?.data?.message ??
                error.message ??
                "Failed to create payment session",
        }
    }
}

// ==================== VERIFY PAYMENT INTENT ====================

export async function verifyPaymentIntent(
    paymentIntentId: string
): Promise<PaymentVerificationResult> {
    try {
        const response = await axios.get(
            `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`,
            {
                headers: { Authorization: getAuthHeader(), Accept: "application/json" },
                timeout: 15000,
            }
        )
        const attrs = response.data.data.attributes
        return {
            status: attrs.status,
            amount: attrs.amount / 100,
            paidAt: attrs.paid_at ?? null,
            paymentMethod: attrs.payments?.[0]?.attributes?.source?.type ?? null,
            metadata: attrs.metadata ?? {},
        }
    } catch (error: any) {
        throw new Error(
            error.response?.data?.errors?.[0]?.detail ?? "Failed to verify payment status"
        )
    }
}

// ==================== GET CHECKOUT SESSION ====================

export async function getCheckoutSessionDetails(sessionId: string): Promise<{
    status: string
    paymentIntentId: string | null
    paymentStatus: string | null
    amount: number
    metadata: Record<string, any>
}> {
    try {
        const response = await axios.get(
            `${PAYMONGO_API_URL}/checkout_sessions/${sessionId}`,
            {
                headers: { Authorization: getAuthHeader(), Accept: "application/json" },
                timeout: 15000,
            }
        )
        const attrs = response.data.data.attributes
        const paymentIntent = attrs.payment_intent
        return {
            status: attrs.status,
            paymentIntentId: paymentIntent?.id ?? null,
            paymentStatus: paymentIntent?.attributes?.status ?? null,
            amount: (attrs.line_items ?? []).reduce(
                (sum: number, item: any) => sum + (item.amount * item.quantity) / 100,
                0
            ),
            metadata: attrs.metadata ?? {},
        }
    } catch (error: any) {
        throw new Error(
            error.response?.data?.errors?.[0]?.detail ?? "Failed to retrieve checkout session"
        )
    }
}

// ==================== EXPIRE CHECKOUT SESSION ====================

export async function expireCheckoutSession(sessionId: string): Promise<boolean> {
    try {
        await axios.post(
            `${PAYMONGO_API_URL}/checkout_sessions/${sessionId}/expire`,
            {},
            {
                headers: { Authorization: getAuthHeader(), Accept: "application/json" },
                timeout: 15000,
            }
        )
        return true
    } catch {
        return false
    }
}