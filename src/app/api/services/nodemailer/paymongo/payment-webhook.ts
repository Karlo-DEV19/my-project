import crypto from "crypto"
import { db } from "@/lib/supabase/db"
import { eq } from "drizzle-orm"
import { orders } from "@/schema/orders/orders"
import { paymentHistory } from "@/schema/orders/payment-history/payment-history"

const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET || ""

// ==================== TYPES ====================

export interface PayMongoWebhookPayload {
    data: PayMongoWebhookEvent
}

export interface PayMongoWebhookEvent {
    id: string
    type: string
    attributes: {
        type: string
        livemode: boolean
        data: {
            id: string
            type: string
            attributes: {
                amount: number
                currency: string
                status: string
                paid_at?: number
                fee?: number
                net_amount?: number
                payment_intent_id?: string
                reference_number?: string
                metadata?: Record<string, any>
                payments?: Array<{
                    id: string
                    type: string
                    attributes: {
                        amount: number
                        fee: number
                        net_amount: number
                        status: string
                        paid_at: number
                        source?: { id: string; type: string }
                        metadata?: Record<string, any>
                    }
                }>
                payment_intent?: {
                    id: string
                    type: string
                    attributes: {
                        status: string
                        amount: number
                        metadata?: Record<string, any>
                    }
                }
            }
        }
        previous_data?: Record<string, any>
        pending_webhooks?: number
        created_at: number
        updated_at: number
    }
}

export interface WebhookResult {
    success: boolean
    message: string
    orderId?: string | null
    trackingNumber?: string | null
    orderStatus?: string
    paymentStatus?: string
}

// ==================== SIGNATURE VERIFICATION ====================

export function verifyWebhookSignature(
    payload: string,
    signatureHeader: string
): { valid: boolean; error?: string } {
    console.log("🔐 === Signature Verification ===")

    if (!PAYMONGO_WEBHOOK_SECRET) {
        console.warn("⚠️ PAYMONGO_WEBHOOK_SECRET not configured, skipping verification")
        return { valid: true }
    }

    if (!signatureHeader) {
        return { valid: false, error: "Missing signature header" }
    }

    try {
        const parts: Record<string, string> = {}
        signatureHeader.split(",").forEach((part) => {
            const equalIndex = part.indexOf("=")
            if (equalIndex > 0) {
                parts[part.substring(0, equalIndex)] = part.substring(equalIndex + 1)
            }
        })

        console.log("🔐 Parsed:", {
            t: parts["t"] ? "present" : "missing",
            te: parts["te"] ? `${parts["te"].length} chars` : "empty",
            li: parts["li"] ? `${parts["li"].length} chars` : "empty",
        })

        const timestamp = parts["t"]
        const signature = parts["te"]?.length > 0
            ? parts["te"]
            : parts["li"]?.length > 0
                ? parts["li"]
                : null

        if (!timestamp) return { valid: false, error: "Missing timestamp" }
        if (!signature) return { valid: false, error: "Missing signature" }

        console.log("🔐 Mode:", parts["te"]?.length > 0 ? "test (te)" : "live (li)")

        const expectedSignature = crypto
            .createHmac("sha256", PAYMONGO_WEBHOOK_SECRET)
            .update(`${timestamp}.${payload}`)
            .digest("hex")

        console.log("🔐 Expected:", expectedSignature.substring(0, 16) + "...")
        console.log("🔐 Received:", signature.substring(0, 16) + "...")

        let isValid = false
        try {
            isValid = crypto.timingSafeEqual(
                Buffer.from(signature, "hex"),
                Buffer.from(expectedSignature, "hex")
            )
        } catch {
            isValid = signature === expectedSignature
        }

        console.log("🔐 Valid:", isValid)
        return isValid ? { valid: true } : { valid: false, error: "Signature mismatch" }
    } catch (error) {
        console.error("🔐 Verification error:", error)
        return { valid: false, error: "Verification failed" }
    }
}

// ==================== EXTRACT METADATA ====================

function extractMetadata(data: PayMongoWebhookEvent["attributes"]["data"]): {
    orderId: string | null
    trackingNumber: string | null
    paymentIntentId: string | null
} {
    const attrs = data.attributes
    const checkoutMeta = attrs.metadata ?? {}
    const intentMeta = attrs.payment_intent?.attributes?.metadata ?? {}
    const paymentMeta = attrs.payments?.[0]?.attributes?.metadata ?? {}

    console.log("📋 Checkout metadata:", checkoutMeta)
    console.log("📋 Intent metadata:", intentMeta)
    console.log("📋 Payment metadata:", paymentMeta)

    const orderId =
        checkoutMeta.order_id ?? intentMeta.order_id ?? paymentMeta.order_id ?? null

    const trackingNumber =
        checkoutMeta.tracking_number ??
        intentMeta.tracking_number ??
        paymentMeta.tracking_number ??
        null

    const paymentIntentId =
        attrs.payment_intent?.id ?? attrs.payment_intent_id ?? null

    console.log("📋 Resolved — orderId:", orderId, "| tracking:", trackingNumber)
    return { orderId, trackingNumber, paymentIntentId }
}

