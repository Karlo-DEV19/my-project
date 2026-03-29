import crypto from "crypto"
import { db } from "@/lib/supabase/db"
import { and, eq, isNull, ne } from "drizzle-orm"
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
    console.log("🔐 Secret configured:", !!PAYMONGO_WEBHOOK_SECRET, "| length:", PAYMONGO_WEBHOOK_SECRET.length)

    if (!PAYMONGO_WEBHOOK_SECRET) {
        console.warn("⚠️ PAYMONGO_WEBHOOK_SECRET not set — skipping verification (UNSAFE IN PRODUCTION)")
        return { valid: true }
    }

    if (!signatureHeader) {
        console.error("🔐 ❌ paymongo-signature header is completely absent from request")
        return { valid: false, error: "Missing signature header" }
    }

    try {
        const parts: Record<string, string> = {}
        signatureHeader.split(",").forEach((part) => {
            const equalIndex = part.indexOf("=")
            if (equalIndex > 0) {
                parts[part.substring(0, equalIndex).trim()] = part.substring(equalIndex + 1).trim()
            }
        })

        console.log("🔐 Parsed header:", {
            t: parts["t"] ? `present (${parts["t"]})` : "❌ MISSING",
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
            console.error("🔐 ❌ t= (timestamp) missing")
            return { valid: false, error: "Missing timestamp in signature header" }
        }
        if (!signature) {
            console.error("🔐 ❌ te= and li= both empty/missing")
            return { valid: false, error: "Missing signature value (te or li)" }
        }

        console.log("🔐 Mode:", parts["te"]?.length > 0 ? "TEST (te)" : "LIVE (li)")
        console.log("🔐 Payload length:", payload.length)

        const expectedSignature = crypto
            .createHmac("sha256", PAYMONGO_WEBHOOK_SECRET)
            .update(`${timestamp}.${payload}`)
            .digest("hex")

        console.log("🔐 Expected (first 32):", expectedSignature.substring(0, 32) + "...")
        console.log("🔐 Received (first 32):", signature.substring(0, 32) + "...")

        let isValid = false
        try {
            const expBuf = Buffer.from(expectedSignature, "hex")
            const recBuf = Buffer.from(signature, "hex")
            if (expBuf.length === recBuf.length) {
                isValid = crypto.timingSafeEqual(expBuf, recBuf)
            } else {
                console.warn("🔐 Buffer length mismatch — plain string compare fallback")
                isValid = signature === expectedSignature
            }
        } catch (timingErr) {
            console.warn("🔐 timingSafeEqual threw — plain string compare fallback:", timingErr)
            isValid = signature === expectedSignature
        }

        console.log("🔐 Result:", isValid ? "✅ VALID" : "❌ INVALID (wrong PAYMONGO_WEBHOOK_SECRET?)")
        return isValid ? { valid: true } : { valid: false, error: "Signature mismatch" }
    } catch (err) {
        console.error("🔐 Unexpected verification error:", err)
        return { valid: false, error: "Verification exception" }
    }
}

// ==================== EXTRACT METADATA ====================
// Priority order: payment_intent.attributes.metadata > session metadata > payments[0] metadata
// payment_intent metadata is the most reliable path for checkout_session.payment.paid events.

