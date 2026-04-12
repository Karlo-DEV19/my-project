import axios from "axios"

const PAYMONGO_API_URL = "https://api.paymongo.com/v1"
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY ?? ""

function getAuthHeader(): string {
    if (!PAYMONGO_SECRET_KEY) {
        throw new Error("PAYMONGO_SECRET_KEY is not configured")
    }
    return `Basic ${Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString("base64")}`
}

function getFrontendUrl(): string {
    const url = process.env.NEXT_PUBLIC_API_URL
    if (!url) throw new Error("NEXT_PUBLIC_API_URL is not configured")
    return url.replace(/\/$/, "")
}

// ==================== TYPES ====================

export interface PaymentLineItem {
    name: string
    /** Number of units. PayMongo receipt shows: amount × quantity */
    quantity: number
    /** Per-unit price in PHP (VAT-inclusive downpayment share) */
    amount: number
    /** Absolute URL to product image. Must be https:// for PayMongo to display it. */
    imageUrl?: string | null
}

export interface PaymentSessionData {
    orderId: string
    trackingNumber: string
    referenceNumber: string
    customerFirstName: string
    customerLastName: string
    customerEmail: string
    customerPhone: string
    customerPhoneSecondary?: string
    /** Grand total charged to the customer for this session (PHP) — downpayment only */
    amount: number
    orderType: "delivery" | "pickup"
    items: PaymentLineItem[]
    paymentMethod: "gcash" | "paymaya"
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

function toSafeNumber(value: unknown, fallback = 0): number {
    const n = Number(value)
    return isNaN(n) || !isFinite(n) ? fallback : n
}

/** PHP → centavos, rounded. Prevents floating-point drift. */
function toCentavos(php: number): number {
    return Math.round(toSafeNumber(php) * 100)
}

function normalizePhone(phone: string): string {
    if (phone.startsWith("+63")) return "0" + phone.substring(3)
    if (phone.startsWith("63") && phone.length >= 12) return "0" + phone.substring(2)
    return phone
}

function mapPaymentMethod(method: "gcash" | "paymaya"): string[] {
    return method === "paymaya" ? ["paymaya"] : ["gcash"]
}

/**
 * Returns a valid absolute https:// URL or undefined.
 * PayMongo silently ignores images that are relative paths or HTTP.
 */
function resolveImageUrl(imageUrl: string | null | undefined): string | undefined {
    if (!imageUrl) return undefined
    // Already absolute https
    if (imageUrl.startsWith("https://")) return imageUrl
    // Relative path — prefix with frontend URL
    if (imageUrl.startsWith("/")) {
        const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""
        if (base.startsWith("https://")) return `${base}${imageUrl}`
    }
    return undefined
}

// ==================== VALIDATION ====================

function validatePaymentSessionData(data: PaymentSessionData): string[] {
    const errors: string[] = []

    if (!data.orderId) errors.push("orderId is required")
    if (!data.trackingNumber) errors.push("trackingNumber is required")
    if (!data.referenceNumber) errors.push("referenceNumber is required")
    if (!data.customerFirstName?.trim()) errors.push("customerFirstName is required")
    if (!data.customerLastName?.trim()) errors.push("customerLastName is required")
    if (!data.customerEmail?.trim()) errors.push("customerEmail is required")
    if (!data.customerPhone?.trim() || data.customerPhone.trim().length < 10)
        errors.push("Valid customerPhone is required (min 10 chars)")
    if (!data.items?.length) errors.push("At least one item is required")
    if (!["gcash", "paymaya"].includes(data.paymentMethod))
        errors.push("paymentMethod must be gcash or paymaya")

    const amount = toSafeNumber(data.amount)
    if (amount <= 0) errors.push("amount must be greater than 0")

    // Verify sum(amount × quantity) ≈ total (allow ₱1 rounding tolerance)
    const lineSum = data.items.reduce(
        (sum, i) => sum + toSafeNumber(i.amount) * toSafeNumber(i.quantity, 1),
        0
    )
    if (Math.abs(lineSum - amount) > 1.0) {
        errors.push(
            `Line items total (₱${lineSum.toFixed(2)}) does not match amount (₱${amount.toFixed(2)})`
        )
    }

    return errors
}

// ==================== CREATE PAYMENT SESSION ====================

export async function createOrderPaymentSession(
    paymentData: PaymentSessionData
): Promise<PaymentSessionResult> {
    const validationErrors = validatePaymentSessionData(paymentData)
    if (validationErrors.length > 0) {
        return {
            success: false,
            paymentIntentId: null,
            sessionId: null,
            checkoutUrl: null,
            referenceNumber: paymentData.referenceNumber,
            expiresAt: null,
            error: `Validation failed: ${validationErrors.join(", ")}`,
        }
    }

    let frontendUrl: string
    try {
        frontendUrl = getFrontendUrl()
    } catch (err: any) {
        return {
            success: false,
            paymentIntentId: null,
            sessionId: null,
            checkoutUrl: null,
            referenceNumber: paymentData.referenceNumber,
            expiresAt: null,
            error: err.message,
        }
    }

    try {
        const currency = "PHP"
        const fullName = `${paymentData.customerFirstName} ${paymentData.customerLastName}`.trim()
        const formattedPhone = normalizePhone(paymentData.customerPhone)
        const paymentMethodTypes = mapPaymentMethod(paymentData.paymentMethod)

        // Build line items — one entry per product, no separate VAT line.
        // amount is per-unit (VAT-inclusive downpayment share), quantity is the unit count.
        // PayMongo receipt displays: name  ×qty  ₱(amount × qty)
        const lineItems = paymentData.items.map((item) => {
            const entry: Record<string, any> = {
                name: item.name,
                amount: toCentavos(item.amount),   // per-unit centavos
                currency,
                quantity: item.quantity,
            }

            const resolvedImage = resolveImageUrl(item.imageUrl)
            if (resolvedImage) {
                entry.images = [resolvedImage]
            }

            return entry
        })

        const orderTypeLabel =
            paymentData.orderType.charAt(0).toUpperCase() + paymentData.orderType.slice(1)

        const metadata: Record<string, string> = {
            order_id: paymentData.orderId,
            tracking_number: paymentData.trackingNumber,
            reference_number: paymentData.referenceNumber,
            order_type: paymentData.orderType,
            customer_name: fullName,
            customer_email: paymentData.customerEmail,
            customer_phone: formattedPhone,
            payment_method: paymentData.paymentMethod,
            total_amount: toSafeNumber(paymentData.amount).toFixed(2),
            ...paymentData.metadata,
        }

        const successUrl = `${frontendUrl}/shop/checkout/success?tracking=${encodeURIComponent(paymentData.trackingNumber)}&reference=${encodeURIComponent(paymentData.referenceNumber)}`
        const cancelUrl = `${frontendUrl}/shop/checkout/cancelled?tracking=${encodeURIComponent(paymentData.trackingNumber)}&reference=${encodeURIComponent(paymentData.referenceNumber)}`

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
                            // payment_intent metadata is the primary source read by the webhook handler
                            metadata,
                        },
                        success_url: successUrl,
                        cancel_url: cancelUrl,
                        reference_number: paymentData.referenceNumber,
                        description: `Order ${paymentData.trackingNumber} - ${fullName}`,
                        billing: {
                            name: fullName,
                            email: paymentData.customerEmail,
                            phone: formattedPhone,
                        },
                        // Secondary metadata source on the session itself
                        metadata,
                    },
                },
            },
            {
                headers: {
                    Authorization: getAuthHeader(),
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    // Prevents duplicate sessions on network retry
                    "Idempotency-Key": `checkout-${paymentData.orderId}`,
                },
                timeout: 30_000,
            }
        )

        const session = response.data.data
        const sessionAttrs = session.attributes
        const paymentIntent = sessionAttrs.payment_intent

        return {
            success: true,
            paymentIntentId: paymentIntent?.id ?? null,
            sessionId: session.id,
            checkoutUrl: sessionAttrs.checkout_url,
            referenceNumber: paymentData.referenceNumber,
            expiresAt: sessionAttrs.expires_at
                ? new Date(sessionAttrs.expires_at * 1000)
                : null,
        }
    } catch (error: any) {
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
    const response = await axios.get(
        `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`,
        {
            headers: { Authorization: getAuthHeader(), Accept: "application/json" },
            timeout: 15_000,
        }
    )

    const attrs = response.data.data.attributes
    return {
        status: attrs.status,
        amount: toSafeNumber(attrs.amount) / 100,
        paidAt: attrs.paid_at ?? null,
        paymentMethod: attrs.payments?.[0]?.attributes?.source?.type ?? null,
        metadata: attrs.metadata ?? {},
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
    const response = await axios.get(
        `${PAYMONGO_API_URL}/checkout_sessions/${sessionId}`,
        {
            headers: { Authorization: getAuthHeader(), Accept: "application/json" },
            timeout: 15_000,
        }
    )

    const attrs = response.data.data.attributes
    const paymentIntent = attrs.payment_intent

    return {
        status: attrs.status,
        paymentIntentId: paymentIntent?.id ?? null,
        paymentStatus: paymentIntent?.attributes?.status ?? null,
        amount: (attrs.line_items ?? []).reduce(
            (sum: number, item: any) =>
                sum + (toSafeNumber(item.amount) * toSafeNumber(item.quantity, 1)) / 100,
            0
        ),
        metadata: attrs.metadata ?? {},
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
                timeout: 15_000,
            }
        )
        return true
    } catch {
        return false
    }
}