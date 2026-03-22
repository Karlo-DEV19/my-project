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

        // Identifiers
        trackingNumber: varchar("tracking_number", { length: 50 }).notNull(),
        referenceNumber: varchar("reference_number", { length: 100 }).notNull(),

        // Status
        status: varchar("status", { length: 50 })
            .notNull()
            .default("pending"),
        // pending | confirmed | processing | ready | out_for_delivery | delivered | cancelled

        paymentStatus: varchar("payment_status", { length: 50 })
            .notNull()
            .default("unpaid"),
        // unpaid | paid | failed | refunded

        paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
        // gcash | paymaya

        orderType: varchar("order_type", { length: 50 }).notNull(),
        // dine-in | pickup | delivery

        // Customer info (from checkout payload)
        customerFirstName: varchar("customer_first_name", { length: 100 }).notNull(),
        customerLastName: varchar("customer_last_name", { length: 100 }).notNull(),
        customerEmail: varchar("customer_email", { length: 255 }).notNull(),
        customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
        customerPhoneSecondary: varchar("customer_phone_secondary", { length: 20 }),

        // Delivery address (flattened from checkout payload address object)
        deliveryUnitFloor: varchar("delivery_unit_floor", { length: 50 }),
        deliveryStreet: varchar("delivery_street", { length: 255 }),
        deliveryBarangay: varchar("delivery_barangay", { length: 150 }),
        deliveryCity: varchar("delivery_city", { length: 100 }),
        deliveryProvince: varchar("delivery_province", { length: 100 }),
        deliveryZipCode: varchar("delivery_zip_code", { length: 10 }),
        deliveryFormattedAddress: text("delivery_formatted_address"),

        // Coordinates (from checkout payload coordinates object)
        deliveryLat: decimal("delivery_lat", { precision: 10, scale: 8 }),
        deliveryLng: decimal("delivery_lng", { precision: 11, scale: 8 }),

        deliveryNotes: text("delivery_notes"),

        // Financials — stored separately to match payment service logic
        subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
        deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 })
            .notNull()
            .default("0.00"),
        processingFee: decimal("processing_fee", { precision: 10, scale: 2 })
            .notNull()
            .default("0.00"),
        totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),

        // Cancellation
        cancelledBy: varchar("cancelled_by", { length: 50 }),
        // system | customer | admin
        cancellationReason: text("cancellation_reason"),

        // Lifecycle timestamps
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



export const orderItems = pgTable("order_items", {
    id: uuid("id").defaultRandom().primaryKey(),

    orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),

    productId: uuid("product_id")
        .notNull()
        .references(() => blindsProducts.id, { onDelete: "restrict" }),

    // Snapshot fields — store at time of order so price changes don't affect history
    productName: varchar("product_name", { length: 255 }).notNull(),
    productCode: varchar("product_code", { length: 120 }).notNull(),

    quantity: integer("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    // subtotal = unitPrice * quantity

    // Optional: which color variant was selected
    colorId: uuid("color_id").references(() => blindsProductColors.id, {
        onDelete: "set null",
    }),
    colorName: varchar("color_name", { length: 120 }),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
})

export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert