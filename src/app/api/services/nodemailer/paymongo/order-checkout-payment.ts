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
    // amount = the full line price in PHP (already includes panels, sq ft calc, etc.)
    // PayMongo will display: amount × quantity on the receipt
    // Since we already computed the total per set, quantity should always be 1 here
    amount: number
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
    // These three must match exactly: amount = subtotal + vat
    amount: number      // grand total charged to customer
    subtotal: number    // sum of all line totals before VAT
    vat: number         // 12% of subtotal
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

function getFrontendUrl(): string {
    const url = process.env.NEXT_PUBLIC_API_URL
    if (!url) {
        throw new Error(
            "NEXT_PUBLIC_API_URL is not configured. Add NEXT_PUBLIC_API_URL=https://yourdomain.com to your .env file."
        )
    }
    return url.replace(/\/$/, "")
}

function mapPaymentMethod(paymentMethod: "gcash" | "paymaya"): string[] {
    return { gcash: ["gcash"], paymaya: ["paymaya"] }[paymentMethod] ?? ["gcash"]
}

function buildLineItems(
    items: PaymentLineItem[],
    vat: number,
    currency: string
) {
    // Each item.amount is already the full line total in PHP (priceBreakdown.total × quantity)
    // quantity is always 1 because the total is already computed
    // PayMongo receipt shows: item.name  ×1  ₱item.amount
    const lineItems = items.map((item) => ({
        name: item.name,
        amount: Math.round(item.amount * 100), // PHP → centavos
        currency,
        quantity: 1,                            // always 1 — full price already in amount
    }))

    // VAT as a separate line so the PayMongo receipt shows it clearly
    if (vat > 0) {
        lineItems.push({
            name: "VAT (12%)",
            amount: Math.round(vat * 100),
            currency,
            quantity: 1,
        })
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
    if (!data.customerPhone?.trim() || data.customerPhone.trim().length < 10)
        errors.push("Valid customerPhone is required")
    if (!data.amount || data.amount <= 0) errors.push("amount must be greater than 0")
    if (!data.items?.length) errors.push("At least one item is required")
    if (!["gcash", "paymaya"].includes(data.paymentMethod))
        errors.push("paymentMethod must be gcash or paymaya")

    // Sanity check: line items + vat should equal the total amount
    const lineSum = data.items.reduce((sum, i) => sum + i.amount, 0)
    const expectedTotal = lineSum + data.vat
    const diff = Math.abs(expectedTotal - data.amount)
    if (diff > 0.02) {
        errors.push(
            `Amount mismatch: items(${lineSum.toFixed(2)}) + vat(${data.vat.toFixed(2)}) = ${expectedTotal.toFixed(2)}, but amount=${data.amount.toFixed(2)}`
        )
    }

    return errors
}

// ==================== CREATE PAYMENT SESSION ====================

export async function createOrderPaymentSession(
    paymentData: PaymentSessionData
): Promise<PaymentSessionResult> {
    try {
        console.log("=== PayMongo: Creating Checkout Session ===")
        console.log("Order ID:  ", paymentData.orderId)
        console.log("Tracking:  ", paymentData.trackingNumber)
        console.log("Method:    ", paymentData.paymentMethod)
        console.log("Subtotal:  ₱", paymentData.subtotal.toFixed(2))
        console.log("VAT (12%): ₱", paymentData.vat.toFixed(2))
        console.log("Total:     ₱", paymentData.amount.toFixed(2))
        console.log("Line items:")
        paymentData.items.forEach((i) =>
            console.log(`  - ${i.name}: ₱${i.amount.toFixed(2)}`)
        )

        const errors = validatePaymentSessionData(paymentData)
        if (errors.length > 0) {
            console.error("❌ Validation errors:", errors)
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

        // Resolve NEXT_PUBLIC_API_URL before calling PayMongo — fail fast
        let frontendUrl: string
        try {
            frontendUrl = getFrontendUrl()
        } catch (envError: any) {
            console.error("❌ NEXT_PUBLIC_API_URL not configured:", envError.message)
            return {
                success: false,
                paymentIntentId: null,
                sessionId: null,
                checkoutUrl: null,
                referenceNumber: paymentData.referenceNumber,
                expiresAt: null,
                error: envError.message,
            }
        }

        const currency = "PHP"
        const fullName = `${paymentData.customerFirstName} ${paymentData.customerLastName}`.trim()
        const paymentMethodTypes = mapPaymentMethod(paymentData.paymentMethod)
        const lineItems = buildLineItems(paymentData.items, paymentData.vat, currency)

        let formattedPhone = paymentData.customerPhone
        if (formattedPhone.startsWith("+63")) {
            formattedPhone = "0" + formattedPhone.substring(3)
        } else if (formattedPhone.startsWith("63")) {
            formattedPhone = "0" + formattedPhone.substring(2)
        }

        const metadata: Record<string, string> = {
            order_id: paymentData.orderId,
            tracking_number: paymentData.trackingNumber,
            reference_number: paymentData.referenceNumber,
            order_type: paymentData.orderType,
            customer_name: fullName,
            customer_email: paymentData.customerEmail,
            customer_phone: formattedPhone,
            payment_method: paymentData.paymentMethod,
            subtotal: paymentData.subtotal.toFixed(2),
            vat: paymentData.vat.toFixed(2),
            total_amount: paymentData.amount.toFixed(2),
            ...paymentData.metadata,
        }

        const orderTypeLabel =
            paymentData.orderType.charAt(0).toUpperCase() + paymentData.orderType.slice(1)

        const successUrl = `${frontendUrl}/checkout/success?tracking=${encodeURIComponent(paymentData.trackingNumber)}&reference=${encodeURIComponent(paymentData.referenceNumber)}`
        const cancelUrl = `${frontendUrl}/checkout/cancelled?tracking=${encodeURIComponent(paymentData.trackingNumber)}&reference=${encodeURIComponent(paymentData.referenceNumber)}`

        console.log("✅ Success URL:", successUrl)
        console.log("❌ Cancel URL:", cancelUrl)

        // ── Idempotency-Key ────────────────────────────────────────────────────
        // Using orderId ensures that if the network times out and the client
        // retries, PayMongo deduplicates the request and returns the same session
        // instead of creating a second one.
        const idempotencyKey = `checkout-${paymentData.orderId}`
        // ──────────────────────────────────────────────────────────────────────

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
                            // metadata on payment_intent is what checkout_session.payment.paid
                            // webhook delivers under data.attributes.payment_intent.attributes.metadata
                            // This is the PRIMARY source read by extractMetadata() in the webhook handler.
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
                        // Also set on the session itself as a secondary source
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
                    "Idempotency-Key": idempotencyKey,
                },
                timeout: 30000,
            }
        )

        const session = response.data.data
        const sessionAttrs = session.attributes
        const paymentIntent = sessionAttrs.payment_intent

        console.log("✅ Session created:", session.id)
        console.log("✅ Checkout URL:  ", sessionAttrs.checkout_url)
        console.log("✅ Idempotency-Key used:", idempotencyKey)

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