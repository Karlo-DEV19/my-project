import { defaultFrom, transporter } from "./config"
import { Order, OrderItem } from "@/schema/orders/orders"

export async function sendOrderStatusEmail(
    order: Order,
    items: OrderItem[],
    type: "placed" | "paid" | "failed" | "cancelled"
) {
    try {
        // Theme Configurations
        const config = {
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
        }[type];

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
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Inter', -apple-system, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="text-align: center; padding: 32px 0;">
            <div style="display: inline-block; padding: 10px; background-color: #18181b; color: #ffffff; font-weight: 800; font-size: 20px; letter-spacing: 2px; margin-bottom: 8px;">M</div>
            <h1 style="font-size: 16px; font-weight: 800; letter-spacing: 0.1em; margin: 0; color: #18181b; text-transform: uppercase;">
                MJ DECOR <span style="color: #4f46e5;">888</span>
            </h1>
            <p style="font-size: 11px; color: #71717a; text-transform: uppercase; margin-top: 4px; letter-spacing: 1px;">Premium Korean Window Solutions</p>
        </div>

        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04);">
            
            <div style="background-color: ${config.bg}; padding: 48px 32px; text-align: center;">
                <div style="display: inline-block; padding: 6px 16px; background-color: #ffffff; border: 1px solid ${config.color}; color: ${config.color}; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 20px;">
                    ${config.label}
                </div>
                <h2 style="font-size: 32px; font-weight: 800; color: #18181b; margin: 0 0 16px 0; letter-spacing: -0.02em;">
                    ${config.title}
                </h2>
                <p style="font-size: 16px; color: #52525b; line-height: 1.6; margin: 0 auto; max-width: 440px;">
                    ${config.message}
                </p>
            </div>

            <div style="padding: 24px 32px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td width="50%">
                            <p style="margin: 0; font-size: 11px; color: #a1a1aa; text-transform: uppercase; font-weight: 700;">Order ID</p>
                            <p style="margin: 4px 0 0 0; font-size: 15px; color: #18181b; font-weight: 700;">#${order.trackingNumber}</p>
                        </td>
                        <td width="50%" style="text-align: right;">
                            <p style="margin: 0; font-size: 11px; color: #a1a1aa; text-transform: uppercase; font-weight: 700;">Tracking Link</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px;"><a href="https://mjdecor888.com/track/${order.trackingNumber}" style="color: #4f46e5; text-decoration: none; font-weight: 600;">Click to track →</a></p>
                        </td>
                    </tr>
                </table>
            </div>

            <div style="padding: 32px;">
                <h3 style="font-size: 14px; font-weight: 800; color: #18181b; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.05em;">Your Selection</h3>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    ${items.map((item) => `
                        <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9;">
                                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #18181b;">${item.productName}</p>
                                <p style="margin: 4px 0 0 0; font-size: 13px; color: #71717a;">
                                    Qty: ${item.quantity} • ${item.colorName || "Standard Finish"}
                                </p>
                            </td>
                            <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9; text-align: right; vertical-align: top;">
                                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #18181b;">${formatPHP(item.subtotal)}</p>
                            </td>
                        </tr>
                    `).join("")}
                </table>

                <div style="margin-top: 24px; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Total Order Value</td>
                            <td style="padding: 4px 0; color: #18181b; font-size: 14px; text-align: right; font-weight: 600;">${formatPHP(order.totalAmount)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #4f46e5; font-size: 14px; font-weight: 700;">Required Downpayment (50%)</td>
                            <td style="padding: 4px 0; color: #4f46e5; font-size: 14px; font-weight: 700; text-align: right;">${formatPHP(order.downpaymentAmount)}</td>
                        </tr>
                        <tr style="border-top: 2px solid #e2e8f0;">
                            <td style="padding: 16px 0 0 0; color: #18181b; font-size: 14px; font-weight: 700;">Remaining Balance</td>
                            <td style="padding: 16px 0 0 0; color: #18181b; font-size: 20px; font-weight: 900; text-align: right;">${formatPHP(order.balanceAmount)}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <div style="padding: 0 32px 40px 32px; text-align: center;">
                <a href="https://mjdecor888.com/track/${order.trackingNumber}" style="display: block; background-color: #18181b; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">
                    Manage Order & Payment
                </a>
            </div>

            <div style="margin: 0 32px 32px 32px; padding: 24px; background-color: #ffffff; border: 1px dashed #e2e8f0; border-radius: 12px;">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #18181b; font-weight: 800;">Need assistance?</h4>
                <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b; line-height: 1.5;">Our design consultants are ready to help you with measurements, payment options, or delivery schedules.</p>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td style="font-size: 12px; color: #18181b;">
                            <strong>Email:</strong> mjdecor888@gmail.com<br>
                            <strong>Phone:</strong> 0917 694 8888
                        </td>
                        <td style="text-align: right;">
                            <a href="https://www.facebook.com/MJDECOR888INC" style="text-decoration: none; margin-left: 10px;">
                                <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="20" height="20" alt="FB">
                            </a>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <div style="text-align: center; margin-top: 40px;">
            <p style="font-size: 12px; color: #18181b; font-weight: 700; margin-bottom: 8px;">MJ DECOR 888 INC.</p>
            <p style="font-size: 11px; color: #a1a1aa; line-height: 1.6; margin: 0;">
                35 20th Avenue, Murphy Cubao, Quezon City, 1109<br>
                © 2026 MJ DECORS. All rights reserved.<br>
                <span style="font-size: 10px; color: #d4d4d8;">This is an automated notification. Please do not reply.</span>
            </p>
        </div>
    </div>
</body>
</html>
            `,
        };

        console.log(`📧 Dispatching ${type} email to ${order.customerEmail}...`)
        const info = await transporter.sendMail(mailOptions)
        console.log(`✅ Success: ${info.messageId}`)

        return { success: true }
    } catch (error) {
        console.error(`❌ Mailer Error:`, error)
        return { success: false, error: `Failed to deliver ${type} notification.` }
    }
}