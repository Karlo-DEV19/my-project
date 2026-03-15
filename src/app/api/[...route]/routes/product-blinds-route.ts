import { Hono } from "hono";
import { createNewBlinds, getAllBlinds, getDetailsBlindByProductId } from "@/app/api/controller/product-blinds-controller";

// =========================
// PRODUCT BLINDS ROUTER
// =========================
const productBlindsRoute = new Hono();

// CREATE a product blinds
productBlindsRoute.post("/", createNewBlinds);

// GET all product blinds
productBlindsRoute.get("/", getAllBlinds);

// GET details of a product blinds
productBlindsRoute.get("/:productId", getDetailsBlindByProductId);


export default productBlindsRoute;