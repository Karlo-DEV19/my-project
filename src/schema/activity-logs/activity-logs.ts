import {
    pgTable,
    uuid,
    varchar,
    timestamp
} from "drizzle-orm/pg-core";

export const activityLogs = pgTable("activity_logs", {
    id: uuid("id").defaultRandom().primaryKey(),

    // Who did it
    userId: uuid("user_id").notNull(),

    // What happened
    action: varchar("action", { length: 50 }).notNull(),

    // Where it happened
    module: varchar("module", { length: 50 }).notNull(),

    // Reference (invoiceId, batchId, etc.)
    referenceId: uuid("reference_id"),

    // Human-readable message
    description: varchar("description", { length: 255 }),

    // When it happened
    createdAt: timestamp("created_at", { mode: "date" })
        .defaultNow()
        .notNull(),
});