import { Hono } from "hono";
import { handle } from "hono/vercel";

// Import routers
import productBlindsRoute from "./routes/product-blinds-route";
import geocodeRoute from "./routes/geocodeRoute";
const app = new Hono().basePath("/api/v1");

// Mount routers
app.route("/product-blinds", productBlindsRoute);
app.route("/geocode", geocodeRoute);
app.get('/hello', (c) => {
    return c.json({
        message: 'Hello from Hono!'
    })
})


// Export for Next.js (Edge/Node)
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
