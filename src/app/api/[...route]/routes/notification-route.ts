import { Hono } from "hono";
import { NotificationsController } from "../../notifications/notifications.controller";

const notificationsRoute = new Hono();

notificationsRoute.get("/", NotificationsController.getAllNotifications);
notificationsRoute.patch("/read-all", NotificationsController.markAllAsRead);
notificationsRoute.patch("/:id/read", NotificationsController.markAsRead);

export default notificationsRoute;