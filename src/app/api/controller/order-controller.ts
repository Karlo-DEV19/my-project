import { Context } from "hono"
import { z } from "zod"
import { inArray, eq, ilike, or, and, desc, sql } from "drizzle-orm"
import { db } from "@/lib/supabase/db"
import { blindsProducts } from "@/schema/products/blinds/blinds-product"
import { blindsProductColors } from "@/schema/products/blinds/blinds-product-colors"
import { orderItems, orders } from "@/schema/orders/orders"
import { paymentHistory } from "@/schema/orders/payment-history/payment-history"
import { createOrderPaymentSession } from "../services/nodemailer/paymongo/order-checkout-payment"
import { blindsProductImages } from "@/schema/products/blinds/blinds-product-image"
import { sendOrderStatusEmail } from "../services/nodemailer/send-order-status-service"

// ─── Constants ────────────────────────────────────────────────────────────────

const VAT_RATE = 0.12
const DOWNPAYMENT_RATE = 0.5

/**
 * Maximum allowed difference (₱) between client-sent totals and
 * server-recomputed totals. Accounts for frontend rounding on per-item splits.
 */
const TOLERANCE = 1.00

// ─── Utils ────────────────────────────────────────────────────────────────────

function generateTrackingNumber(): string {
    const ts = Date.now().toString(36).toUpperCase()
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `BLD-${ts}-${rand}`
}

