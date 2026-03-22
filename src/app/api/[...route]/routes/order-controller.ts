import { Hono } from "hono"
import { checkoutOrder } from "@/app/api/controller/order-controller"
const orderRoute = new Hono()

orderRoute.post('/checkout', checkoutOrder)
export default orderRoute