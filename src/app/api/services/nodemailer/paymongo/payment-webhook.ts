import crypto from "crypto"
import { db } from "@/lib/supabase/db"
import { and, eq, isNull, ne } from "drizzle-orm"
import { orders, orderItems } from "@/schema/orders/orders"
import { paymentHistory } from "@/schema/orders/payment-history/payment-history"
import { sendOrderStatusEmail } from "../send-order-status-service"

const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET ?? ""

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
    if (!PAYMONGO_WEBHOOK_SECRET) {
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
                parts[part.substring(0, equalIndex).trim()] = part.substring(equalIndex + 1).trim()
            }
        })

        const timestamp = parts["t"]
        const signature =
            parts["te"]?.length > 0
                ? parts["te"]
                : parts["li"]?.length > 0
                    ? parts["li"]
                    : null

        if (!timestamp) return { valid: false, error: "Missing timestamp in signature header" }
        if (!signature) return { valid: false, error: "Missing signature value (te or li)" }

        const expectedSignature = crypto
            .createHmac("sha256", PAYMONGO_WEBHOOK_SECRET)
            .update(`${timestamp}.${payload}`)
            .digest("hex")

        let isValid = false
        try {
            const expBuf = Buffer.from(expectedSignature, "hex")
            const recBuf = Buffer.from(signature, "hex")
            isValid =
                expBuf.length === recBuf.length
                    ? crypto.timingSafeEqual(expBuf, recBuf)
                    : signature === expectedSignature
        } catch {
            isValid = signature === expectedSignature
        }

        return isValid ? { valid: true } : { valid: false, error: "Signature mismatch" }
    } catch {
        return { valid: false, error: "Verification exception" }
    }
}

// ==================== EXTRACT METADATA ====================

function extractMetadata(data: PayMongoWebhookEvent["attributes"]["data"]): {
    orderId: string | null
    trackingNumber: string | null
    paymentIntentId: string | null
} {
    const attrs = data.attributes

    const intentMeta: Record<string, any> = attrs.payment_intent?.attributes?.metadata ?? {}
    const checkoutMeta: Record<string, any> = attrs.metadata ?? {}
    const paymentMeta: Record<string, any> = attrs.payments?.[0]?.attributes?.metadata ?? {}

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

    return { orderId, trackingNumber, paymentIntentId }
}

// ==================== HELPERS ====================

async function getOrder(orderId: string) {
    const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1)

    return order ?? null
}

async function isAlreadyProcessed(eventId: string): Promise<boolean> {
    const [existing] = await db
        .select({ id: paymentHistory.id })
        .from(paymentHistory)
        .where(eq(paymentHistory.idempotencyKey, eventId))
        .limit(1)

    return !!existing
}

function safeDivide(numerator: number, denominator: number): number {
    if (!denominator || isNaN(denominator)) return 0
    const result = numerator / denominator
    return isNaN(result) ? 0 : result
}

function centavosToPhp(centavos: number | undefined | null): number {
    const val = Number(centavos)
    if (isNaN(val) || !isFinite(val)) return 0
    return val / 100
}

async function getOrderItems(orderId: string) {
    return await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId))
}

// ==================== ALREADY PAID SENTINEL ====================

class AlreadyPaidError extends Error {
    constructor() {
        super("AlreadyPaidError")
        this.name = "AlreadyPaidError"
    }
}

// ==================== PAYMENT SUCCESS ====================

