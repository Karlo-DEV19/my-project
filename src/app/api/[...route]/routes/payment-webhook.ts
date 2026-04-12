import { Hono } from "hono"
import {
    PayMongoWebhookPayload,
    processWebhookEvent,
    verifyWebhookSignature,
} from "@/app/api/services/paymongo/payment-webhook"

const webhooksRoute = new Hono()

// ==================== HELPERS ====================

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

webhooksRoute.get("/test", (c) => {
    return c.json({ success: true, message: "Webhook route works!" })
})

// ==================== PAYMONGO WEBHOOK ====================

webhooksRoute.post("/paymongo", async (c) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    console.log("═══════════════════════════════════════════════════")
    console.log(`🔔 [${requestId}] POST /paymongo received at ${new Date().toISOString()}`)
    console.log(`🔔 [${requestId}] URL: ${c.req.url}`)

    // Log all request headers so we can confirm paymongo-signature is arriving
    const allHeaders: Record<string, string> = {}
    c.req.raw.headers.forEach((value, key) => { allHeaders[key] = value })
    console.log(`🔔 [${requestId}] Headers:`, JSON.stringify(allHeaders, null, 2))

    // !! Read raw body FIRST before any other c.req calls !!
    const rawBody = await c.req.text()
    const signatureHeader = c.req.header("paymongo-signature") ?? ""

    console.log(`📦 [${requestId}] Body length: ${rawBody.length}`)
    console.log(`📦 [${requestId}] Body preview (first 500): ${rawBody.slice(0, 500)}`)
    console.log(`🔑 [${requestId}] paymongo-signature: ${signatureHeader ? signatureHeader.slice(0, 80) + "..." : "❌ MISSING"}`)

    if (!rawBody) {
        console.error(`❌ [${requestId}] Empty body`)
        return c.json({ success: false, message: "Empty request body" }, 200)
    }

    // 1. Verify PayMongo HMAC signature
    const verification = verifyWebhookSignature(rawBody, signatureHeader)
    if (!verification.valid) {
        console.error(`❌ [${requestId}] Signature invalid: ${verification.error}`)
        // 401 intentional — bad signature should NOT be retried by PayMongo
        return c.json({ success: false, message: "Invalid signature", error: verification.error }, 401)
    }
    console.log(`✅ [${requestId}] Signature verified`)

    // 2. Parse JSON
    let payload: PayMongoWebhookPayload
    try {
        payload = JSON.parse(rawBody)
        console.log(`✅ [${requestId}] JSON parsed`)
    } catch (parseErr) {
        console.error(`❌ [${requestId}] JSON parse failed:`, parseErr)
        return c.json({ success: false, message: "Invalid JSON payload" }, 200)
    }

    // 3. Validate envelope shape
    const event = payload.data
    console.log(`📨 [${requestId}] Envelope:`)
    console.log(`   payload.data:             ${!!payload.data}`)
    console.log(`   payload.data.id:          ${event?.id ?? "❌ MISSING"}`)
    console.log(`   .attributes.type:         ${event?.attributes?.type ?? "❌ MISSING"}`)
    console.log(`   .attributes.data:         ${event?.attributes?.data ? "present" : "❌ MISSING"}`)
    console.log(`   .attributes.livemode:     ${event?.attributes?.livemode}`)

    if (!event?.id || !event?.attributes?.type || !event?.attributes?.data) {
        console.error(`❌ [${requestId}] Invalid event envelope`)
        return c.json({ success: false, message: "Invalid event structure" }, 200)
    }

    console.log(`📨 [${requestId}] eventType: ${event.attributes.type} | eventId: ${event.id}`)

    // 4. Process the event
    try {
        console.log(`⚙️  [${requestId}] Calling processWebhookEvent...`)
        const result = await processWebhookEvent(payload)

        console.log(`✅ [${requestId}] Result:`, JSON.stringify(result))
        console.log("═══════════════════════════════════════════════════")
        return c.json(result, 200)
    } catch (error) {
        if (isIdempotencyConflict(error)) {
            console.warn(`⚠️  [${requestId}] Idempotency conflict (23505) — already processed by concurrent request`)
            console.log("═══════════════════════════════════════════════════")
            return c.json({ success: true, message: "Event already processed (concurrent)" }, 200)
        }

        const errMsg = error instanceof Error ? error.message : String(error)
        const errStack = error instanceof Error ? error.stack : ""
        console.error(`❌ [${requestId}] Unhandled error: ${errMsg}`)
        console.error(`❌ [${requestId}] Stack: ${errStack}`)
        console.log("═══════════════════════════════════════════════════")

        // Return 200 intentionally — non-2xx causes PayMongo to retry, risking double-processing
        return c.json({ success: false, message: "Webhook processing failed — logged for investigation" }, 200)
    }
})

// ==================== STATUS ====================
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