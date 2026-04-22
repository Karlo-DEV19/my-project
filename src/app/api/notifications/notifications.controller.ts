import { Context } from "hono";
import { NotificationsService } from "../services/notification-service/notifications.service";
import { NotificationIdParamSchema } from "./notifications.schema";

export const NotificationsController = {

    // ── Admin ─────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/notifications
     * Retrieve ALL notifications (admin dashboard feed)
     */
    async getAllNotifications(c: Context) {
        try {
            const data = await NotificationsService.getAllNotifications();
            return c.json({ success: true, data }, 200);
        } catch (error) {
            console.error("[NotificationsController.getAllNotifications]", error);
            return c.json({ success: false, message: "Internal Server Error" }, 500);
        }
    },

    /**
     * PATCH /api/v1/notifications/read-all
     * Mark all notifications as read (admin)
     */
    async markAllAsRead(c: Context) {
        try {
            const updated = await NotificationsService.markAllAsRead();
            return c.json({ success: true, data: updated }, 200);
        } catch (error) {
            console.error("[NotificationsController.markAllAsRead]", error);
            return c.json({ success: false, message: "Internal Server Error" }, 500);
        }
    },

    /**
     * PATCH /api/v1/notifications/:id/read
     * Mark a single notification as read (shared by admin + customer)
     */
    async markAsRead(c: Context) {
        try {
            const params = { id: c.req.param("id") };
            const parsedParams = NotificationIdParamSchema.safeParse(params);

            if (!parsedParams.success) {
                return c.json(
                    { success: false, message: "Validation Error", errors: parsedParams.error },
                    400
                );
            }

            const { id } = parsedParams.data;
            const updated = await NotificationsService.markAsRead(id);

            if (!updated) {
                return c.json({ success: false, message: "Notification not found" }, 404);
            }

            return c.json({ success: true, data: updated }, 200);
        } catch (error) {
            console.error("[NotificationsController.markAsRead]", error);
            return c.json({ success: false, message: "Internal Server Error" }, 500);
        }
    },

    // ── Customer ──────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/notifications/user/:userId
     * Fetch notifications for a specific customer:
     *   - Their own (userId = :userId)
     *   - Global broadcasts (userId IS NULL — e.g. New Arrival)
     */
    async getUserNotifications(c: Context) {
        try {
            const userId = c.req.param("userId");
            if (!userId) {
                return c.json({ success: false, message: "User ID is required" }, 400);
            }
            const data = await NotificationsService.getUserNotifications(userId);
            return c.json({ success: true, data }, 200);
        } catch (error) {
            console.error("[NotificationsController.getUserNotifications]", error);
            return c.json({ success: false, message: "Internal Server Error" }, 500);
        }
    },

    /**
     * POST /api/v1/notifications
     * Create a notification directly (internal use / admin tooling)
     */
    async createNotification(c: Context) {
        try {
            const body = await c.req.json();
            const { userId, title, message, type, targetRole } = body;

            if (!title || !message) {
                return c.json({ success: false, message: "title and message are required" }, 400);
            }

            if (!targetRole || !['admin', 'customer'].includes(targetRole)) {
                return c.json({ success: false, message: "targetRole must be 'admin' or 'customer'" }, 400);
            }

            const data = await NotificationsService.createNotification({
                userId: userId ?? null,
                title,
                message,
                type,
                targetRole,
            });
            return c.json({ success: true, data }, 201);
        } catch (error) {
            console.error("[NotificationsController.createNotification]", error);
            return c.json({ success: false, message: "Internal Server Error" }, 500);
        }
    },

    /**
     * POST /api/v1/notifications/security-alert
     * Create a security notification after a successful password change.
     * Called client-side from profile.tsx after supabase.auth.updateUser succeeds.
     */
    async createSecurityAlert(c: Context) {
        try {
            const body = await c.req.json();
            const { userId } = body;

            if (!userId) {
                return c.json({ success: false, message: "userId is required" }, 400);
            }

            const data = await NotificationsService.createNotification({
                userId,
                title: "Security Alert",
                message:
                    "Your password has been changed successfully. If this wasn't you, contact support immediately.",
                type: "security",
                targetRole: "customer",
            });
            return c.json({ success: true, data }, 201);
        } catch (error) {
            console.error("[NotificationsController.createSecurityAlert]", error);
            return c.json({ success: false, message: "Internal Server Error" }, 500);
        }
    },

    /**
     * PATCH /api/v1/notifications/user/:userId/read-all
     * Mark all of a customer's notifications (own + global) as read
     */
    async markAllUserAsRead(c: Context) {
        try {
            const userId = c.req.param("userId");
            if (!userId) {
                return c.json({ success: false, message: "User ID is required" }, 400);
            }
            const updated = await NotificationsService.markAllUserAsRead(userId);
            return c.json({ success: true, data: updated }, 200);
        } catch (error) {
            console.error("[NotificationsController.markAllUserAsRead]", error);
            return c.json({ success: false, message: "Internal Server Error" }, 500);
        }
    },
};