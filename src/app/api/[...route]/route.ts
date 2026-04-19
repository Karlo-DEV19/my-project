import { Hono } from "hono";
import { handle } from "hono/vercel";

// Import routers
import productBlindsRoute from "./routes/product-blinds-route";
import geocodeRoute from "./routes/geocodeRoute";
import webhooksRoute from "./routes/payment-webhook";
import orderRoute from "./routes/order-controller";
import activityLogsRoute from "./routes/activity-logs-route";
import notificationsRoute from "./routes/notification-route";
import userRoute from "./routes/user-route";

const app = new Hono().basePath("/api/v1");

// Mount routers
app.route("/product-blinds", productBlindsRoute);
app.route("/geocode", geocodeRoute);
app.route("/webhooks", webhooksRoute);
app.route("/orders", orderRoute);
app.route("/activity-logs", activityLogsRoute);
app.route("/notifications", notificationsRoute);
app.route("/users", userRoute);


// Export for Next.js (Edge/Node)
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
