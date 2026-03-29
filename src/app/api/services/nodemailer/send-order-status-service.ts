import { defaultFrom, transporter } from "./config"
import { Order, OrderItem } from "@/schema/orders/orders"

/**
 * Sends an order status update email to the customer.
 */
export async function sendOrderStatusEmail(
    order: Order,
    items: OrderItem[],
    type: "placed" | "paid" | "failed" | "cancelled"
) {
    try {
        const isSuccess = type === "paid" || type === "placed"
        
        let statusTitle = "Order Received"
        let statusMessage = "Thank you for your order! We've received your request and are waiting for the downpayment to begin processing."
        
        if (type === "paid") {
            statusTitle = "Payment Confirmed"
            statusMessage = "Great news! Your downpayment has been successfully processed. We are now preparing your order."
        } else if (type === "failed") {
            statusTitle = "Payment Failed"
            statusMessage = "We're sorry, but your payment attempt was unsuccessful. Please try again or contact support if you need help."
        } else if (type === "cancelled") {
            statusTitle = "Order Cancelled"
            statusMessage = "Your order has been cancelled because the payment session expired or was manually stopped."
        }

        const statusColor = type === "paid" ? "#10b981" : type === "placed" ? "#6366f1" : "#ef4444"
        const statusBg = type === "paid" ? "#f0fdf4" : type === "placed" ? "#f5f3ff" : "#fef2f2"

        const formatter = new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        })

        // Helper to safely format numbers
        const formatPHP = (val: any) => {
            const num = Number(val)
            return isNaN(num) ? "₱0.00" : formatter.format(num)
        }

        const mailOptions = {
            from: defaultFrom,
            to: order.customerEmail,
            subject: `[MJ Decor 888] ${statusTitle} - ${order.trackingNumber}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #18181b; background-color: #ffffff;">
                    
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h1 style="font-size: 28px; font-weight: bold; letter-spacing: -0.02em; margin: 0; font-family: serif; color: #000000;">
                            MJ DECOR 888
                        </h1>
                        <p style="font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 8px;">
                            Premium Blinds & Window Solutions
                        </p>
                    </div>

                    <!-- Status Banner -->
                    <div style="background-color: ${statusBg}; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px; border: 1px solid ${statusColor}20;">
                        <div style="display: inline-block; padding: 8px 16px; background-color: ${statusColor}; color: white; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;">
                            Order ${type.toUpperCase()}
                        </div>
                        <h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 0 0 12px 0;">
                            ${statusTitle}
                        </h2>
                        <p style="font-size: 16px; color: #3f3f46; line-height: 1.6; margin: 0;">
                            ${statusMessage}
                        </p>
                    </div>

                    <!-- Order Details -->
                    <div style="border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; margin-bottom: 32px;">
                        <div style="padding: 24px;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #71717a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Tracking Number</td>
                                    <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 700; text-align: right;">${order.trackingNumber}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #71717a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Reference Number</td>
                                    <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 700; text-align: right;">${order.referenceNumber}</td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <!-- Item Summary -->
                    <div style="margin-bottom: 32px;">
                        <h3 style="font-size: 16px; font-weight: 700; color: #18181b; margin: 0 0 16px 0;">
                            Order Summary
                        </h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            ${items
                                .map(
                                    (item) => `
                            <tr style="border-bottom: 1px solid #f4f4f5;">
                                <td style="padding: 12px 0;">
                                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #18181b;">${item.productName}</p>
                                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #71717a;">Qty: ${item.quantity} • ${item.colorName || "Standard"}</p>
                                </td>
                                <td style="padding: 12px 0; text-align: right; vertical-align: top;">
                                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #18181b;">${formatPHP(item.subtotal)}</p>
                                </td>
                            </tr>
                            `
                                )
                                .join("")}
                        </table>
                    </div>

                    <!-- Totals Breakdown -->
                    <div style="background-color: #fafafa; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 4px 0; color: #71717a; font-size: 14px;">Total Order Value</td>
                                <td style="padding: 4px 0; color: #18181b; font-size: 14px; text-align: right;">${formatPHP(order.totalAmount)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; color: ${statusColor}; font-size: 14px; font-weight: 600;">Downpayment (50%)</td>
                                <td style="padding: 4px 0; color: ${statusColor}; font-size: 14px; font-weight: 600; text-align: right;">${formatPHP(order.downpaymentAmount)}</td>
                            </tr>
                            <tr style="border-top: 1px solid #e4e4e7; margin-top: 8px;">
                                <td style="padding: 12px 0 4px 0; color: #71717a; font-size: 14px;">Balance due on delivery</td>
                                <td style="padding: 12px 0 4px 0; color: #18181b; font-size: 16px; font-weight: 700; text-align: right;">${formatPHP(order.balanceAmount)}</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; border-top: 1px solid #f4f4f5; padding-top: 32px;">
                        <p style="font-size: 14px; color: #3f3f46; margin-bottom: 24px;">
                            ${
                                type === "placed"
                                    ? "Please complete your payment to avoid order cancellation."
                                    : "Thank you for choosing MJ DECOR 888."
                            }
                        </p>
                        <p style="font-size: 11px; color: #a1a1aa; line-height: 1.6;">
                            <b>MJ Decor 888</b><br />
                            Premium Blinds & Window Solutions<br />
                            This is an automated message, please do not reply.
                        </p>
                    </div>
                </div>
            `,
        }

        console.log(`📧 Attempting to send ${type} email to ${order.customerEmail}...`)
        const info = await transporter.sendMail(mailOptions)
        console.log(`✅ Order ${type} Email sent successfully:`, info.messageId)

        return { success: true }
    } catch (error) {
        console.error(`❌ Error sending order ${type} email:`, error)
        return { success: false, error: `Failed to send order ${type} email.` }
    }
}
