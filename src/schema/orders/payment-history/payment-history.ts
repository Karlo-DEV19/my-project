import {
    pgTable,
    uuid,
    varchar,
    decimal,
    timestamp,
    jsonb,
} from "drizzle-orm/pg-core"
import { orders } from "../orders"

export const paymentHistory = pgTable("payment_history", {
    id: uuid("id").defaultRandom().primaryKey(),

    orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),

    // Payment status lifecycle
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    // pending | paid | failed | refunded

    paymentMethod: varchar("payment_method", { length: 50 }),
    // gcash | paymaya

    // PayMongo identifiers
    paymentIntentId: varchar("payment_intent_id", { length: 100 }),
    sessionId: varchar("session_id", { length: 100 }),
    referenceNumber: varchar("reference_number", { length: 100 }),

    // Financials — matches handlePaymentSuccess breakdown exactly
    amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }),
    // Gross amount customer paid

    processingFee: decimal("processing_fee", { precision: 10, scale: 2 }),
    // YOUR ₱10 processing fee (not PayMongo's platform fee)

    netAmount: decimal("net_amount", { precision: 10, scale: 2 }),
    // What you receive after PayMongo deducts their platform fee

    // Timestamps
    paidAt: timestamp("paid_at", { mode: "date" }),
    expiresAt: timestamp("expires_at", { mode: "date" }),

    // Full PayMongo webhook/response payload for auditability
    rawResponse: jsonb("raw_response"),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
})

export type PaymentHistory = typeof paymentHistory.$inferSelect
export type NewPaymentHistory = typeof paymentHistory.$inferInsert