async function handlePaymentSuccess(
    data: PayMongoWebhookEvent["attributes"]["data"],
    eventId: string
): Promise<WebhookResult> {
    const { orderId, trackingNumber, paymentIntentId } = extractMetadata(data)

    if (!orderId) {
        return { success: false, message: "Missing order_id in metadata" }
    }

    if (await isAlreadyProcessed(eventId)) {
        return { success: true, message: "Event already processed (idempotent)", orderId, trackingNumber }
    }

    const existingOrder = await getOrder(orderId)
    if (!existingOrder) {
        return { success: false, message: `Order not found: ${orderId}` }
    }

    if (existingOrder.paymentStatus === "paid") {
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

    const amountPaid = centavosToPhp(payment?.amount ?? attrs.amount)
    const paymongoFee = centavosToPhp(payment?.fee ?? attrs.fee ?? 0)
    const netAmount = centavosToPhp(payment?.net_amount ?? attrs.net_amount ?? attrs.amount)

    const vatRaw =
        (attrs.payment_intent?.attributes?.metadata?.vat as string | undefined) ??
        (attrs.metadata?.vat as string | undefined) ??
        (attrs.payments?.[0]?.attributes?.metadata?.vat as string | undefined) ??
        "0"
    const vatFromMeta = parseFloat(vatRaw)
    const vatAmount = isNaN(vatFromMeta) ? 0 : vatFromMeta

    const paidAt = payment?.paid_at
        ? new Date(payment.paid_at * 1000)
        : attrs.paid_at
            ? new Date(attrs.paid_at * 1000)
            : new Date()

    try {
        await db.transaction(async (tx) => {
            const updatedOrders = await tx
                .update(orders)
                .set({
                    paymentStatus: "downpaid",
                    status: "confirmed",
                    downpaymentStatus: "paid",
                    downpaymentPaidAt: paidAt,
                    confirmedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(orders.id, orderId),
                        ne(orders.paymentStatus, "paid"),
                        ne(orders.paymentStatus, "downpaid")
                    )
                )
                .returning({ id: orders.id })

            if (updatedOrders.length === 0) {
                throw new AlreadyPaidError()
            }

            await tx
                .update(paymentHistory)
                .set({
                    status: "paid",
                    paymentIntentId: paymentIntentId ?? data.id,
                    idempotencyKey: eventId,
                    amountPaid: amountPaid.toFixed(2),
                    vat: vatAmount.toFixed(2),
                    netAmount: netAmount.toFixed(2),
                    paidAt,
                    updatedAt: new Date(),
                    rawResponse: {
                        event_id: eventId,
                        amount_paid: amountPaid,
                        vat: vatAmount,
                        paymongo_fee: paymongoFee,
                        net_amount: netAmount,
                        currency: attrs.currency,
                        paid_at: paidAt.toISOString(),
                    },
                })
                .where(
                    and(
                        eq(paymentHistory.orderId, orderId),
                        isNull(paymentHistory.idempotencyKey)
                    )
                )
        })
    } catch (err) {
        if (err instanceof AlreadyPaidError) {
            return {
                success: true,
                message: "Order already paid (concurrent webhook)",
                orderId,
                trackingNumber,
                orderStatus: "confirmed",
                paymentStatus: "downpaid",
            }
        }
        throw err
    }

    // ── Send Confirmation Email ──
    try {
        const items = await getOrderItems(orderId)
        await sendOrderStatusEmail(existingOrder, items, "paid")
    } catch (emailErr) {
        console.error("⚠️ Failed to send success email:", emailErr)
    }

    return {
        success: true,
        message: "Downpayment processed successfully",
        orderId,
        trackingNumber,
        orderStatus: "confirmed",
        paymentStatus: "downpaid",
    }
}

// ==================== PAYMENT FAILED ====================

async function handlePaymentFailed(
    data: PayMongoWebhookEvent["attributes"]["data"],
    eventId: string
): Promise<WebhookResult> {
    const { orderId, trackingNumber } = extractMetadata(data)

    if (!orderId) return { success: false, message: "Missing order_id in metadata" }
    if (await isAlreadyProcessed(eventId)) {
        return { success: true, message: "Event already processed (idempotent)", orderId, trackingNumber }
    }

    const existingOrder = await getOrder(orderId)
    if (!existingOrder) return { success: false, message: `Order not found: ${orderId}` }

    if (existingOrder.paymentStatus === "paid" || existingOrder.paymentStatus === "downpaid") {
        return {
            success: true,
            message: "Order already paid, ignoring failure",
            orderId,
            trackingNumber,
            orderStatus: existingOrder.status,
            paymentStatus: existingOrder.paymentStatus,
        }
    }

    await db.transaction(async (tx) => {
        await tx
            .update(orders)
            .set({
                paymentStatus: "failed",
                downpaymentStatus: "failed",
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId))

        await tx
            .update(paymentHistory)
            .set({
                status: "failed",
                idempotencyKey: eventId,
                updatedAt: new Date(),
                rawResponse: { event_id: eventId, status: "failed", failed_at: new Date().toISOString() },
            })
            .where(
                and(
                    eq(paymentHistory.orderId, orderId),
                    isNull(paymentHistory.idempotencyKey)
                )
            )
    })

    // ── Send Failure Email ──
    try {
        const items = await getOrderItems(orderId)
        await sendOrderStatusEmail(existingOrder, items, "failed")
    } catch (emailErr) {
        console.error("⚠️ Failed to send failure email:", emailErr)
    }

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

    if (!orderId) return { success: false, message: "Missing order_id in metadata" }
    if (await isAlreadyProcessed(eventId)) {
        return { success: true, message: "Event already processed (idempotent)", orderId, trackingNumber }
    }

    const existingOrder = await getOrder(orderId)
    if (!existingOrder) return { success: false, message: `Order not found: ${orderId}` }

    if (existingOrder.paymentStatus === "paid" || existingOrder.paymentStatus === "downpaid") {
        return {
            success: true,
            message: "Order already paid",
            orderId,
            trackingNumber,
            orderStatus: existingOrder.status,
            paymentStatus: existingOrder.paymentStatus,
        }
    }

    if (existingOrder.status === "cancelled") {
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
                downpaymentStatus: "failed",
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
                rawResponse: { event_id: eventId, status: "expired", expired_at: new Date().toISOString() },
            })
            .where(
                and(
                    eq(paymentHistory.orderId, orderId),
                    isNull(paymentHistory.idempotencyKey)
                )
            )
    })

    // ── Send Cancellation Email ──
    try {
        const items = await getOrderItems(orderId)
        await sendOrderStatusEmail(existingOrder, items, "cancelled")
    } catch (emailErr) {
        console.error("⚠️ Failed to send expiry email:", emailErr)
    }

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
    const eventId = event.id

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
                return { success: true, message: `Event ${eventType} acknowledged` }
        }
    } catch (error) {
        throw error
    }
}