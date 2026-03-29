import { Hono } from "hono"
import {
    PayMongoWebhookPayload,
    processWebhookEvent,
    verifyWebhookSignature,
} from "@/app/api/services/nodemailer/paymongo/payment-webhook"

const webhooksRoute = new Hono()

// ==================== HELPERS ====================

/**
 * Detect a unique-constraint violation coming from the idempotency_key column.
 * Postgres error code 23505 = unique_violation.
 * Drizzle surfaces this as a plain Error with the pg message in .message.
 */
function isIdempotencyConflict(error: unknown): boolean {
    if (error instanceof Error) {
        return (
            error.message.includes("23505") ||
            error.message.toLowerCase().includes("unique") ||
            error.message.toLowerCase().includes("idempotency")
        )
    }
    return false
}

// ==================== TEST ====================

// GET /api/v1/webhooks/test
webhooksRoute.get("/test", (c) => {
    return c.json({ success: true, message: "Webhook route works!" })
})

// ==================== PAYMONGO WEBHOOK ====================

// POST /api/v1/webhooks/paymongo
webhooksRoute.post("/paymongo", async (c) => {
    console.log("═══════════════════════════════════")
    console.log("🔔 Webhook received:", new Date().toISOString())

    // Read raw body FIRST — calling c.req.text() after c.req.json() returns empty string
    const rawBody = await c.req.text()
    const signatureHeader = c.req.header("paymongo-signature") ?? ""

    console.log("📦 Body length:", rawBody.length)
    console.log("🔑 Signature present:", !!signatureHeader)

    if (!rawBody) {
        console.error("❌ Empty body")
        // Return 200 so PayMongo doesn't retry an empty-body delivery
        return c.json({ success: false, message: "Empty request body" }, 200)
    }

    // 1. Verify PayMongo signature
    const verification = verifyWebhookSignature(rawBody, signatureHeader)
    if (!verification.valid) {
        console.error("❌ Signature invalid:", verification.error)
        // 401 is intentional here — bad signatures should NOT be retried
        return c.json(
            { success: false, message: "Invalid signature", error: verification.error },
            401
        )
    }

    console.log("✅ Signature verified")

    // 2. Parse JSON
    let payload: PayMongoWebhookPayload
    try {
        payload = JSON.parse(rawBody)
    } catch {
        console.error("❌ Invalid JSON")
        // Return 200 — malformed JSON will never succeed on retry
        return c.json({ success: false, message: "Invalid JSON payload" }, 200)
    }

    // 3. Validate PayMongo event envelope: { data: { id, type, attributes: { type, data } } }
    const event = payload.data
    if (!event?.id || !event?.attributes?.type || !event?.attributes?.data) {
        console.error("❌ Invalid event structure", {
            hasData: !!payload.data,
            eventId: event?.id,
            eventType: event?.attributes?.type,
            hasEventData: !!event?.attributes?.data,
        })
        // Return 200 — structural failures won't be fixed by a retry
        return c.json({ success: false, message: "Invalid event structure" }, 200)
    }

    console.log("📨 Event type:", event.attributes.type)
    console.log("📨 Event ID:", event.id)

    // 4. Process event
    // ── Error handling strategy ────────────────────────────────────────────
    // PayMongo retries any non-2xx response. We therefore return 200 for ALL
    // outcomes EXCEPT a bad signature (401 above) — including unexpected errors.
    // Idempotency + optimistic locking inside processWebhookEvent() guarantee
    // that retries are safe and won't double-process a payment.
    // ──────────────────────────────────────────────────────────────────────
    try {
        const result = await processWebhookEvent(payload)

        console.log("✅ Result:", result.message)
        if (result.orderId) {
            console.log("   Order:", result.orderId)
            console.log("   Status:", result.orderStatus, "/", result.paymentStatus)
        }
        console.log("═══════════════════════════════════")

        return c.json(result, 200)
    } catch (error) {
        // Idempotency key conflict — a concurrent webhook already committed.
        // This is not an error; return 200 so PayMongo stops retrying.
        if (isIdempotencyConflict(error)) {
            console.warn("⚠️ Idempotency conflict detected — event already processed by concurrent request")
            console.log("═══════════════════════════════════")
            return c.json(
                { success: true, message: "Event already processed (concurrent)" },
                200
            )
        }

        // Any other unexpected error: log it, but still return 200.
        // Returning 500 here would cause PayMongo to retry indefinitely, which
        // risks duplicate processing once the transient error clears.
        // The error is logged for alerting; investigate via logs/APM.
        console.error("❌ Webhook processing error:", error instanceof Error ? error.message : error)
        console.log("═══════════════════════════════════")

        return c.json(
            {
                success: false,
                message: "Webhook processing failed — logged for investigation",
            },
            200  // ← intentional 200 to stop PayMongo retry loop
        )
    }
})

// ==================== STATUS ====================

// GET /api/v1/webhooks/paymongo/status
webhooksRoute.get("/paymongo/status", (c) => {
    return c.json({
        success: true,
        active: true,
        configured: !!process.env.PAYMONGO_WEBHOOK_SECRET,
        endpoint: "/api/v1/webhooks/paymongo",
        supportedEvents: [
            "checkout_session.payment.paid",
            "checkout_session.payment.failed",
            "checkout_session.payment.expired",
            "checkout_session.expired",
            "payment.paid",
            "payment.failed",
            "payment_intent.succeeded",
            "payment_intent.payment_failed",
        ],
        timestamp: new Date().toISOString(),
    })
})

export default webhooksRoute