function extractMetadata(data: PayMongoWebhookEvent["attributes"]["data"]): {
    orderId: string | null
    trackingNumber: string | null
    paymentIntentId: string | null
} {
    const attrs = data.attributes

    const intentMeta: Record<string, any> = attrs.payment_intent?.attributes?.metadata ?? {}
    const checkoutMeta: Record<string, any> = attrs.metadata ?? {}
    const paymentMeta: Record<string, any> = attrs.payments?.[0]?.attributes?.metadata ?? {}

    console.log("📋 [metadata] === Extraction ===")
    console.log("📋 payment_intent present:", !!attrs.payment_intent, "| id:", attrs.payment_intent?.id ?? "N/A")
    console.log("📋 intentMeta:   ", JSON.stringify(intentMeta))
    console.log("📋 checkoutMeta: ", JSON.stringify(checkoutMeta))
    console.log("📋 paymentMeta:  ", JSON.stringify(paymentMeta))
    console.log("📋 payments[]:   ", attrs.payments?.length ?? 0, "entries")

    const orderId =
        (intentMeta.order_id as string | undefined) ??
        (checkoutMeta.order_id as string | undefined) ??
        (paymentMeta.order_id as string | undefined) ??
        null

    const trackingNumber =
        (intentMeta.tracking_number as string | undefined) ??
        (checkoutMeta.tracking_number as string | undefined) ??
        (paymentMeta.tracking_number as string | undefined) ??
        null

    const paymentIntentId =
        attrs.payment_intent?.id ??
        attrs.payment_intent_id ??
        null

    console.log("📋 Resolved → orderId:", orderId ?? "❌ NOT FOUND", "| tracking:", trackingNumber ?? "❌", "| intentId:", paymentIntentId ?? "❌")

    if (!orderId) {
        console.error("📋 ❌ CRITICAL: order_id missing from ALL metadata sources!")
        console.error("📋 Full attrs:", JSON.stringify(attrs, null, 2))
    }

    return { orderId, trackingNumber, paymentIntentId }
}

// ==================== GET ORDER ====================

async function getOrder(orderId: string) {
    console.log("🗄️ [getOrder] id:", orderId)
    const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1)

    if (order) {
        console.log("🗄️ [getOrder] Found — status:", order.status, "| paymentStatus:", order.paymentStatus)
    } else {
        console.error("🗄️ [getOrder] ❌ NOT FOUND for id:", orderId)
    }
    return order ?? null
}

// ==================== CHECK IDEMPOTENCY ====================
// Only checks for rows WHERE idempotencyKey = eventId.
// Pending rows have idempotencyKey = NULL and are never matched here.

async function isAlreadyProcessed(eventId: string): Promise<boolean> {
    console.log("🔁 [idempotency] Checking eventId:", eventId)
    const [existing] = await db
        .select({ id: paymentHistory.id, status: paymentHistory.status })
        .from(paymentHistory)
        .where(eq(paymentHistory.idempotencyKey, eventId))
        .limit(1)

    if (existing) {
        console.log("🔁 ⏭️ Already processed — row:", existing.id, "| status:", existing.status)
        return true
    }
    console.log("🔁 Not yet processed — safe to continue")
    return false
}

// ==================== PAYMENT SUCCESS ====================

