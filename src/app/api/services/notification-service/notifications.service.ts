import { db } from "@/lib/supabase/db";
import { notifications } from "@/schema/notifications/notifications.schema";
import { and, desc, eq, isNull, or } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateNotificationInput = {
    userId?: string | null;
    title: string;
    message: string;
    type?: string; // "NEW_ORDER" | "ORDER_CONFIRMED" | "DELIVERY_UPDATE" | "NEW_ARRIVAL" | "security"
    targetRole: "admin" | "customer"; // REQUIRED — determines who sees this notification
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const NotificationsService = {
    /**
     * Fetch ADMIN-ONLY notifications (targetRole = "admin") — newest first
     */
    async getAllNotifications() {
        return await db
            .select()
            .from(notifications)
            .where(eq(notifications.targetRole, "admin"))
            .orderBy(desc(notifications.createdAt));
    },

    /**
     * Fetch customer notifications:
     *   - targetRole = "customer" AND
     *   - (userId = userId OR userId IS NULL for global broadcasts)
     * Sorted newest first.
     */
    async getUserNotifications(userId: string) {
        return await db
            .select()
            .from(notifications)
            .where(
                and(
                    eq(notifications.targetRole, "customer"),
                    or(
                        eq(notifications.userId, userId),
                        isNull(notifications.userId)
                    )
                )
            )
            .orderBy(desc(notifications.createdAt));
    },

    /**
     * Shared helper used by all event hooks to create a notification.
     * userId = null → global broadcast seen by all logged-in customers (targetRole must be "customer").
     * targetRole is REQUIRED to prevent cross-role leakage.
     */
    async createNotification({ userId = null, title, message, type = "system", targetRole }: CreateNotificationInput) {
        const [created] = await db
            .insert(notifications)
            .values({ userId, title, message, type, targetRole, isRead: false })
            .returning();
        return created;
    },

    /**
     * Mark a single notification as read by its UUID
     */
    async markAsRead(id: string) {
        const [updated] = await db
            .update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.id, id))
            .returning();
        return updated;
    },

    /**
     * Mark ALL admin notifications as read (admin action)
     */
    async markAllAsRead() {
        return await db
            .update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.targetRole, "admin"))
            .returning();
    },

    /**
     * Mark all customer notifications as read for a specific user:
     *   - their own user-specific notifications (targetRole = "customer")
     *   - global broadcasts (userId IS NULL, targetRole = "customer")
     */
    async markAllUserAsRead(userId: string) {
        return await db
            .update(notifications)
            .set({ isRead: true })
            .where(
                and(
                    eq(notifications.targetRole, "customer"),
                    or(
                        eq(notifications.userId, userId),
                        isNull(notifications.userId)
                    )
                )
            )
            .returning();
    },
};
