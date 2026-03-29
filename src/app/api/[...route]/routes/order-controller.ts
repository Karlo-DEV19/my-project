import { Hono } from "hono"
import { checkoutOrder, getAllOrders, getOrderDetailsStatus } from "@/app/api/controller/order-controller"
const orderRoute = new Hono()

orderRoute.post('/checkout', checkoutOrder)
orderRoute.get('/get-order-details-status', getOrderDetailsStatus)
orderRoute.get('/get-all-orders', getAllOrders)
export default orderRoute