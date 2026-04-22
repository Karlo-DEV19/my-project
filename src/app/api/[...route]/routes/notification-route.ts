import { Hono } from "hono";
import { NotificationsController } from "../../notifications/notifications.controller";

const notificationsRoute = new Hono();

// ── Admin routes ────────────────────────────────────────────────────────────
// NOTE: specific paths must be registered BEFORE parameterised ones to avoid
//       Hono matching "read-all" or "user" as an :id / :userId segment.

notificationsRoute.get("/", NotificationsController.getAllNotifications);
notificationsRoute.patch("/read-all", NotificationsController.markAllAsRead);

// ── Customer routes ─────────────────────────────────────────────────────────
notificationsRoute.get("/user/:userId", NotificationsController.getUserNotifications);
notificationsRoute.patch("/user/:userId/read-all", NotificationsController.markAllUserAsRead);

// POST — specific path before generic param route
notificationsRoute.post("/security-alert", NotificationsController.createSecurityAlert);
notificationsRoute.post("/", NotificationsController.createNotification);

// Shared: single-notification mark-as-read (admin + customer)
notificationsRoute.patch("/:id/read", NotificationsController.markAsRead);

export default notificationsRoute;