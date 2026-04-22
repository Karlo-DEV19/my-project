import { defaultFrom, transporter } from "./config"
import { Order, OrderItem } from "@/schema/orders/orders"

export async function sendOrderStatusEmail(
    order: Order,
    items: OrderItem[],
    type?: "placed" | "paid" | "failed" | "cancelled"
) {
    try {
        // 🔥 AUTO-DETECT (NO MORE WRONG EMAILS)
        let resolvedType = type;

        if (!resolvedType) {
            if (order.downpaymentAmount && Number(order.downpaymentAmount) > 0) {
                resolvedType = "paid";
            } else {
                resolvedType = "placed";
            }
        }

        // Theme Configurations
        const configMap = {
            placed: {
                title: "Order Received",
                message: "Thank you for choosing MJ Decor 888! We've received your order and are awaiting the 50% downpayment to begin production.",
                color: "#4f46e5",
                bg: "#f5f3ff",
                label: "Awaiting Downpayment"
            },
            paid: {
                title: "Payment Confirmed",
                message: "Great news! Your downpayment has been verified. Our team is now preparing your premium window solutions.",
                color: "#0ea5e9",
                bg: "#f0f9ff",
                label: "In Production"
            },
            failed: {
                title: "Payment Failed",
                message: "We encountered an issue with your payment. Please attempt the transaction again to secure your order.",
                color: "#ef4444",
                bg: "#fef2f2",
                label: "Action Required"
            },
            cancelled: {
                title: "Order Cancelled",
                message: "Your order has been cancelled because the payment session expired or was manually terminated.",
                color: "#71717a",
                bg: "#f4f4f5",
                label: "Cancelled"
            }
        };

        const config = configMap[resolvedType!];

        const formatter = new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        });

        const formatPHP = (val: any) => {
            const num = Number(val);
            return isNaN(num) ? "₱0.00" : formatter.format(num);
        };

        const mailOptions = {
            from: defaultFrom,
            to: order.customerEmail,
            subject: `[MJ Decor 888] ${config.title} - ${order.trackingNumber}`,
            html: `... SAME HTML (no change needed) ...`,
        };

        console.log(`📧 Dispatching ${resolvedType} email to ${order.customerEmail}...`)
        const info = await transporter.sendMail(mailOptions)
        console.log(`✅ Success: ${info.messageId}`)

        return { success: true }
    } catch (error) {
        console.error(`❌ Mailer Error:`, error)
        return { success: false, error: `Failed to deliver notification.` }
    }
}