async function handlePaymentSuccess(
    data: PayMongoWebhookEvent["attributes"]["data"],
    eventId: string
): Promise<WebhookResult> {
    console.log("💰 [handlePaymentSuccess] ===== START ===== eventId:", eventId)

    const { orderId, trackingNumber, paymentIntentId } = extractMetadata(data)

    if (!orderId) {
        console.error("💰 ❌ Aborting — orderId is null after metadata extraction")
        return { success: false, message: "Missing order_id in metadata" }
    }

    // Fast-path: exit early if this event was already fully committed
    if (await isAlreadyProcessed(eventId)) {
        console.log("💰 ⏭️ Idempotency hit — already done")
        return { success: true, message: "Event already processed (idempotent)", orderId, trackingNumber }
    }

    const existingOrder = await getOrder(orderId)
    if (!existingOrder) {
        console.error("💰 ❌ Order not in DB:", orderId)
        return { success: false, message: `Order not found: ${orderId}` }
    }

    if (existingOrder.paymentStatus === "paid") {
        console.log("💰 ⏭️ Order already paid in DB — skipping")
        return { success: true, message: "Order already paid", orderId, trackingNumber, orderStatus: existingOrder.status, paymentStatus: "paid" }
    }

    // Derive financial figures
    const attrs = data.attributes
    const payment = attrs.payments?.[0]?.attributes

    const amountPaid = (payment?.amount ?? attrs.amount) / 100
    const paymongoFee = (payment?.fee ?? attrs.fee ?? 0) / 100
    const netAmount = (payment?.net_amount ?? attrs.net_amount ?? attrs.amount) / 100

    const vatRaw =
        (attrs.payment_intent?.attributes?.metadata?.vat as string | undefined) ??
        (attrs.metadata?.vat as string | undefined) ??
        (attrs.payments?.[0]?.attributes?.metadata?.vat as string | undefined) ??
        "0"
    const vatFromMeta = parseFloat(vatRaw)

    const paidAt = payment?.paid_at
        ? new Date(payment.paid_at * 1000)
        : attrs.paid_at
            ? new Date(attrs.paid_at * 1000)
            : new Date()

    console.log("💰 Figures — paid: ₱", amountPaid, "| vat: ₱", vatFromMeta, "| fee: ₱", paymongoFee, "| net: ₱", netAmount, "| at:", paidAt.toISOString())
    console.log("💰 Starting DB transaction...")

    try {
        await db.transaction(async (tx) => {
            // Step 1 — update orders with optimistic lock
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
                        ne(orders.paymentStatus, "paid")   // optimistic lock — prevents double-pay
                    )
                )
                .returning({ id: orders.id })

            console.log("💰 [tx] orders rows updated:", updatedOrders.length)

            if (updatedOrders.length === 0) {
                console.warn("💰 [tx] ⚠️ 0 rows — concurrent webhook already committed, throwing AlreadyPaidError")
                throw new AlreadyPaidError()
            }

            // Step 2 — update payment_history
            // IMPORTANT: match on (orderId AND idempotencyKey IS NULL) so we only
            // update the pending row, not a row that was already stamped by a prior event.
            // This also avoids the unique-constraint 23505 error — we never try to SET
            // idempotencyKey on a row that already has one.
            const updatedHistory = await tx
                .update(paymentHistory)
                .set({
                    status: "paid",
                    paymentIntentId: paymentIntentId ?? data.id,
                    idempotencyKey: eventId,          // write idempotency key atomically
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
                .where(
                    and(
                        eq(paymentHistory.orderId, orderId),
                        isNull(paymentHistory.idempotencyKey)  // only the un-stamped pending row
                    )
                )
                .returning({ id: paymentHistory.id })

            console.log("💰 [tx] paymentHistory rows updated:", updatedHistory.length)

            if (updatedHistory.length === 0) {
                // Not fatal — order is already confirmed above. Log for investigation.
                console.error("💰 [tx] ⚠️ paymentHistory: 0 rows matched (orderId:", orderId, ", idempotencyKey IS NULL)")
                console.error("💰 [tx]    Possible cause: payment_history row missing, or already stamped.")
                console.error("💰 [tx]    Order status WAS set to 'paid' — only audit trail is incomplete.")
            }
        })

        console.log("💰 ✅ Transaction committed — order confirmed")
    } catch (err) {
        if (err instanceof AlreadyPaidError) {
            console.log("💰 ⏭️ AlreadyPaidError caught — returning success")
            return { success: true, message: "Order already paid (concurrent webhook)", orderId, trackingNumber, orderStatus: "confirmed", paymentStatus: "paid" }
        }
        console.error("💰 ❌ Transaction error:", err)
        throw err
    }

    console.log("💰 [handlePaymentSuccess] ===== DONE ✅ =====")
    return { success: true, message: "Payment processed successfully", orderId, trackingNumber, orderStatus: "confirmed", paymentStatus: "paid" }
}

// ==================== PAYMENT FAILED ====================

async function handlePaymentFailed(
    data: PayMongoWebhookEvent["attributes"]["data"],
    eventId: string
): Promise<WebhookResult> {
    const { orderId, trackingNumber } = extractMetadata(data)
    console.log("❌ [handlePaymentFailed] orderId:", orderId, "| eventId:", eventId)

    if (!orderId) return { success: false, message: "Missing order_id in metadata" }
    if (await isAlreadyProcessed(eventId)) return { success: true, message: "Event already processed (idempotent)", orderId, trackingNumber }

    const existingOrder = await getOrder(orderId)
    if (!existingOrder) return { success: false, message: `Order not found: ${orderId}` }

    if (existingOrder.paymentStatus === "paid") {
        console.log("❌ ⏭️ Order already paid — ignoring failure event")
        return { success: true, message: "Order already paid, ignoring failure", orderId, trackingNumber, orderStatus: existingOrder.status, paymentStatus: "paid" }
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
                rawResponse: { event_id: eventId, status: "failed", failed_at: new Date().toISOString() },
            })
            .where(and(eq(paymentHistory.orderId, orderId), isNull(paymentHistory.idempotencyKey)))
    })

    console.log("❌ ✅ Failure recorded")
    return { success: true, message: "Payment failure recorded", orderId, trackingNumber, orderStatus: "pending", paymentStatus: "failed" }
}

