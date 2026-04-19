import { Hono } from "hono"
import { checkoutOrder, getAllOrders, getOrderDetailsStatus, updateOrderStatus, getDashboardStats, getMonthlySales } from "@/app/api/controller/order-controller"
const orderRoute = new Hono()

orderRoute.post('/checkout', checkoutOrder)
orderRoute.get('/', getAllOrders)
orderRoute.get('/get-order-details-status', getOrderDetailsStatus)
orderRoute.get('/get-all-orders', getAllOrders)
orderRoute.get('/dashboard-stats', getDashboardStats)
orderRoute.get('/monthly-sales', getMonthlySales)
orderRoute.patch('/:id/status', updateOrderStatus)
export default orderRoute