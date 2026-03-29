import crypto from "crypto"
import { db } from "@/lib/supabase/db"
import { and, eq, ne } from "drizzle-orm"
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
        const signature =
            parts["te"]?.length > 0
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
// Priority order matters — payment_intent metadata is the most reliable source
// for checkout_session events because PayMongo propagates it from the intent.

function extractMetadata(data: PayMongoWebhookEvent["attributes"]["data"]): {
    orderId: string | null
    trackingNumber: string | null
    paymentIntentId: string | null
} {
    const attrs = data.attributes

    // Source 1: payment_intent.attributes.metadata — PRIMARY (most reliable for checkout_session.payment.paid)
    const intentMeta = attrs.payment_intent?.attributes?.metadata ?? {}

    // Source 2: checkout session top-level metadata
    const checkoutMeta = attrs.metadata ?? {}

    // Source 3: individual payment metadata (fallback)
    const paymentMeta = attrs.payments?.[0]?.attributes?.metadata ?? {}

    console.log("📋 [metadata] payment_intent.attributes.metadata:", intentMeta)
    console.log("📋 [metadata] checkout session metadata:", checkoutMeta)
    console.log("📋 [metadata] payments[0].attributes.metadata:", paymentMeta)

    // Resolve in priority order: intent → checkout → payment
    const orderId =
        intentMeta.order_id ??
        checkoutMeta.order_id ??
        paymentMeta.order_id ??
        null

    const trackingNumber =
        intentMeta.tracking_number ??
        checkoutMeta.tracking_number ??
        paymentMeta.tracking_number ??
        null

    const paymentIntentId =
        attrs.payment_intent?.id ??
        attrs.payment_intent_id ??
        null

    console.log("📋 [metadata] Resolved — orderId:", orderId, "| tracking:", trackingNumber, "| intentId:", paymentIntentId)

    if (!orderId) {
        console.warn("⚠️ [metadata] order_id not found in any metadata source. Full attrs:", JSON.stringify(attrs, null, 2))
    }

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

// ==================== CHECK IDEMPOTENCY ====================
// Returns true if this event has already been successfully processed.

async function isAlreadyProcessed(eventId: string): Promise<boolean> {
    const [existing] = await db
        .select({ id: paymentHistory.id })
        .from(paymentHistory)
        .where(eq(paymentHistory.idempotencyKey, eventId))
        .limit(1)
    return !!existing
}

// ==================== PAYMENT SUCCESS ====================

async function handlePaymentSuccess(
    data: PayMongoWebhookEvent["attributes"]["data"],
    eventId: string  // PayMongo event.id used as idempotency key
): Promise<WebhookResult> {
    const { orderId, trackingNumber, paymentIntentId } = extractMetadata(data)

    if (!orderId) {
        console.error("❌ No order_id in metadata")
        return { success: false, message: "Missing order_id in metadata" }
    }

    // ── Idempotency check ──────────────────────────────────────────────────
    // Check BEFORE loading the order to short-circuit duplicate webhook deliveries.
    const alreadyProcessed = await isAlreadyProcessed(eventId)
    if (alreadyProcessed) {
        console.log("   ⏭️ Idempotency: event already processed, skipping")
        return {
            success: true,
            message: "Event already processed (idempotent)",
            orderId,
            trackingNumber,
        }
    }
    // ──────────────────────────────────────────────────────────────────────

    const existingOrder = await getOrder(orderId)
    if (!existingOrder) {
        console.error("❌ Order not found:", orderId)
        return { success: false, message: `Order not found: ${orderId}` }
    }

    console.log("   Order status:", existingOrder.status, "/", existingOrder.paymentStatus)

    if (existingOrder.paymentStatus === "paid") {
        console.log("   ⏭️ Order already paid, skipping")
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

    // VAT stored in metadata at checkout time — check all sources in priority order
    const vatFromMeta = parseFloat(
        (attrs.payment_intent?.attributes?.metadata ?? {}).vat ??
        (attrs.metadata ?? {}).vat ??
        (attrs.payments?.[0]?.attributes?.metadata ?? {}).vat ??
        "0"
    )

    const paidAt =
        payment?.paid_at
            ? new Date(payment.paid_at * 1000)
            : attrs.paid_at
                ? new Date(attrs.paid_at * 1000)
                : new Date()

    console.log("   Amount paid:  ₱", amountPaid)
    console.log("   VAT (12%):    ₱", vatFromMeta)
    console.log("   PayMongo fee: ₱", paymongoFee)
    console.log("   Net amount:   ₱", netAmount)
    console.log("   Event ID:     ", eventId, "(idempotency key)")

    try {
        await db.transaction(async (tx) => {
            // ── Optimistic lock ────────────────────────────────────────────
            // WHERE paymentStatus != 'paid' prevents two concurrent webhooks
            // from both committing. If rowCount === 0, the race was lost — bail.
            const updatedOrders = await tx
                .update(orders)
                .set({
                    paymentStatus: "paid",
                    status: "confirmed",
                    confirmedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(orders.id, orderId),
                        ne(orders.paymentStatus, "paid") // optimistic lock
                    )
                )
                .returning({ id: orders.id })

            if (updatedOrders.length === 0) {
                // Another concurrent webhook already committed — abort gracefully
                console.log("   ⏭️ Optimistic lock: order already paid by concurrent webhook")
                // Throwing here rolls back this transaction, which is intentional.
                // The outer catch will return a success response.
                throw new AlreadyPaidError()
            }
            // ──────────────────────────────────────────────────────────────

            await tx
                .update(paymentHistory)
                .set({
                    status: "paid",
                    paymentIntentId: paymentIntentId ?? data.id,
                    idempotencyKey: eventId,     // ← idempotency written atomically
                    amountPaid: amountPaid.toFixed(2),
                    vat: vatFromMeta.toFixed(2),
                    netAmount: netAmount.toFixed(2),
                    paidAt,
                    updatedAt: new Date(),
                    rawResponse: {
                        event_id: eventId,
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

        console.log("   ✅ Transaction committed — order confirmed and payment recorded")
    } catch (err) {
        if (err instanceof AlreadyPaidError) {
            return {
                success: true,
                message: "Order already paid (concurrent webhook)",
                orderId,
                trackingNumber,
                orderStatus: "confirmed",
                paymentStatus: "paid",
            }
        }
        console.error("   ❌ Transaction failed:", err)
        throw err
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
    data: PayMongoWebhookEvent["attributes"]["data"],
    eventId: string
): Promise<WebhookResult> {
    const { orderId, trackingNumber } = extractMetadata(data)

    console.log("❌ Payment Failed — order:", orderId, "| event:", eventId)

    if (!orderId) return { success: false, message: "Missing order_id in metadata" }

    // Idempotency: skip if already recorded
    const alreadyProcessed = await isAlreadyProcessed(eventId)
    if (alreadyProcessed) {
        console.log("   ⏭️ Idempotency: failure event already recorded")
        return { success: true, message: "Event already processed (idempotent)", orderId, trackingNumber }
    }

    const existingOrder = await getOrder(orderId)
    if (!existingOrder) return { success: false, message: `Order not found: ${orderId}` }

    // Never overwrite a paid order with a failure — payments can fire out-of-order
    if (existingOrder.paymentStatus === "paid") {
        console.log("   ⏭️ Already paid, ignoring failure event")
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
                idempotencyKey: eventId,
                updatedAt: new Date(),
                rawResponse: {
                    event_id: eventId,
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
    data: PayMongoWebhookEvent["attributes"]["data"],
    eventId: string
): Promise<WebhookResult> {
    const { orderId, trackingNumber } = extractMetadata(data)

    console.log("⏰ Checkout Expired — order:", orderId, "| event:", eventId)

    if (!orderId) return { success: false, message: "Missing order_id in metadata" }

    // Idempotency: skip if already recorded
    const alreadyProcessed = await isAlreadyProcessed(eventId)
    if (alreadyProcessed) {
        console.log("   ⏭️ Idempotency: expiry event already recorded")
        return { success: true, message: "Event already processed (idempotent)", orderId, trackingNumber }
    }

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
                idempotencyKey: eventId,
                updatedAt: new Date(),
                rawResponse: {
                    event_id: eventId,
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

// ==================== ALREADY PAID SENTINEL ====================
// Used to cleanly abort a transaction when an optimistic lock detects a race.

class AlreadyPaidError extends Error {
    constructor() {
        super("AlreadyPaidError")
        this.name = "AlreadyPaidError"
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
    const eventId = event.id  // used as idempotency key throughout

    console.log("═══════════════════════════════════")
    console.log("📨 Webhook event:", eventType)
    console.log("   Event ID:", eventId)
    console.log("   Live mode:", event.attributes.livemode)
    console.log("   Data ID:", eventData.id)
    console.log("   Time:", new Date().toISOString())
    console.log("═══════════════════════════════════")

    try {
        switch (eventType) {
            // ── Payment success ──────────────────────────────────────────
            case "checkout_session.payment.paid":
            case "payment_intent.succeeded":
            case "payment.paid":
                return await handlePaymentSuccess(eventData, eventId)

            // ── Payment failure ──────────────────────────────────────────
            case "checkout_session.payment.failed":   // ← added
            case "payment_intent.payment_failed":
            case "payment.failed":
                return await handlePaymentFailed(eventData, eventId)

            // ── Session expiry ───────────────────────────────────────────
            case "checkout_session.expired":
            case "checkout_session.payment.expired":  // ← added
                return await handleCheckoutExpired(eventData, eventId)

            default:
                console.log(`   ℹ️ Unhandled event type: ${eventType}`)
                return { success: true, message: `Event ${eventType} acknowledged` }
        }
    } catch (error) {
        console.error(
            "❌ processWebhookEvent error:",
            error instanceof Error ? error.message : error
        )
        throw error
    }
}