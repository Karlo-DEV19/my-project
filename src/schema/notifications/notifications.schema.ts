import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const notifications = pgTable("notifications", {
    id: uuid("id").defaultRandom().primaryKey(),
    // null  = global broadcast (shown to ALL logged-in customers, e.g. New Arrival)
    // value = user-specific notification (Order Confirmed, Delivery Update, Security Alert)
    userId: uuid("user_id"),
    title: text("title").notNull(),
    message: text("message").notNull(),
    // "NEW_ORDER" | "ORDER_CONFIRMED" | "DELIVERY_UPDATE" | "NEW_ARRIVAL" | "security"
    type: text("type").notNull().default("system"),
    // "admin" = only admin sees this | "customer" = only customers see this
    targetRole: text("target_role").notNull().default("customer"),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Generate Zod schemas
export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);

// Type inference
export type Notification = z.infer<typeof selectNotificationSchema>;
export type NewNotification = z.infer<typeof insertNotificationSchema>;
