import { Context } from "hono";
import { NotificationsService } from "../services/notification-service/notifications.service";
import { NotificationIdParamSchema } from "./notifications.schema";

export const NotificationsController = {
    /**
     * GET /api/notifications
     * Retrieve all notifications
     */
    async getAllNotifications(c: Context) {
        try {
            const data = await NotificationsService.getAllNotifications();
            return c.json({ success: true, data }, 200);
        } catch (error: unknown) {
            console.error("[NotificationsController.getAllNotifications] Error:", error);
            return c.json({ success: false, message: "Internal Server Error" }, 500);
        }
    },

    /**
     * PATCH /api/notifications/:id/read
     * Mark a single notification as read
     */
    async markAsRead(c: Context) {
        try {
            const params = { id: c.req.param("id") };

            const parsedParams = NotificationIdParamSchema.safeParse(params);

            if (!parsedParams.success) {
                return c.json(
                    {
                        success: false,
                        message: "Validation Error",
                        errors: parsedParams.error,
                    },
                    400
                );
            }

            const { id } = parsedParams.data;
            const updated = await NotificationsService.markAsRead(id);

            if (!updated) {
                return c.json(
                    { success: false, message: "Notification not found" },
                    404
                );
            }

            return c.json({ success: true, data: updated }, 200);
        } catch (error: unknown) {
            console.error("[NotificationsController.markAsRead] Error:", error);
            return c.json({ success: false, message: "Internal Server Error" }, 500);
        }
    },

    /**
     * PATCH /api/notifications/read-all
     * Mark all notifications as read
     */
    async markAllAsRead(c: Context) {
        try {
            const updated = await NotificationsService.markAllAsRead();
            return c.json({ success: true, data: updated }, 200);
        } catch (error: unknown) {
            console.error("[NotificationsController.markAllAsRead] Error:", error);
            return c.json({ success: false, message: "Internal Server Error" }, 500);
        }
    },
};