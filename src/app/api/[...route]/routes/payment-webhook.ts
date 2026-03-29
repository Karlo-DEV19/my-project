import { Hono } from "hono"
import {
    PayMongoWebhookPayload,
    processWebhookEvent,
    verifyWebhookSignature,
} from "@/app/api/services/nodemailer/paymongo/payment-webhook"

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
    console.log(`🔔 [${requestId}] Webhook POST received: ${new Date().toISOString()}`)
    console.log(`🔔 [${requestId}] URL: ${c.req.url}`)
    console.log(`🔔 [${requestId}] Method: ${c.req.method}`)

    // Log all headers for diagnostics
    const allHeaders: Record<string, string> = {}
    c.req.raw.headers.forEach((value, key) => { allHeaders[key] = value })
    console.log(`🔔 [${requestId}] Headers:`, JSON.stringify(allHeaders, null, 2))

    // Read raw body FIRST
    const rawBody = await c.req.text()
    const signatureHeader = c.req.header("paymongo-signature") ?? ""

    console.log(`📦 [${requestId}] Body length: ${rawBody.length}`)
    console.log(`📦 [${requestId}] Body preview (first 500 chars): ${rawBody.slice(0, 500)}`)
    console.log(`🔑 [${requestId}] paymongo-signature header: ${signatureHeader ? signatureHeader.slice(0, 60) + "..." : "❌ MISSING"}`)

    if (!rawBody) {
        console.error(`❌ [${requestId}] Empty body — returning 200 to stop retry`)
        return c.json({ success: false, message: "Empty request body" }, 200)
    }

    // 1. Verify signature
    console.log(`🔐 [${requestId}] Verifying signature...`)
    const verification = verifyWebhookSignature(rawBody, signatureHeader)
    if (!verification.valid) {
        console.error(`❌ [${requestId}] Signature INVALID: ${verification.error}`)
        console.error(`❌ [${requestId}] Returning 401 — PayMongo will NOT retry 4xx`)
        return c.json(
            { success: false, message: "Invalid signature", error: verification.error },
            401
        )
    }
    console.log(`✅ [${requestId}] Signature verified`)

    // 2. Parse JSON
    let payload: PayMongoWebhookPayload
    try {
        payload = JSON.parse(rawBody)
        console.log(`✅ [${requestId}] JSON parsed OK`)
    } catch (parseErr) {
        console.error(`❌ [${requestId}] JSON parse failed:`, parseErr)
        return c.json({ success: false, message: "Invalid JSON payload" }, 200)
    }

    // 3. Validate envelope
    const event = payload.data
    console.log(`📨 [${requestId}] Envelope check:`)
    console.log(`   payload.data present:              ${!!payload.data}`)
    console.log(`   payload.data.id:                   ${event?.id ?? "❌ MISSING"}`)
    console.log(`   payload.data.attributes.type:      ${event?.attributes?.type ?? "❌ MISSING"}`)
    console.log(`   payload.data.attributes.data:      ${event?.attributes?.data ? "present" : "❌ MISSING"}`)
    console.log(`   payload.data.attributes.livemode:  ${event?.attributes?.livemode}`)

    if (!event?.id || !event?.attributes?.type || !event?.attributes?.data) {
        console.error(`❌ [${requestId}] Invalid event envelope — returning 200`)
        return c.json({ success: false, message: "Invalid event structure" }, 200)
    }

    console.log(`📨 [${requestId}] Event type: ${event.attributes.type}`)
    console.log(`📨 [${requestId}] Event ID:   ${event.id}`)

    // 4. Process
    try {
        console.log(`⚙️  [${requestId}] Calling processWebhookEvent...`)
        const result = await processWebhookEvent(payload)

        console.log(`✅ [${requestId}] processWebhookEvent returned:`, JSON.stringify(result))
        console.log("═══════════════════════════════════════════════════")

        return c.json(result, 200)
    } catch (error) {
        if (isIdempotencyConflict(error)) {
            console.warn(`⚠️  [${requestId}] Idempotency conflict — already processed concurrently`)
            console.log("═══════════════════════════════════════════════════")
            return c.json(
                { success: true, message: "Event already processed (concurrent)" },
                200
            )
        }

        const errMsg = error instanceof Error ? error.message : String(error)
        const errStack = error instanceof Error ? error.stack : ""
        console.error(`❌ [${requestId}] processWebhookEvent threw unexpected error:`)
        console.error(`   message: ${errMsg}`)
        console.error(`   stack:   ${errStack}`)
        console.log("═══════════════════════════════════════════════════")

        return c.json(
            {
                success: false,
                message: "Webhook processing failed — logged for investigation",
            },
            200
        )
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