// ==================== CHECKOUT EXPIRED ====================

async function handleCheckoutExpired(
    data: PayMongoWebhookEvent["attributes"]["data"],
    eventId: string
): Promise<WebhookResult> {
    const { orderId, trackingNumber } = extractMetadata(data)
    console.log("⏰ [handleCheckoutExpired] orderId:", orderId, "| eventId:", eventId)

    if (!orderId) return { success: false, message: "Missing order_id in metadata" }
    if (await isAlreadyProcessed(eventId)) return { success: true, message: "Event already processed (idempotent)", orderId, trackingNumber }

    const existingOrder = await getOrder(orderId)
    if (!existingOrder) return { success: false, message: `Order not found: ${orderId}` }

    if (existingOrder.paymentStatus === "paid") {
        console.log("⏰ ⏭️ Already paid — ignoring expiry")
        return { success: true, message: "Order already paid", orderId, trackingNumber, orderStatus: existingOrder.status, paymentStatus: "paid" }
    }

    if (existingOrder.status === "cancelled") {
        console.log("⏰ ⏭️ Already cancelled")
        return { success: true, message: "Order already cancelled", orderId, trackingNumber, orderStatus: "cancelled", paymentStatus: existingOrder.paymentStatus ?? "unpaid" }
    }

    await db.transaction(async (tx) => {
        await tx
            .update(orders)
            .set({ paymentStatus: "unpaid", status: "cancelled", cancelledAt: new Date(), cancelledBy: "system", cancellationReason: "Payment session expired", updatedAt: new Date() })
            .where(eq(orders.id, orderId))

        await tx
            .update(paymentHistory)
            .set({
                status: "failed",
                idempotencyKey: eventId,
                updatedAt: new Date(),
                rawResponse: { event_id: eventId, status: "expired", expired_at: new Date().toISOString() },
            })
            .where(and(eq(paymentHistory.orderId, orderId), isNull(paymentHistory.idempotencyKey)))
    })

    console.log("⏰ ✅ Order cancelled — session expired")
    return { success: true, message: "Order cancelled - payment expired", orderId, trackingNumber, orderStatus: "cancelled", paymentStatus: "unpaid" }
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

    console.log("═══════════════════════════════════════")
    console.log("📨 [processWebhookEvent]")
    console.log("   eventType:  ", eventType)
    console.log("   eventId:    ", eventId)
    console.log("   livemode:   ", event.attributes.livemode)
    console.log("   data.id:    ", eventData.id)
    console.log("   data.type:  ", eventData.type)
    console.log("   data.status:", eventData.attributes?.status ?? "N/A")
    console.log("   amount (¢): ", eventData.attributes?.amount ?? "N/A")
    console.log("═══════════════════════════════════════")

    try {
        const dump = JSON.stringify(eventData.attributes, null, 2)
        for (let i = 0; i < dump.length; i += 2000) {
            console.log(dump.slice(i, i + 2000))
        }
    } catch { /* ignore */ }

    try {
        switch (eventType) {
            case "checkout_session.payment.paid":
            case "payment_intent.succeeded":
            case "payment.paid":
                return await handlePaymentSuccess(eventData, eventId)

            case "checkout_session.payment.failed":
            case "payment_intent.payment_failed":
            case "payment.failed":
                return await handlePaymentFailed(eventData, eventId)

            case "checkout_session.expired":
            case "checkout_session.payment.expired":
                return await handleCheckoutExpired(eventData, eventId)

            default:
                console.warn("📨 ⚠️ Unhandled event type:", eventType)
                return { success: true, message: `Event ${eventType} acknowledged` }
        }
    } catch (error) {
        console.error("📨 ❌ Uncaught error in processWebhookEvent:", error instanceof Error ? error.message : error)
        throw error
    }
}