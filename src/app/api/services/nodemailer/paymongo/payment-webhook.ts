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
    console.log("🔐 Secret configured:", !!PAYMONGO_WEBHOOK_SECRET, "| Secret length:", PAYMONGO_WEBHOOK_SECRET.length)

    if (!PAYMONGO_WEBHOOK_SECRET) {
        console.warn("⚠️ PAYMONGO_WEBHOOK_SECRET not configured, skipping verification")
        return { valid: true }
    }

    if (!signatureHeader) {
        console.error("🔐 ❌ No signature header received at all")
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

        console.log("🔐 Parsed header parts:", {
            t: parts["t"] ? `present (${parts["t"]})` : "MISSING",
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

        if (!timestamp) {
            console.error("🔐 ❌ Timestamp (t=) missing from signature header")
            return { valid: false, error: "Missing timestamp" }
        }
        if (!signature) {
            console.error("🔐 ❌ Signature (te= or li=) missing from header")
            return { valid: false, error: "Missing signature" }
        }

        console.log("🔐 Mode:", parts["te"]?.length > 0 ? "test (te)" : "live (li)")
        console.log("🔐 Payload length being signed:", payload.length)

        const expectedSignature = crypto
            .createHmac("sha256", PAYMONGO_WEBHOOK_SECRET)
            .update(`${timestamp}.${payload}`)
            .digest("hex")

        console.log("🔐 Expected (first 32):", expectedSignature.substring(0, 32) + "...")
        console.log("🔐 Received (first 32):", signature.substring(0, 32) + "...")
        console.log("🔐 Lengths match:", expectedSignature.length === signature.length)

        let isValid = false
        try {
            isValid = crypto.timingSafeEqual(
                Buffer.from(signature, "hex"),
                Buffer.from(expectedSignature, "hex")
            )
        } catch (timingSafeError) {
            console.warn("🔐 timingSafeEqual failed (likely hex decode error), falling back to string compare:", timingSafeError)
            isValid = signature === expectedSignature
        }

        console.log("🔐 Result:", isValid ? "✅ VALID" : "❌ INVALID")
        return isValid ? { valid: true } : { valid: false, error: "Signature mismatch" }
    } catch (error) {
        console.error("🔐 Verification threw unexpected error:", error)
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

    const intentMeta = attrs.payment_intent?.attributes?.metadata ?? {}
    const checkoutMeta = attrs.metadata ?? {}
    const paymentMeta = attrs.payments?.[0]?.attributes?.metadata ?? {}

    console.log("📋 [metadata] === Metadata Extraction ===")
    console.log("📋 [metadata] payment_intent present:", !!attrs.payment_intent)
    console.log("📋 [metadata] payment_intent.id:", attrs.payment_intent?.id ?? "N/A")
    console.log("📋 [metadata] payment_intent.attributes.metadata:", JSON.stringify(intentMeta))
    console.log("📋 [metadata] checkout session metadata:", JSON.stringify(checkoutMeta))
    console.log("📋 [metadata] payments array length:", attrs.payments?.length ?? 0)
    console.log("📋 [metadata] payments[0].attributes.metadata:", JSON.stringify(paymentMeta))
    console.log("📋 [metadata] attrs.payment_intent_id (top-level field):", attrs.payment_intent_id ?? "N/A")

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

    console.log("📋 [metadata] ─── Resolved ───")
    console.log("📋 [metadata]   orderId:", orderId ?? "❌ NOT FOUND")
    console.log("📋 [metadata]   trackingNumber:", trackingNumber ?? "❌ NOT FOUND")
    console.log("📋 [metadata]   paymentIntentId:", paymentIntentId ?? "❌ NOT FOUND")

    if (!orderId) {
        console.error("📋 [metadata] ❌ CRITICAL: order_id missing from ALL metadata sources!")
        console.error("📋 [metadata] Full data.attributes dump:", JSON.stringify(attrs, null, 2))
    }

    return { orderId, trackingNumber, paymentIntentId }
}

// ==================== GET ORDER ====================

async function getOrder(orderId: string) {
    console.log("🗄️ [getOrder] Looking up order:", orderId)
    const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1)
    if (order) {
        console.log("🗄️ [getOrder] Found — status:", order.status, "| paymentStatus:", order.paymentStatus)
    } else {
        console.error("🗄️ [getOrder] ❌ Order NOT found in DB for id:", orderId)
    }
    return order ?? null
}

// ==================== CHECK IDEMPOTENCY ====================

async function isAlreadyProcessed(eventId: string): Promise<boolean> {
    console.log("🔁 [idempotency] Checking eventId:", eventId)
    const [existing] = await db
        .select({ id: paymentHistory.id, status: paymentHistory.status })
        .from(paymentHistory)
        .where(eq(paymentHistory.idempotencyKey, eventId))
        .limit(1)
    if (existing) {
        console.log("🔁 [idempotency] Already processed — paymentHistory.id:", existing.id, "| status:", existing.status)
    } else {
        console.log("🔁 [idempotency] Not yet processed — proceeding")
    }
    return !!existing
}

// ==================== PAYMENT SUCCESS ====================

async function handlePaymentSuccess(
    data: PayMongoWebhookEvent["attributes"]["data"],
    eventId: string
): Promise<WebhookResult> {
    console.log("💰 [handlePaymentSuccess] === START ===")
    console.log("💰 [handlePaymentSuccess] eventId:", eventId)

    const { orderId, trackingNumber, paymentIntentId } = extractMetadata(data)

    if (!orderId) {
        console.error("💰 [handlePaymentSuccess] ❌ Aborting — no orderId resolved from metadata")
        return { success: false, message: "Missing order_id in metadata" }
    }

    const alreadyProcessed = await isAlreadyProcessed(eventId)
    if (alreadyProcessed) {
        console.log("💰 [handlePaymentSuccess] ⏭️ Skipping — idempotency hit")
        return {
            success: true,
            message: "Event already processed (idempotent)",
            orderId,
            trackingNumber,
        }
    }

    const existingOrder = await getOrder(orderId)
    if (!existingOrder) {
        console.error("💰 [handlePaymentSuccess] ❌ Aborting — order not in DB")
        return { success: false, message: `Order not found: ${orderId}` }
    }

    if (existingOrder.paymentStatus === "paid") {
        console.log("💰 [handlePaymentSuccess] ⏭️ Skipping — order already marked paid in DB")
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

    const amountPaid = (payment?.amount ?? attrs.amount) / 100
    const paymongoFee = (payment?.fee ?? attrs.fee ?? 0) / 100
    const netAmount = (payment?.net_amount ?? attrs.net_amount ?? attrs.amount) / 100
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

    console.log("💰 [handlePaymentSuccess] Payment figures:")
    console.log("   amountPaid:   ₱", amountPaid)
    console.log("   vatFromMeta:  ₱", vatFromMeta)
    console.log("   paymongoFee:  ₱", paymongoFee)
    console.log("   netAmount:    ₱", netAmount)
    console.log("   paidAt:       ", paidAt.toISOString())
    console.log("   paymentIntentId to write:", paymentIntentId ?? data.id, paymentIntentId ? "(from intent)" : "(fallback to data.id)")
    console.log("💰 [handlePaymentSuccess] Attempting DB transaction...")

    try {
        await db.transaction(async (tx) => {
            console.log("💰 [tx] Updating orders table — orderId:", orderId)
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
                        ne(orders.paymentStatus, "paid")
                    )
                )
                .returning({ id: orders.id })

            console.log("💰 [tx] orders.update affected rows:", updatedOrders.length)

            if (updatedOrders.length === 0) {
                console.warn("💰 [tx] ⚠️ Optimistic lock: 0 rows updated — order already paid by concurrent webhook")
                throw new AlreadyPaidError()
            }

            console.log("💰 [tx] Updating paymentHistory table — orderId:", orderId)
            const updatedHistory = await tx
                .update(paymentHistory)
                .set({
                    status: "paid",
                    paymentIntentId: paymentIntentId ?? data.id,
                    idempotencyKey: eventId,
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
                .returning({ id: paymentHistory.id })

            console.log("💰 [tx] paymentHistory.update affected rows:", updatedHistory.length)

            if (updatedHistory.length === 0) {
                console.error("💰 [tx] ❌ paymentHistory update hit 0 rows — no payment_history record for orderId:", orderId)
                console.error("💰 [tx] This means the order exists but has no paymentHistory row. Check insert in checkoutOrder.")
            }
        })

        console.log("💰 [handlePaymentSuccess] ✅ Transaction committed successfully")
    } catch (err) {
        if (err instanceof AlreadyPaidError) {
            console.log("💰 [handlePaymentSuccess] ⏭️ AlreadyPaidError caught — returning success")
            return {
                success: true,
                message: "Order already paid (concurrent webhook)",
                orderId,
                trackingNumber,
                orderStatus: "confirmed",
                paymentStatus: "paid",
            }
        }
        console.error("💰 [handlePaymentSuccess] ❌ Transaction threw unexpected error:", err)
        throw err
    }

    console.log("💰 [handlePaymentSuccess] === DONE ✅ ===")
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
    console.log("❌ [handlePaymentFailed] orderId:", orderId, "| eventId:", eventId)

    if (!orderId) return { success: false, message: "Missing order_id in metadata" }

    const alreadyProcessed = await isAlreadyProcessed(eventId)
    if (alreadyProcessed) {
        console.log("❌ [handlePaymentFailed] ⏭️ Already processed")
        return { success: true, message: "Event already processed (idempotent)", orderId, trackingNumber }
    }

    const existingOrder = await getOrder(orderId)
    if (!existingOrder) return { success: false, message: `Order not found: ${orderId}` }

    if (existingOrder.paymentStatus === "paid") {
        console.log("❌ [handlePaymentFailed] ⏭️ Order already paid — ignoring failure event")
        return {
            success: true,
            message: "Order already paid, ignoring failure",
            orderId,
            trackingNumber,
            orderStatus: existingOrder.status,
            paymentStatus: "paid",
        }
    }

    console.log("❌ [handlePaymentFailed] Recording failure in DB...")
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

    console.log("❌ [handlePaymentFailed] ✅ Failure recorded")
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
    console.log("⏰ [handleCheckoutExpired] orderId:", orderId, "| eventId:", eventId)

    if (!orderId) return { success: false, message: "Missing order_id in metadata" }

    const alreadyProcessed = await isAlreadyProcessed(eventId)
    if (alreadyProcessed) {
        console.log("⏰ [handleCheckoutExpired] ⏭️ Already processed")
        return { success: true, message: "Event already processed (idempotent)", orderId, trackingNumber }
    }

    const existingOrder = await getOrder(orderId)
    if (!existingOrder) return { success: false, message: `Order not found: ${orderId}` }

    if (existingOrder.paymentStatus === "paid") {
        console.log("⏰ [handleCheckoutExpired] ⏭️ Already paid — ignoring expiry")
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
        console.log("⏰ [handleCheckoutExpired] ⏭️ Already cancelled")
        return {
            success: true,
            message: "Order already cancelled",
            orderId,
            trackingNumber,
            orderStatus: "cancelled",
            paymentStatus: existingOrder.paymentStatus ?? "unpaid",
        }
    }

    console.log("⏰ [handleCheckoutExpired] Cancelling order in DB...")
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

    console.log("⏰ [handleCheckoutExpired] ✅ Order cancelled")
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
    const eventId = event.id

    console.log("═══════════════════════════════════")
    console.log("📨 [processWebhookEvent] Received event")
    console.log("   Type:      ", eventType)
    console.log("   Event ID:  ", eventId)
    console.log("   Live mode: ", event.attributes.livemode)
    console.log("   Data ID:   ", eventData.id)
    console.log("   Data type: ", eventData.type)
    console.log("   Data status:", eventData.attributes?.status ?? "N/A")
    console.log("   Amount (raw centavos):", eventData.attributes?.amount ?? "N/A")
    console.log("   Time:      ", new Date().toISOString())
    console.log("═══════════════════════════════════")

    // Dump the full raw event for maximum debuggability
    console.log("📨 [processWebhookEvent] Full event.attributes.data.attributes (truncated):")
    try {
        const safeAttrs = JSON.stringify(eventData.attributes, null, 2)
        // Print in chunks to avoid log truncation
        const chunkSize = 2000
        for (let i = 0; i < safeAttrs.length; i += chunkSize) {
            console.log(safeAttrs.slice(i, i + chunkSize))
        }
    } catch {
        console.log("   (could not serialise attributes)")
    }

    try {
        switch (eventType) {
            case "checkout_session.payment.paid":
            case "payment_intent.succeeded":
            case "payment.paid":
                console.log("📨 [processWebhookEvent] → routing to handlePaymentSuccess")
                return await handlePaymentSuccess(eventData, eventId)

            case "checkout_session.payment.failed":
            case "payment_intent.payment_failed":
            case "payment.failed":
                console.log("📨 [processWebhookEvent] → routing to handlePaymentFailed")
                return await handlePaymentFailed(eventData, eventId)

            case "checkout_session.expired":
            case "checkout_session.payment.expired":
                console.log("📨 [processWebhookEvent] → routing to handleCheckoutExpired")
                return await handleCheckoutExpired(eventData, eventId)

            default:
                console.warn("📨 [processWebhookEvent] ⚠️ Unhandled event type:", eventType)
                return { success: true, message: `Event ${eventType} acknowledged` }
        }
    } catch (error) {
        console.error(
            "📨 [processWebhookEvent] ❌ Uncaught error:",
            error instanceof Error ? error.message : error
        )
        throw error
    }
}