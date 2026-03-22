import { Context } from "hono"
import { z } from "zod"
import { eq, inArray } from "drizzle-orm"
import { db } from "@/lib/supabase/db"
import { blindsProducts } from "@/schema/products/blinds/blinds-product"
import { blindsProductColors } from "@/schema/products/blinds/blinds-product-colors"
import { orderItems, orders } from "@/schema/orders/orders"
import { paymentHistory } from "@/schema/orders/payment-history/payment-history"
import { createOrderPaymentSession } from "../services/nodemailer/paymongo/order-checkout-payment"
// ==================== UTILS ====================

function generateTrackingNumber(): string {
    const ts = Date.now().toString(36).toUpperCase()
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `BLD-${ts}-${rand}`
}

function generateReferenceNumber(): string {
    return `REF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

// ==================== VALIDATION ====================

const CheckoutSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(10, "Valid phone is required"),
    phoneSecondary: z.string().optional(),
    paymentMethod: z.enum(["gcash", "paymaya"]),
    agreeTerms: z.literal(true, {
        error: () => ({ message: "You must agree to the terms" }),
    }),
    deliveryNotes: z.string().optional(),
    address: z.object({
        unitFloor: z.string().optional(),
        street: z.string().min(1, "Street is required"),
        barangay: z.string().min(1, "Barangay is required"),
        city: z.string().min(1, "City is required"),
        province: z.string().min(1, "Province is required"),
        zipCode: z.string().min(4, "Valid zip code is required"),
    }),
    coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
        formattedAddress: z.string(),
    }),
    items: z
        .array(
            z.object({
                productId: z.string().uuid("Invalid product ID"),
                colorId: z.string().uuid("Invalid color ID").optional(),
                quantity: z.number().int().min(1, "Quantity must be at least 1"),
            })
        )
        .min(1, "At least one item is required"),
})

type CheckoutInput = z.infer<typeof CheckoutSchema>

// ==================== CONTROLLER ====================

export const checkoutOrder = async (ctx: Context) => {
    try {
        // 1. Parse + validate body
        const body = await ctx.req.json()
        const parsed = CheckoutSchema.safeParse(body)

        if (!parsed.success) {
            return ctx.json(
                {
                    success: false,
                    message: "Validation failed",
                    errors: parsed.error.flatten().fieldErrors,
                },
                400
            )
        }

        const input: CheckoutInput = parsed.data

        // 2. Fetch products — validate existence and active status
        const productIds = input.items.map((i) => i.productId)

        const fetchedProducts = await db
            .select({
                id: blindsProducts.id,
                name: blindsProducts.name,
                productCode: blindsProducts.productCode,
                unitPrice: blindsProducts.unitPrice,
                status: blindsProducts.status,
            })
            .from(blindsProducts)
            .where(inArray(blindsProducts.id, productIds))

        const productMap = new Map(fetchedProducts.map((p) => [p.id, p]))

        for (const item of input.items) {
            const product = productMap.get(item.productId)
            if (!product) {
                return ctx.json(
                    { success: false, message: `Product not found: ${item.productId}` },
                    404
                )
            }
            if (product.status !== "active") {
                return ctx.json(
                    {
                        success: false,
                        message: `Product "${product.name}" is no longer available`,
                    },
                    400
                )
            }
        }

        // 3. Fetch and validate color IDs (only those provided)
        const colorIds = input.items
            .filter((i) => i.colorId)
            .map((i) => i.colorId!)

        const colorMap = new Map<string, { id: string; name: string }>()

        if (colorIds.length > 0) {
            const fetchedColors = await db
                .select({
                    id: blindsProductColors.id,
                    name: blindsProductColors.name,
                })
                .from(blindsProductColors)
                .where(inArray(blindsProductColors.id, colorIds))

            fetchedColors.forEach((c) => colorMap.set(c.id, c))

            // Validate all provided color IDs actually exist
            for (const item of input.items) {
                if (item.colorId && !colorMap.has(item.colorId)) {
                    return ctx.json(
                        { success: false, message: `Color not found: ${item.colorId}` },
                        404
                    )
                }
            }
        }

        // 4. Compute line items and financials
        //    unitPrice in blinds_products is stored as integer whole PHP (e.g. 1500 = ₱1,500)
        //    Adjust the division below if you store centavos instead
        const PROCESSING_FEE = 10   // ₱10 fixed online payment fee
        const DELIVERY_FEE = 150    // ₱150 flat delivery — adjust as needed

        let subtotal = 0

        const computedItems = input.items.map((item) => {
            const product = productMap.get(item.productId)!
            const unitPrice = product.unitPrice  // whole PHP integer
            const itemSubtotal = unitPrice * item.quantity
            subtotal += itemSubtotal

            return {
                productId: product.id,
                productName: product.name,
                productCode: product.productCode,
                quantity: item.quantity,
                unitPrice,
                subtotal: itemSubtotal,
                colorId: item.colorId ?? null,
                colorName: item.colorId ? (colorMap.get(item.colorId)?.name ?? null) : null,
            }
        })

        const deliveryFee = DELIVERY_FEE
        const processingFee = PROCESSING_FEE
        const totalAmount = subtotal + deliveryFee + processingFee

        // 5. Generate identifiers
        const trackingNumber = generateTrackingNumber()
        const referenceNumber = generateReferenceNumber()

        // 6. Persist order + items + payment history in one transaction
        //    Always write to DB first — if PayMongo fails we still have a record
        let newOrderId!: string

        await db.transaction(async (tx) => {
            // Insert order
            const [newOrder] = await tx
                .insert(orders)
                .values({
                    trackingNumber,
                    referenceNumber,
                    status: "pending",
                    paymentStatus: "unpaid",
                    paymentMethod: input.paymentMethod,
                    orderType: "delivery",

                    customerFirstName: input.firstName,
                    customerLastName: input.lastName,
                    customerEmail: input.email,
                    customerPhone: input.phone,
                    customerPhoneSecondary: input.phoneSecondary ?? null,

                    deliveryUnitFloor: input.address.unitFloor ?? null,
                    deliveryStreet: input.address.street,
                    deliveryBarangay: input.address.barangay,
                    deliveryCity: input.address.city,
                    deliveryProvince: input.address.province,
                    deliveryZipCode: input.address.zipCode,
                    deliveryFormattedAddress: input.coordinates.formattedAddress,
                    deliveryLat: input.coordinates.lat.toString(),
                    deliveryLng: input.coordinates.lng.toString(),
                    deliveryNotes: input.deliveryNotes ?? null,

                    subtotal: subtotal.toFixed(2),
                    deliveryFee: deliveryFee.toFixed(2),
                    processingFee: processingFee.toFixed(2),
                    totalAmount: totalAmount.toFixed(2),
                })
                .returning({ id: orders.id })

            newOrderId = newOrder.id

            // Insert order items (product snapshot at time of order)
            await tx.insert(orderItems).values(
                computedItems.map((item) => ({
                    orderId: newOrderId,
                    productId: item.productId,
                    productName: item.productName,
                    productCode: item.productCode,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice.toFixed(2),
                    subtotal: item.subtotal.toFixed(2),
                    colorId: item.colorId,
                    colorName: item.colorName,
                }))
            )

            // Insert payment_history in pending state
            // sessionId + paymentIntentId + expiresAt are filled after PayMongo responds
            await tx.insert(paymentHistory).values({
                orderId: newOrderId,
                status: "pending",
                paymentMethod: input.paymentMethod,
                referenceNumber,
                // processingFee, amountPaid, netAmount, paidAt set by webhook on success
            })
        })

        // 7. Call PayMongo to create the checkout session
        const paymentSession = await createOrderPaymentSession({
            orderId: newOrderId,
            trackingNumber,
            referenceNumber,
            customerFirstName: input.firstName,
            customerLastName: input.lastName,
            customerEmail: input.email,
            customerPhone: input.phone,
            customerPhoneSecondary: input.phoneSecondary,
            amount: totalAmount,
            subtotal,
            deliveryFee,
            processingFee,
            orderType: "delivery",
            paymentMethod: input.paymentMethod,
            items: computedItems.map((item) => ({
                name: item.productName,
                quantity: item.quantity,
                price: item.unitPrice,
            })),
        })

        // 8. If PayMongo fails, mark order cancelled + record reason
        if (!paymentSession.success) {
            console.error("❌ PayMongo session failed:", paymentSession.error)

            await db.transaction(async (tx) => {
                await tx
                    .update(orders)
                    .set({
                        status: "cancelled",
                        cancelledBy: "system",
                        cancellationReason: `Payment session creation failed: ${paymentSession.error}`,
                        cancelledAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(eq(orders.id, newOrderId))

                await tx
                    .update(paymentHistory)
                    .set({
                        status: "failed",
                        updatedAt: new Date(),
                        rawResponse: {
                            error: paymentSession.error,
                            failed_at: new Date().toISOString(),
                        },
                    })
                    .where(eq(paymentHistory.orderId, newOrderId))
            })

            return ctx.json(
                {
                    success: false,
                    message: "Failed to initialize payment. Please try again.",
                    error: paymentSession.error,
                },
                502
            )
        }

        // 9. Backfill session details into payment_history now that PayMongo responded
        await db
            .update(paymentHistory)
            .set({
                sessionId: paymentSession.sessionId,
                paymentIntentId: paymentSession.paymentIntentId,
                expiresAt: paymentSession.expiresAt,
                updatedAt: new Date(),
            })
            .where(eq(paymentHistory.orderId, newOrderId))

        // 10. Return checkout URL to the frontend
        return ctx.json(
            {
                success: true,
                message: "Order created successfully",
                data: {
                    orderId: newOrderId,
                    trackingNumber,
                    referenceNumber,
                    checkoutUrl: paymentSession.checkoutUrl,
                    sessionId: paymentSession.sessionId,
                    expiresAt: paymentSession.expiresAt,
                    summary: {
                        subtotal,
                        deliveryFee,
                        processingFee,
                        totalAmount,
                        itemCount: computedItems.length,
                    },
                },
            },
            201
        )
    } catch (error) {
        console.error("❌ checkoutOrder error:", error)
        return ctx.json(
            {
                success: false,
                message: "An unexpected error occurred. Please try again.",
            },
            500
        )
    }
}