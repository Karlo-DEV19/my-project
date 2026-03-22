import { Hono } from "hono"
import {
    PayMongoWebhookPayload,
    processWebhookEvent,
    verifyWebhookSignature,
} from "@/app/api/services/nodemailer/paymongo/payment-webhook"

const webhooksRoute = new Hono()

// GET /api/v1/webhooks/test
webhooksRoute.get("/test", (c) => {
    return c.json({ success: true, message: "Webhook route works!" })
})

// POST /api/v1/webhooks/paymongo
webhooksRoute.post("/paymongo", async (c) => {
    console.log("═══════════════════════════════════")
    console.log("🔔 Webhook received:", new Date().toISOString())

    try {
        const rawBody = await c.req.text()
        const signatureHeader = c.req.header("paymongo-signature") ?? ""

        console.log("📦 Body length:", rawBody.length)
        console.log("🔑 Signature present:", !!signatureHeader)

        if (!rawBody) {
            console.error("❌ Empty body")
            return c.json({ success: false, message: "Empty request body" }, 400)
        }

        // 1. Verify PayMongo signature
        const verification = verifyWebhookSignature(rawBody, signatureHeader)
        if (!verification.valid) {
            console.error("❌ Signature invalid:", verification.error)
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
            return c.json({ success: false, message: "Invalid JSON payload" }, 400)
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
            return c.json({ success: false, message: "Invalid event structure" }, 400)
        }

        console.log("📨 Event type:", event.attributes.type)
        console.log("📨 Event ID:", event.id)

        // 4. Process event
        const result = await processWebhookEvent(payload)

        console.log("✅ Result:", result.message)
        if (result.orderId) {
            console.log("   Order:", result.orderId)
            console.log("   Status:", result.orderStatus, "/", result.paymentStatus)
        }
        console.log("═══════════════════════════════════")

        // PayMongo expects a 2xx — always return 200 even for business-logic failures
        return c.json(result, 200)
    } catch (error) {
        console.error("❌ Webhook error:", error instanceof Error ? error.message : error)
        return c.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Webhook processing failed",
            },
            500
        )
    }
})

// GET /api/v1/webhooks/paymongo/status
webhooksRoute.get("/paymongo/status", (c) => {
    return c.json({
        success: true,
        active: true,
        configured: !!process.env.PAYMONGO_WEBHOOK_SECRET,
        endpoint: "/api/v1/webhooks/paymongo",
        supportedEvents: [
            "checkout_session.payment.paid",
            "payment.paid",
            "payment.failed",
            "checkout_session.expired",
        ],
        timestamp: new Date().toISOString(),
    })
})

export default webhooksRoute