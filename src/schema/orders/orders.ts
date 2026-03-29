import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    decimal,
    uniqueIndex,
    integer,
} from "drizzle-orm/pg-core"
import { blindsProductColors } from "../products/blinds/blinds-product-colors"
import { blindsProducts } from "../products/blinds/blinds-product"

export const orders = pgTable(
    "orders",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        trackingNumber: varchar("tracking_number", { length: 50 }).notNull(),
        referenceNumber: varchar("reference_number", { length: 100 }).notNull(),

        status: varchar("status", { length: 50 }).notNull().default("pending"),
        // pending | confirmed | processing | ready | out_for_delivery | delivered | cancelled

        paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("unpaid"),
        // unpaid | downpaid | paid | failed | refunded
        // unpaid      → no payment yet
        // downpaid    → 50% downpayment confirmed; balance still due
        // paid        → full balance settled
        // failed      → payment attempt failed
        // refunded    → order was refunded

        paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
        // gcash | paymaya

        orderType: varchar("order_type", { length: 50 }).notNull(),
        // pickup | delivery

        // ── Customer ─────────────────────────────────────────────────────────
        customerFirstName: varchar("customer_first_name", { length: 100 }).notNull(),
        customerLastName: varchar("customer_last_name", { length: 100 }).notNull(),
        customerEmail: varchar("customer_email", { length: 255 }).notNull(),
        customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
        customerPhoneSecondary: varchar("customer_phone_secondary", { length: 20 }),

        // ── Delivery ─────────────────────────────────────────────────────────
        deliveryUnitFloor: varchar("delivery_unit_floor", { length: 50 }),
        deliveryStreet: varchar("delivery_street", { length: 255 }),
        deliveryBarangay: varchar("delivery_barangay", { length: 150 }),
        deliveryCity: varchar("delivery_city", { length: 100 }),
        deliveryProvince: varchar("delivery_province", { length: 100 }),
        deliveryZipCode: varchar("delivery_zip_code", { length: 10 }),
        deliveryFormattedAddress: text("delivery_formatted_address"),
        deliveryLat: decimal("delivery_lat", { precision: 10, scale: 8 }),
        deliveryLng: decimal("delivery_lng", { precision: 11, scale: 8 }),
        deliveryNotes: text("delivery_notes"),

        // ── Financials (full order totals — always the 100% figures) ─────────
        subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
        // Sum of all line item totals before VAT (100% of order)

        deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 })
            .notNull()
            .default("0.00"),
        // Always 0.00 at order time — quoted separately after confirmation

        vat: decimal("vat", { precision: 10, scale: 2 })
            .notNull()
            .default("0.00"),
        // 12% of subtotal (full order)

        totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
        // subtotal + vat (full order, delivery excluded)

        // ── Downpayment tracking (always 50% of totalAmount) ─────────────────
        downpaymentAmount: decimal("downpayment_amount", { precision: 10, scale: 2 }).notNull(),
        // The amount charged upfront (50% of totalAmount incl. VAT)

        downpaymentStatus: varchar("downpayment_status", { length: 50 })
            .notNull()
            .default("pending"),
        // pending | paid | failed

        downpaymentPaidAt: timestamp("downpayment_paid_at", { mode: "date" }),
        // Populated by webhook when downpayment is confirmed

        balanceAmount: decimal("balance_amount", { precision: 10, scale: 2 }).notNull(),
        // Remaining balance due on delivery (totalAmount - downpaymentAmount)

        balancePaidAt: timestamp("balance_paid_at", { mode: "date" }),
        // Populated when the balance is collected

        // ── Cancellation ─────────────────────────────────────────────────────
        cancelledBy: varchar("cancelled_by", { length: 50 }),
        // system | customer | admin

        cancellationReason: text("cancellation_reason"),

        // ── Timestamps ───────────────────────────────────────────────────────
        confirmedAt: timestamp("confirmed_at", { mode: "date" }),
        cancelledAt: timestamp("cancelled_at", { mode: "date" }),
        createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
    },
    (table) => ({
        trackingNumberUnique: uniqueIndex("orders_tracking_number_unique").on(
            table.trackingNumber
        ),
        referenceNumberUnique: uniqueIndex("orders_reference_number_unique").on(
            table.referenceNumber
        ),
    })
)

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

// ─── Order Items ──────────────────────────────────────────────────────────────

export const orderItems = pgTable("order_items", {
    id: uuid("id").defaultRandom().primaryKey(),

    orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),

    productId: uuid("product_id")
        .notNull()
        .references(() => blindsProducts.id, { onDelete: "restrict" }),

    // Snapshot at time of order — price changes won't affect history
    productName: varchar("product_name", { length: 255 }).notNull(),
    productCode: varchar("product_code", { length: 120 }).notNull(),

    quantity: integer("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    // subtotal = unitPrice × quantity (100% snapshot)

    colorId: uuid("color_id").references(() => blindsProductColors.id, {
        onDelete: "set null",
    }),
    colorName: varchar("color_name", { length: 120 }),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
})

export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert