import { Hono } from "hono";
import { createNewBlinds, getAllBestSeller, getAllBlinds, getAllNewArrival, getDetailsBlindByProductId, updateBlindsById } from "@/app/api/controller/product-blinds-controller";

// =========================
// PRODUCT BLINDS ROUTER
// =========================
const productBlindsRoute = new Hono();

// CREATE a product blinds
productBlindsRoute.post("/", createNewBlinds);

// UPDATE a product blinds
productBlindsRoute.put("/:productId/update", updateBlindsById);

// GET all product blinds
productBlindsRoute.get("/", getAllBlinds);

// GET Collections (Must be before /:productId to prevent route collision)
productBlindsRoute.get("/best-seller", getAllBestSeller);
productBlindsRoute.get("/new-arrival", getAllNewArrival);

// GET details of a product blinds
productBlindsRoute.get("/:productId", getDetailsBlindByProductId);

export default productBlindsRoute;