// ==================== GET ORDER ====================

async function getOrder(orderId: string) {
    const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1)
    return order ?? null
}

// ==================== PAYMENT SUCCESS ====================

async function handlePaymentSuccess(
    data: PayMongoWebhookEvent["attributes"]["data"]
): Promise<WebhookResult> {
    const { orderId, trackingNumber, paymentIntentId } = extractMetadata(data)

    if (!orderId) {
        console.error("❌ No order_id in metadata")
        return { success: false, message: "Missing order_id in metadata" }
    }

    const existingOrder = await getOrder(orderId)
    if (!existingOrder) {
        console.error("❌ Order not found:", orderId)
        return { success: false, message: `Order not found: ${orderId}` }
    }

    console.log("   Status:", existingOrder.status, "/", existingOrder.paymentStatus)

    if (existingOrder.paymentStatus === "paid") {
        console.log("   ⏭️ Already paid, skipping")
        return {
            success: true,
            message: "Order already paid",
            orderId,
            trackingNumber,
            orderStatus: existingOrder.status,
            paymentStatus: "paid",
        }
    }

    const attrs = data.attributes
    const payment = attrs.payments?.[0]?.attributes

    // Gross amount the customer paid (centavos → PHP)
    const amountPaid = (payment?.amount ?? attrs.amount) / 100

    // PayMongo's own platform cut — stored for audit only
    const paymongoFee = (payment?.fee ?? attrs.fee ?? 0) / 100

    // What lands in your account after PayMongo deducts their fee
    const netAmount = (payment?.net_amount ?? attrs.net_amount ?? attrs.amount) / 100

    // VAT stored in metadata (set at checkout time)
    const vatFromMeta = parseFloat(
        (attrs.metadata ?? {}).vat ??
        (attrs.payment_intent?.attributes?.metadata ?? {}).vat ??
        "0"
    )

    const paidAt = payment?.paid_at
        ? new Date(payment.paid_at * 1000)
        : attrs.paid_at
            ? new Date(attrs.paid_at * 1000)
            : new Date()

    console.log("   Amount paid:  ₱", amountPaid)
    console.log("   VAT (12%):    ₱", vatFromMeta)
    console.log("   PayMongo fee: ₱", paymongoFee)
    console.log("   Net amount:   ₱", netAmount)

    try {
        await db.transaction(async (tx) => {
            await tx
                .update(orders)
                .set({
                    paymentStatus: "paid",
                    status: "confirmed",
                    confirmedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(orders.id, orderId))

            await tx
                .update(paymentHistory)
                .set({
                    status: "paid",
                    paymentIntentId: paymentIntentId ?? data.id,
                    amountPaid: amountPaid.toFixed(2),
                    // processingFee column repurposed to store VAT for this business model
                    vat: vatFromMeta.toFixed(2),
                    netAmount: netAmount.toFixed(2),
                    paidAt,
                    updatedAt: new Date(),
                    rawResponse: {
                        event_id: data.id,
                        amount_paid: amountPaid,
                        vat: vatFromMeta,
                        paymongo_fee: paymongoFee,
                        net_amount: netAmount,
                        currency: attrs.currency,
                        paid_at: paidAt.toISOString(),
                    },
                })
                .where(eq(paymentHistory.orderId, orderId))
        })
        console.log("   ✅ Transaction committed")
    } catch (dbError) {
        console.error("   ❌ Transaction failed:", dbError)
        throw dbError
    }

    return {
        success: true,
        message: "Payment processed successfully",
        orderId,
        trackingNumber,
        orderStatus: "confirmed",
        paymentStatus: "paid",
    }
}

// ==================== PAYMENT FAILED ====================

async function handlePaymentFailed(
    data: PayMongoWebhookEvent["attributes"]["data"]
): Promise<WebhookResult> {
    const { orderId, trackingNumber } = extractMetadata(data)

    console.log("❌ Payment Failed — order:", orderId)

    if (!orderId) return { success: false, message: "Missing order_id in metadata" }

    const existingOrder = await getOrder(orderId)
    if (!existingOrder) return { success: false, message: `Order not found: ${orderId}` }

    if (existingOrder.paymentStatus === "paid") {
        console.log("   ⏭️ Already paid, ignoring failure")
        return {
            success: true,
            message: "Order already paid, ignoring failure",
            orderId,
            trackingNumber,
            orderStatus: existingOrder.status,
            paymentStatus: "paid",
        }
    }

    await db.transaction(async (tx) => {
        await tx
            .update(orders)
            .set({ paymentStatus: "failed", updatedAt: new Date() })
            .where(eq(orders.id, orderId))

        await tx
            .update(paymentHistory)
            .set({
                status: "failed",
                updatedAt: new Date(),
                rawResponse: {
                    event_id: data.id,
                    status: "failed",
                    failed_at: new Date().toISOString(),
                },
            })
            .where(eq(paymentHistory.orderId, orderId))
    })

    console.log("   ⚠️ Failure recorded")
    return {
        success: true,
        message: "Payment failure recorded",
        orderId,
        trackingNumber,
        orderStatus: "pending",
        paymentStatus: "failed",
    }
}

// ==================== CHECKOUT EXPIRED ====================

async function handleCheckoutExpired(
    data: PayMongoWebhookEvent["attributes"]["data"]
): Promise<WebhookResult> {
    const { orderId, trackingNumber } = extractMetadata(data)

    console.log("⏰ Checkout Expired — order:", orderId)

    if (!orderId) return { success: false, message: "Missing order_id in metadata" }

    const existingOrder = await getOrder(orderId)
    if (!existingOrder) return { success: false, message: `Order not found: ${orderId}` }

    if (existingOrder.paymentStatus === "paid") {
        console.log("   ⏭️ Already paid, ignoring expiration")
        return {
            success: true,
            message: "Order already paid",
            orderId,
            trackingNumber,
            orderStatus: existingOrder.status,
            paymentStatus: "paid",
        }
    }

    if (existingOrder.status === "cancelled") {
        console.log("   ⏭️ Already cancelled")
        return {
            success: true,
            message: "Order already cancelled",
            orderId,
            trackingNumber,
            orderStatus: "cancelled",
            paymentStatus: existingOrder.paymentStatus ?? "unpaid",
        }
    }

    await db.transaction(async (tx) => {
        await tx
            .update(orders)
            .set({
                paymentStatus: "unpaid",
                status: "cancelled",
                cancelledAt: new Date(),
                cancelledBy: "system",
                cancellationReason: "Payment session expired",
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId))

        await tx
            .update(paymentHistory)
            .set({
                status: "failed",
                updatedAt: new Date(),
                rawResponse: {
                    event_id: data.id,
                    status: "expired",
                    expired_at: new Date().toISOString(),
                },
            })
            .where(eq(paymentHistory.orderId, orderId))
    })

    console.log("   ⚠️ Order cancelled — session expired")
    return {
        success: true,
        message: "Order cancelled - payment expired",
        orderId,
        trackingNumber,
        orderStatus: "cancelled",
        paymentStatus: "unpaid",
    }
}

// ==================== MAIN PROCESSOR ====================

export async function processWebhookEvent(
    payload: PayMongoWebhookPayload | PayMongoWebhookEvent
): Promise<WebhookResult> {
    const event: PayMongoWebhookEvent =
        "data" in payload && (payload as PayMongoWebhookPayload).data?.attributes
            ? (payload as PayMongoWebhookPayload).data
            : (payload as PayMongoWebhookEvent)

    const eventType = event.attributes.type
    const eventData = event.attributes.data

    console.log("═══════════════════════════════════")
    console.log("📨 Webhook event:", eventType)
    console.log("   Event ID:", event.id)
    console.log("   Live mode:", event.attributes.livemode)
    console.log("   Data ID:", eventData.id)
    console.log("   Time:", new Date().toISOString())
    console.log("═══════════════════════════════════")

    try {
        switch (eventType) {
            case "checkout_session.payment.paid":
            case "payment_intent.succeeded":
            case "payment.paid":
                return await handlePaymentSuccess(eventData)

            case "payment_intent.payment_failed":
            case "payment.failed":
                return await handlePaymentFailed(eventData)

            case "checkout_session.expired":
                return await handleCheckoutExpired(eventData)

            default:
                console.log(`   ℹ️ Unhandled event type: ${eventType}`)
                return { success: true, message: `Event ${eventType} acknowledged` }
        }
    } catch (error) {
        console.error("❌ processWebhookEvent error:", error instanceof Error ? error.message : error)
        throw error
    }
}