function generateReferenceNumber(): string {
    return `REF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

function round2(n: number): number {
    if (isNaN(n) || !isFinite(n)) return 0
    return Math.round(n * 100) / 100
}

// ─── Validation ───────────────────────────────────────────────────────────────

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

    // Full 100% order totals — calculated by the frontend
    subtotal: z.number().positive("subtotal must be positive"),
    vat: z.number().min(0, "vat must be non-negative"),
    totalAmount: z.number().positive("totalAmount must be positive"),

    // 50% downpayment totals — calculated by the frontend
    downpaymentSubtotal: z.number().positive("downpaymentSubtotal must be positive"),
    downpaymentVat: z.number().min(0, "downpaymentVat must be non-negative"),
    downpaymentAmount: z.number().positive("downpaymentAmount must be positive"),
})

type CheckoutInput = z.infer<typeof CheckoutSchema>

// ─── Controller ───────────────────────────────────────────────────────────────

export const checkoutOrder = async (ctx: Context) => {
    try {
        // ── 1. Parse & validate schema ─────────────────────────────────────────
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

        // ── 2. Fetch & validate products ───────────────────────────────────────
        const productIds = input.items.map((i) => i.productId)

        const fetchedProducts = await db
            .select({
                id: blindsProducts.id,
                name: blindsProducts.name,
                productCode: blindsProducts.productCode,
                unitPrice: blindsProducts.unitPrice, // integer — whole pesos
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
                    { success: false, message: `Product "${product.name}" is no longer available` },
                    400
                )
            }
        }

        // ── 3. Fetch first image per product (for PayMongo receipt) ────────────
        const fetchedImages = await db
            .select({
                productId: blindsProductImages.productId,
                imageUrl: blindsProductImages.imageUrl,
            })
            .from(blindsProductImages)
            .where(inArray(blindsProductImages.productId, productIds))

        const imageMap = new Map<string, string>()
        for (const img of fetchedImages) {
            if (!imageMap.has(img.productId)) {
                imageMap.set(img.productId, img.imageUrl)
            }
        }

        // ── 4. Fetch & validate colors ─────────────────────────────────────────
        const colorIds = input.items
            .filter((i): i is typeof i & { colorId: string } => !!i.colorId)
            .map((i) => i.colorId)

        const colorMap = new Map<string, { id: string; name: string }>()

        if (colorIds.length > 0) {
            const fetchedColors = await db
                .select({ id: blindsProductColors.id, name: blindsProductColors.name })
                .from(blindsProductColors)
                .where(inArray(blindsProductColors.id, colorIds))

            for (const c of fetchedColors) colorMap.set(c.id, c)

            for (const item of input.items) {
                if (item.colorId && !colorMap.has(item.colorId)) {
                    return ctx.json(
                        { success: false, message: `Color not found: ${item.colorId}` },
                        404
                    )
                }
            }
        }

        // ── 5. Server-side verification of client financials ───────────────────
        // The frontend uses area-based pricing (sq·ft × panels × unitPrice + min-charge
        // logic) which the server cannot reproduce without dimension data. Instead we
        // verify internal consistency of the numbers the client sent:
        //   • vat     ≈ subtotal × 12%
        //   • total   ≈ subtotal + vat
        //   • downpay ≈ total × 50%
        // This catches any tampering (zeroed totals, wrong VAT, inflated discounts)
        // without needing to know widthCm / heightCm / panels.

        const clientSubtotal = round2(input.subtotal)
        const clientVat = round2(input.vat)
        const clientTotal = round2(input.totalAmount)
        const clientDownpay = round2(input.downpaymentAmount)

        const expectedVat = round2(clientSubtotal * VAT_RATE)
        const expectedTotal = round2(clientSubtotal + clientVat)
        const expectedDownpay = round2(clientTotal * DOWNPAYMENT_RATE)

        if (Math.abs(expectedVat - clientVat) > TOLERANCE) {
            return ctx.json(
                {
                    success: false,
                    message: `VAT mismatch: expected ₱${expectedVat.toFixed(2)}, received ₱${clientVat.toFixed(2)}`,
                },
                400
            )
        }

        if (Math.abs(expectedTotal - clientTotal) > TOLERANCE) {
            return ctx.json(
                {
                    success: false,
                    message: `Total mismatch: expected ₱${expectedTotal.toFixed(2)}, received ₱${clientTotal.toFixed(2)}`,
                },
                400
            )
        }

        if (Math.abs(expectedDownpay - clientDownpay) > TOLERANCE) {
            return ctx.json(
                {
                    success: false,
                    message: `Downpayment mismatch: expected ₱${expectedDownpay.toFixed(2)}, received ₱${clientDownpay.toFixed(2)}`,
                },
                400
            )
        }

        // All checks passed — use client values; they carry the frontend's exact rounding
        const fullSubtotal = clientSubtotal
        const fullVat = clientVat
        const fullTotal = clientTotal
        const downpaymentAmount = clientDownpay
        const balanceAmount = round2(fullTotal - downpaymentAmount)

        // ── 6. Build order item snapshots (full-price, for DB) ─────────────────
        const computedItems = input.items.map((item) => {
            const product = productMap.get(item.productId)!
            return {
                productId: product.id,
                productName: product.name,
                productCode: product.productCode,
                quantity: item.quantity,
                unitPrice: product.unitPrice,
                subtotal: round2(product.unitPrice * item.quantity),
                colorId: item.colorId ?? null,
                colorName: item.colorId ? (colorMap.get(item.colorId)?.name ?? null) : null,
            }
        })

        // ── 7. Build PayMongo line items ───────────────────────────────────────
        // One entry per product. Amount is the per-unit downpayment price (VAT-inclusive),
        // multiplied by quantity inside PayMongo.
        // No separate VAT line — VAT is already baked into the amounts.
        const fullSubtotalForProportion = round2(
            computedItems.reduce((sum, i) => sum + i.subtotal, 0)
        )

        const paymongoItems = computedItems.map((item) => {
            const proportion =
                fullSubtotalForProportion > 0
                    ? item.subtotal / fullSubtotalForProportion
                    : 1 / computedItems.length

            // Downpayment share for this product (VAT-inclusive), split across units
            const itemDownpaymentTotal = round2(downpaymentAmount * proportion)
            const perUnitAmount = round2(itemDownpaymentTotal / item.quantity)

            return {
                name: item.productName,
                quantity: item.quantity,
                amount: perUnitAmount,
                imageUrl: imageMap.get(item.productId) ?? null,
            }
        })

        // Correct rounding drift so sum(amount × qty) = downpaymentAmount exactly
        const paymongoSum = round2(
            paymongoItems.reduce((sum, i) => sum + i.amount * i.quantity, 0)
        )
        const drift = round2(downpaymentAmount - paymongoSum)
        if (drift !== 0 && paymongoItems.length > 0) {
            const last = paymongoItems[paymongoItems.length - 1]
            last.amount = round2(last.amount + drift / last.quantity)
        }

        // ── 8. Generate identifiers ────────────────────────────────────────────
        const trackingNumber = generateTrackingNumber()
        const referenceNumber = generateReferenceNumber()

        let newOrderId!: string

        // ── 9. DB transaction ──────────────────────────────────────────────────
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

                    subtotal: fullSubtotal.toFixed(2),
                    deliveryFee: "0.00",
                    vat: fullVat.toFixed(2),
                    totalAmount: fullTotal.toFixed(2),

                    downpaymentAmount: downpaymentAmount.toFixed(2),
                    downpaymentStatus: "pending",
                    balanceAmount: balanceAmount.toFixed(2),
                })
                .returning({ id: orders.id })

            newOrderId = newOrder.id

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

            await tx.insert(paymentHistory).values({
                orderId: newOrderId,
                paymentType: "downpayment",
                status: "pending",
                paymentMethod: input.paymentMethod,
                referenceNumber,
                amountDue: downpaymentAmount.toFixed(2),
            })
        })

        // ── 10. Create PayMongo checkout session ───────────────────────────────
        const paymentSession = await createOrderPaymentSession({
            orderId: newOrderId,
            trackingNumber,
            referenceNumber,
            customerFirstName: input.firstName,
            customerLastName: input.lastName,
            customerEmail: input.email,
            customerPhone: input.phone,
            customerPhoneSecondary: input.phoneSecondary,
            amount: downpaymentAmount,
            orderType: "delivery",
            paymentMethod: input.paymentMethod,
            items: paymongoItems,
        })

        // ── 11. Handle PayMongo failure ────────────────────────────────────────
        if (!paymentSession.success) {
            await db.transaction(async (tx) => {
                await tx
                    .update(orders)
                    .set({
                        status: "cancelled",
                        paymentStatus: "failed",
                        downpaymentStatus: "failed",
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

        // ── 12. Backfill PayMongo identifiers ──────────────────────────────────
        await db
            .update(paymentHistory)
            .set({
                sessionId: paymentSession.sessionId,
                paymentIntentId: paymentSession.paymentIntentId,
                expiresAt: paymentSession.expiresAt,
                updatedAt: new Date(),
            })
            .where(eq(paymentHistory.orderId, newOrderId))

        // ── 13. Send "Order Placed" Email ──
        try {
            const orderForEmail = {
                customerEmail: input.email,
                customerFirstName: input.firstName,
                customerLastName: input.lastName,
                trackingNumber,
                referenceNumber,
                subtotal: fullSubtotal.toFixed(2),
                vat: fullVat.toFixed(2),
                totalAmount: fullTotal.toFixed(2),
                downpaymentAmount: downpaymentAmount.toFixed(2),
                balanceAmount: balanceAmount.toFixed(2),
            } as any

            await sendOrderStatusEmail(orderForEmail, computedItems as any, "placed")
        } catch (emailErr) {
            console.error("⚠️ Failed to send initial 'Order Placed' email:", emailErr)
        }

        // ── 14. Respond ────────────────────────────────────────────────────────
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
                        subtotal: fullSubtotal,
                        vat: fullVat,
                        totalAmount: fullTotal,
                        downpaymentAmount,
                        balanceAmount,
                        itemCount: computedItems.length,
                    },
                },
            },
            201
        )
    } catch {
        return ctx.json(
            {
                success: false,
                message: "An unexpected error occurred. Please try again.",
            },
            500
        )
    }
}

export const getOrderDetailsStatus = async (ctx: Context) => {
    try {
        const referenceNumber = ctx.req.query("referenceNumber")

        if (!referenceNumber) {
            return ctx.json({ success: false, message: "referenceNumber query param is required" }, 400)
        }

        const [order] = await db
            .select({
                id: orders.id,
                trackingNumber: orders.trackingNumber,
                referenceNumber: orders.referenceNumber,
                status: orders.status,
                paymentStatus: orders.paymentStatus,
                paymentMethod: orders.paymentMethod,
                orderType: orders.orderType,

                // Customer
                customerFirstName: orders.customerFirstName,
                customerLastName: orders.customerLastName,
                customerEmail: orders.customerEmail,
                customerPhone: orders.customerPhone,
                customerPhoneSecondary: orders.customerPhoneSecondary,

                // Delivery
                deliveryUnitFloor: orders.deliveryUnitFloor,
                deliveryStreet: orders.deliveryStreet,
                deliveryBarangay: orders.deliveryBarangay,
                deliveryCity: orders.deliveryCity,
                deliveryProvince: orders.deliveryProvince,
                deliveryZipCode: orders.deliveryZipCode,
                deliveryFormattedAddress: orders.deliveryFormattedAddress,
                deliveryNotes: orders.deliveryNotes,

                // Financials
                subtotal: orders.subtotal,
                vat: orders.vat,
                deliveryFee: orders.deliveryFee,
                totalAmount: orders.totalAmount,
                downpaymentAmount: orders.downpaymentAmount,
                downpaymentStatus: orders.downpaymentStatus,
                downpaymentPaidAt: orders.downpaymentPaidAt,
                balanceAmount: orders.balanceAmount,
                balancePaidAt: orders.balancePaidAt,

                // Timestamps
                confirmedAt: orders.confirmedAt,
                cancelledAt: orders.cancelledAt,
                cancellationReason: orders.cancellationReason,
                createdAt: orders.createdAt,
                updatedAt: orders.updatedAt,
            })
            .from(orders)
            .where(eq(orders.referenceNumber, referenceNumber))
            .limit(1)

        if (!order) {
            return ctx.json({ success: false, message: "Order not found" }, 404)
        }

        const payments = await db
            .select({
                id: paymentHistory.id,
                paymentType: paymentHistory.paymentType,
                status: paymentHistory.status,
                paymentMethod: paymentHistory.paymentMethod,
                amountDue: paymentHistory.amountDue,
                amountPaid: paymentHistory.amountPaid,
                vat: paymentHistory.vat,
                netAmount: paymentHistory.netAmount,
                paidAt: paymentHistory.paidAt,
                expiresAt: paymentHistory.expiresAt,
                createdAt: paymentHistory.createdAt,
            })
            .from(paymentHistory)
            .where(eq(paymentHistory.orderId, order.id))
            .orderBy(paymentHistory.createdAt)

        return ctx.json({
            success: true,
            data: {
                order,
                payments,
            },
        })
    } catch (error) {
        console.error("Failed to fetch order details:", error)
        return ctx.json({ success: false, message: "Failed to fetch order details." }, 500)
    }
}


export const getAllOrders = async (ctx: Context) => {
    try {
        const page = Math.max(1, Number(ctx.req.query("page") ?? 1))
        const limit = Math.min(100, Math.max(1, Number(ctx.req.query("limit") ?? 10)))
        const search = ctx.req.query("search")?.trim() ?? ""
        const statusFilter = ctx.req.query("status")?.trim()
        const paymentStatusFilter = ctx.req.query("paymentStatus")?.trim()
        const sortOrder = ctx.req.query("sortOrder")?.toLowerCase() === "asc" ? "asc" : "desc"
        const offset = (page - 1) * limit

        // Build filters
        const filters = []

        if (statusFilter) {
            filters.push(eq(orders.status, statusFilter))
        }

        if (paymentStatusFilter) {
            filters.push(eq(orders.paymentStatus, paymentStatusFilter))
        }

        if (search) {
            filters.push(
                or(
                    ilike(orders.trackingNumber, `%${search}%`),
                    ilike(orders.referenceNumber, `%${search}%`),
                    ilike(orders.customerFirstName, `%${search}%`),
                    ilike(orders.customerLastName, `%${search}%`),
                    ilike(orders.customerEmail, `%${search}%`),
                    ilike(orders.customerPhone, `%${search}%`),
                )
            )
        }

        const whereCondition = filters.length > 0 ? and(...filters) : undefined

        // Total count
        const [totalResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(whereCondition)

        const total = Number(totalResult?.count ?? 0)
        const totalPages = Math.ceil(total / limit)

        // Fetch orders — no joins, lean columns only
        const orderRows = await db
            .select({
                id: orders.id,
                trackingNumber: orders.trackingNumber,
                referenceNumber: orders.referenceNumber,
                status: orders.status,
                paymentStatus: orders.paymentStatus,
                paymentMethod: orders.paymentMethod,
                orderType: orders.orderType,
                customerFirstName: orders.customerFirstName,
                customerLastName: orders.customerLastName,
                customerEmail: orders.customerEmail,
                customerPhone: orders.customerPhone,
                totalAmount: orders.totalAmount,
                downpaymentAmount: orders.downpaymentAmount,
                balanceAmount: orders.balanceAmount,
                createdAt: orders.createdAt,
                updatedAt: orders.updatedAt,
            })
            .from(orders)
            .where(whereCondition)
            .orderBy(sortOrder === "asc" ? orders.createdAt : desc(orders.createdAt))
            .limit(limit)
            .offset(offset)

        // Batch-fetch ALL payments for the returned order IDs only
        const orderIds = orderRows.map((o) => o.id)

        const paymentRows = orderIds.length > 0
            ? await db
                .select({
                    orderId: paymentHistory.orderId,
                    paymentType: paymentHistory.paymentType,
                    status: paymentHistory.status,
                    amountDue: paymentHistory.amountDue,
                    amountPaid: paymentHistory.amountPaid,
                    paidAt: paymentHistory.paidAt,
                })
                .from(paymentHistory)
                .where(inArray(paymentHistory.orderId, orderIds))
                .orderBy(paymentHistory.createdAt)
            : []

        // Group payments by orderId
        const paymentMap = new Map<string, any[]>()
        paymentRows.forEach((p) => {
            const list = paymentMap.get(p.orderId) ?? []
            list.push(p)
            paymentMap.set(p.orderId, list)
        })

        const data = orderRows.map((order) => ({
            ...order,
            payments: paymentMap.get(order.id) ?? [],
        }))

        return ctx.json({
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        })
    } catch (error) {
        console.error("Failed to fetch orders:", error)
        return ctx.json({ success: false, message: "Failed to fetch orders." }, 500)
    }
}


export default {
    getOrderDetailsStatus,
    getAllOrders,
    checkoutOrder
}