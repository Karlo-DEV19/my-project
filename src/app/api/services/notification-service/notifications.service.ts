import { db } from "@/lib/supabase/db";
import { notifications } from "@/schema/notifications/notifications.schema";
import { desc, eq } from "drizzle-orm";

export const NotificationsService = {
    /**
     * Fetch all notifications, newest first
     */
    async getAllNotifications() {
        return await db
            .select()
            .from(notifications)
            .orderBy(desc(notifications.createdAt));
    },

    /**
     * Mark a single notification as read by its UUID
     */
    async markAsRead(id: string) {
        const [updatedNotification] = await db
            .update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.id, id))
            .returning();

        return updatedNotification;
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        return await db
            .update(notifications)
            .set({ isRead: true })
            .returning();
    },
};
