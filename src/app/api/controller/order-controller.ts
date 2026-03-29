import { Context } from "hono"
import { z } from "zod"
import { inArray, eq, or, ilike, sql, desc, and } from "drizzle-orm"
import { db } from "@/lib/supabase/db"
import { blindsProducts } from "@/schema/products/blinds/blinds-product"
import { blindsProductColors } from "@/schema/products/blinds/blinds-product-colors"
import { orderItems, orders } from "@/schema/orders/orders"
import { paymentHistory } from "@/schema/orders/payment-history/payment-history"
import { createOrderPaymentSession } from "../services/nodemailer/paymongo/order-checkout-payment"

// ─── Constants ────────────────────────────────────────────────────────────────

/** 50% downpayment — fixed at checkout */
const DOWNPAYMENT_RATE = 0.5

/** VAT rate in the Philippines */
const VAT_RATE = 0.12

// ─── Utils ────────────────────────────────────────────────────────────────────

function generateTrackingNumber(): string {
    const ts = Date.now().toString(36).toUpperCase()
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `BLD-${ts}-${rand}`
}

function generateReferenceNumber(): string {
    return `REF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

/** Round to 2 decimal places, guarding against NaN/Infinity */
function round2(n: number): number {
    if (isNaN(n) || !isFinite(n)) return 0
    return Math.round(n * 100) / 100
}

/** Safe division — returns 0 instead of NaN or Infinity */
function safeDivide(a: number, b: number): number {
    if (!b || isNaN(b) || !isFinite(b)) return 0
    const result = a / b
    return isNaN(result) || !isFinite(result) ? 0 : result
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
})

type CheckoutInput = z.infer<typeof CheckoutSchema>

// ─── Controller ───────────────────────────────────────────────────────────────

export const checkoutOrder = async (ctx: Context) => {
    try {
        // ── 1. Parse & validate ────────────────────────────────────────────────
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
                    { success: false, message: `Product "${product.name}" is no longer available` },
                    400
                )
            }
        }

        // ── 3. Fetch & validate colors ─────────────────────────────────────────
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

        // ── 4. Compute line items (full-price snapshots) ────────────────────────
        const computedItems = input.items.map((item) => {
            const product = productMap.get(item.productId)!
            const unitPrice = Number(product.unitPrice)
            const itemSubtotal = round2(unitPrice * item.quantity)

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

        // ── 5. Derive full-order totals server-side ─────────────────────────────
        //   Never trust the client for financial figures.
        const fullSubtotal = round2(
            computedItems.reduce((sum, i) => sum + i.subtotal, 0)
        )
        const fullVat = round2(fullSubtotal * VAT_RATE)
        const fullTotal = round2(fullSubtotal + fullVat)

        // ── 6. Derive 50% downpayment figures ──────────────────────────────────
        const downpaymentAmount = round2(fullTotal * DOWNPAYMENT_RATE)
        const balanceAmount = round2(fullTotal - downpaymentAmount)

        // Split downpayment subtotal proportionally for PayMongo line items
        const downpaymentSubtotal = round2(fullSubtotal * DOWNPAYMENT_RATE)
        // VAT on downpayment = downpaymentAmount - downpaymentSubtotal to keep sum exact
        const downpaymentVat = round2(downpaymentAmount - downpaymentSubtotal)

        // ── 7. Build PayMongo line items (downpayment slice only) ───────────────
        const rawSubtotalSum = computedItems.reduce((sum, i) => sum + i.subtotal, 0)

        const paymongoItems = computedItems.map((item) => ({
            name: item.productName,
            quantity: 1,
            amount:
                rawSubtotalSum > 0
                    ? round2(safeDivide(item.subtotal, rawSubtotalSum) * downpaymentSubtotal)
                    : round2(safeDivide(downpaymentSubtotal, computedItems.length)),
        }))

        // Ensure line items + downpaymentVat exactly equals downpaymentAmount
        // by adjusting the last item for any rounding drift
        const lineItemsSum = paymongoItems.reduce((sum, i) => sum + i.amount, 0)
        const expectedLineSum = round2(downpaymentAmount - downpaymentVat)
        const drift = round2(expectedLineSum - lineItemsSum)
        if (drift !== 0 && paymongoItems.length > 0) {
            paymongoItems[paymongoItems.length - 1].amount = round2(
                paymongoItems[paymongoItems.length - 1].amount + drift
            )
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

                    // Full 100% order financials (server-computed)
                    subtotal: fullSubtotal.toFixed(2),
                    deliveryFee: "0.00",
                    vat: fullVat.toFixed(2),
                    totalAmount: fullTotal.toFixed(2),

                    // Downpayment split
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
            subtotal: downpaymentSubtotal,
            vat: downpaymentVat,
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

        // ── 12. Backfill PayMongo identifiers into payment history ─────────────
        await db
            .update(paymentHistory)
            .set({
                sessionId: paymentSession.sessionId,
                paymentIntentId: paymentSession.paymentIntentId,
                expiresAt: paymentSession.expiresAt,
                updatedAt: new Date(),
            })
            .where(eq(paymentHistory.orderId, newOrderId))

        // ── 13. Respond ────────────────────────────────────────────────────────
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
    } catch (error) {
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