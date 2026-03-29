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
    paymentMethod: z.enum(["gcash", "paymaya"], {
        error: () => ({ message: "Payment method must be gcash or paymaya" }),
    }),
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
    subtotal: z.number().positive("subtotal must be positive"),
    vat: z.number().min(0, "vat must be non-negative"),
    totalAmount: z.number().positive("totalAmount must be positive"),
})

type CheckoutInput = z.infer<typeof CheckoutSchema>

// ==================== CONTROLLER ====================

export const checkoutOrder = async (ctx: Context) => {
    const checkoutId = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    console.log(`🛒 [${checkoutId}] === checkoutOrder START ===`)

    try {
        // 1. Parse + validate
        const body = await ctx.req.json()
        console.log(`🛒 [${checkoutId}] Raw body keys:`, Object.keys(body))

        const parsed = CheckoutSchema.safeParse(body)
        if (!parsed.success) {
            console.error(`🛒 [${checkoutId}] ❌ Validation failed:`, parsed.error.flatten().fieldErrors)
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
        console.log(`🛒 [${checkoutId}] Validated input:`)
        console.log(`   email:         ${input.email}`)
        console.log(`   paymentMethod: ${input.paymentMethod}`)
        console.log(`   itemCount:     ${input.items.length}`)
        console.log(`   subtotal:      ₱${input.subtotal}`)
        console.log(`   vat:           ₱${input.vat}`)
        console.log(`   totalAmount:   ₱${input.totalAmount}`)

        // 2. Validate products
        const productIds = input.items.map((i) => i.productId)
        console.log(`🛒 [${checkoutId}] Fetching ${productIds.length} product(s):`, productIds)

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

        console.log(`🛒 [${checkoutId}] Products found in DB: ${fetchedProducts.length}/${productIds.length}`)
        fetchedProducts.forEach(p => {
            console.log(`   - ${p.id} | ${p.name} | ₱${p.unitPrice} | status: ${p.status}`)
        })

        const productMap = new Map(fetchedProducts.map((p) => [p.id, p]))

        for (const item of input.items) {
            const product = productMap.get(item.productId)
            if (!product) {
                console.error(`🛒 [${checkoutId}] ❌ Product not found: ${item.productId}`)
                return ctx.json({ success: false, message: `Product not found: ${item.productId}` }, 404)
            }
            if (product.status !== "active") {
                console.error(`🛒 [${checkoutId}] ❌ Product inactive: ${product.name} (${product.status})`)
                return ctx.json({ success: false, message: `Product "${product.name}" is no longer available` }, 400)
            }
        }

        // 3. Validate colors
        const colorIds = input.items.filter((i) => i.colorId).map((i) => i.colorId!)
        const colorMap = new Map<string, { id: string; name: string }>()

        if (colorIds.length > 0) {
            console.log(`🛒 [${checkoutId}] Fetching ${colorIds.length} color(s):`, colorIds)
            const fetchedColors = await db
                .select({ id: blindsProductColors.id, name: blindsProductColors.name })
                .from(blindsProductColors)
                .where(inArray(blindsProductColors.id, colorIds))

            console.log(`🛒 [${checkoutId}] Colors found: ${fetchedColors.length}/${colorIds.length}`)
            fetchedColors.forEach((c) => colorMap.set(c.id, c))

            for (const item of input.items) {
                if (item.colorId && !colorMap.has(item.colorId)) {
                    console.error(`🛒 [${checkoutId}] ❌ Color not found: ${item.colorId}`)
                    return ctx.json({ success: false, message: `Color not found: ${item.colorId}` }, 404)
                }
            }
        }

        // 4. Compute items
        const { subtotal, vat, totalAmount } = input

        const computedItems = input.items.map((item) => {
            const product = productMap.get(item.productId)!
            const unitPrice = product.unitPrice
            const itemSubtotal = unitPrice * item.quantity
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

        console.log(`🛒 [${checkoutId}] Computed items:`)
        computedItems.forEach(i => console.log(`   - ${i.productName} × ${i.quantity} = ₱${i.subtotal}`))

        // 5. Build PayMongo line items
        const rawSubtotalSum = computedItems.reduce((sum, i) => sum + i.subtotal, 0)
        const paymongoItems = computedItems.map((item) => ({
            name: item.productName,
            quantity: 1,
            amount: rawSubtotalSum > 0
                ? (item.subtotal / rawSubtotalSum) * subtotal
                : subtotal / computedItems.length,
        }))

        console.log(`🛒 [${checkoutId}] PayMongo line items:`)
        paymongoItems.forEach(i => console.log(`   - ${i.name}: ₱${i.amount.toFixed(2)}`))
        console.log(`   VAT line item: ₱${vat.toFixed(2)}`)
        console.log(`   Expected total (items + vat): ₱${(paymongoItems.reduce((s, i) => s + i.amount, 0) + vat).toFixed(2)}`)
        console.log(`   Provided totalAmount:          ₱${totalAmount.toFixed(2)}`)

        // 6. Generate identifiers
        const trackingNumber = generateTrackingNumber()
        const referenceNumber = generateReferenceNumber()

        console.log(`🛒 [${checkoutId}] trackingNumber: ${trackingNumber}`)
        console.log(`🛒 [${checkoutId}] referenceNumber: ${referenceNumber}`)

        let newOrderId!: string

        // 7. DB transaction
        console.log(`🛒 [${checkoutId}] Starting DB transaction...`)
        await db.transaction(async (tx) => {
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
                    deliveryFee: "0.00",
                    vat: vat.toFixed(2),
                    totalAmount: totalAmount.toFixed(2),
                })
                .returning({ id: orders.id })

            newOrderId = newOrder.id
            console.log(`🛒 [${checkoutId}] ✅ orders row inserted — orderId: ${newOrderId}`)

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
            console.log(`🛒 [${checkoutId}] ✅ orderItems rows inserted (${computedItems.length})`)

            await tx.insert(paymentHistory).values({
                orderId: newOrderId,
                status: "pending",
                paymentMethod: input.paymentMethod,
                referenceNumber,
            })
            console.log(`🛒 [${checkoutId}] ✅ paymentHistory row inserted`)
        })

        console.log(`🛒 [${checkoutId}] DB transaction committed — orderId: ${newOrderId}`)

        // 8. Create PayMongo session
        console.log(`🛒 [${checkoutId}] Calling createOrderPaymentSession...`)
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
            vat,
            orderType: "delivery",
            paymentMethod: input.paymentMethod,
            items: paymongoItems,
        })

        console.log(`🛒 [${checkoutId}] createOrderPaymentSession result:`)
        console.log(`   success:         ${paymentSession.success}`)
        console.log(`   sessionId:       ${paymentSession.sessionId ?? "❌ null"}`)
        console.log(`   paymentIntentId: ${paymentSession.paymentIntentId ?? "❌ null"}`)
        console.log(`   checkoutUrl:     ${paymentSession.checkoutUrl ?? "❌ null"}`)
        console.log(`   expiresAt:       ${paymentSession.expiresAt ?? "null"}`)
        if (!paymentSession.success) {
            console.error(`   error:           ${paymentSession.error}`)
        }

        // 9. Handle PayMongo failure
        if (!paymentSession.success) {
            console.error(`🛒 [${checkoutId}] ❌ PayMongo session failed — cancelling order ${newOrderId}`)

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

            console.log(`🛒 [${checkoutId}] Order ${newOrderId} cancelled in DB`)
            return ctx.json(
                {
                    success: false,
                    message: "Failed to initialize payment. Please try again.",
                    error: paymentSession.error,
                },
                502
            )
        }

        // 10. Backfill session details
        console.log(`🛒 [${checkoutId}] Backfilling payment session details into paymentHistory...`)
        const backfillResult = await db
            .update(paymentHistory)
            .set({
                sessionId: paymentSession.sessionId,
                paymentIntentId: paymentSession.paymentIntentId,
                expiresAt: paymentSession.expiresAt,
                updatedAt: new Date(),
            })
            .where(eq(paymentHistory.orderId, newOrderId))
            .returning({ id: paymentHistory.id })

        console.log(`🛒 [${checkoutId}] Backfill rows updated: ${backfillResult.length}`)

        // 11. Return success
        console.log(`🛒 [${checkoutId}] === checkoutOrder SUCCESS ✅ ===`)
        console.log(`   orderId:      ${newOrderId}`)
        console.log(`   tracking:     ${trackingNumber}`)
        console.log(`   checkoutUrl:  ${paymentSession.checkoutUrl}`)

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
                        vat,
                        totalAmount,
                        itemCount: computedItems.length,
                    },
                },
            },
            201
        )
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        const errStack = error instanceof Error ? error.stack : ""
        console.error(`🛒 [${checkoutId}] ❌ Unexpected error in checkoutOrder:`)
        console.error(`   message: ${errMsg}`)
        console.error(`   stack:   ${errStack}`)
        return ctx.json(
            {
                success: false,
                message: "An unexpected error occurred. Please try again.",
            },
            500
        )
    }
}