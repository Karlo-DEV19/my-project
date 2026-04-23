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

        const customerName = [order.customerFirstName, order.customerLastName].filter(Boolean).join(" ") || "Valued Customer";

        const itemsHtml = items.length > 0
            ? items.map((item) => `
                <tr>
                    <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">
                        <div style="font-weight:600;color:#111827;">${item.productName}</div>
                        <div style="font-size:11px;color:#6b7280;margin-top:2px;">${item.productCode}${item.colorName ? ` · ${item.colorName}` : ""}</div>
                    </td>
                    <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;text-align:center;">${item.quantity}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;text-align:right;">${formatPHP(item.unitPrice)}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:600;color:#111827;text-align:right;">${formatPHP(item.subtotal)}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="4" style="padding:16px 12px;text-align:center;font-size:13px;color:#9ca3af;">No items listed.</td></tr>`;

        const mailOptions = {
            from: defaultFrom,
            to: order.customerEmail,
            subject: `[MJ Decor 888] ${config.title} - ${order.trackingNumber}`,
            html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${config.title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:${config.color};padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">MJ Decor 888</h1>
              <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.80);letter-spacing:0.08em;text-transform:uppercase;">${config.label}</p>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="background:${config.bg};padding:20px 40px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0;font-size:18px;font-weight:700;color:${config.color};">${config.title}</p>
              <p style="margin:6px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">${config.message}</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 40px 8px;">
              <p style="margin:0;font-size:14px;color:#374151;">Hi <strong>${customerName}</strong>,</p>
              <p style="margin:8px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
                Here are the details for your order. If you have any questions, feel free to reach out to us.
              </p>
            </td>
          </tr>

          <!-- Order Info -->
          <tr>
            <td style="padding:16px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;border-bottom:1px solid #e5e7eb;">Order Information</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:12px;color:#6b7280;padding-bottom:8px;width:50%;">Tracking Number</td>
                        <td style="font-size:12px;font-weight:700;color:#111827;text-align:right;padding-bottom:8px;">${order.trackingNumber}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#6b7280;padding-bottom:8px;">Reference Number</td>
                        <td style="font-size:12px;color:#374151;text-align:right;padding-bottom:8px;">${order.referenceNumber}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#6b7280;padding-bottom:8px;">Payment Method</td>
                        <td style="font-size:12px;color:#374151;text-align:right;padding-bottom:8px;text-transform:capitalize;">${order.paymentMethod}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#6b7280;">Order Date</td>
                        <td style="font-size:12px;color:#374151;text-align:right;">${order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—"}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Items -->
          <tr>
            <td style="padding:0 40px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;text-align:left;border-bottom:1px solid #e5e7eb;">Product</th>
                    <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;text-align:center;border-bottom:1px solid #e5e7eb;">Qty</th>
                    <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;text-align:right;border-bottom:1px solid #e5e7eb;">Unit Price</th>
                    <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;text-align:right;border-bottom:1px solid #e5e7eb;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Order Totals -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;border-bottom:1px solid #e5e7eb;">Payment Summary</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:12px;color:#6b7280;padding-bottom:8px;">Subtotal (excl. VAT)</td>
                        <td style="font-size:12px;color:#374151;text-align:right;padding-bottom:8px;">${formatPHP(order.subtotal)}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#6b7280;padding-bottom:8px;">VAT (12%)</td>
                        <td style="font-size:12px;color:#374151;text-align:right;padding-bottom:8px;">${formatPHP(order.vat)}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;font-weight:700;color:#111827;padding-bottom:8px;border-top:1px solid #e5e7eb;padding-top:10px;">Total Amount</td>
                        <td style="font-size:13px;font-weight:700;color:#111827;text-align:right;border-top:1px solid #e5e7eb;padding-top:10px;padding-bottom:8px;">${formatPHP(order.totalAmount)}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#6b7280;padding-bottom:6px;">Downpayment (50%)</td>
                        <td style="font-size:12px;font-weight:600;color:${config.color};text-align:right;padding-bottom:6px;">${formatPHP(order.downpaymentAmount)}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#6b7280;">Remaining Balance</td>
                        <td style="font-size:12px;color:#374151;text-align:right;">${formatPHP(order.balanceAmount)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Track Order CTA -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <a href="https://mj-decor888.vercel.app/order/${order.trackingNumber}"
                 style="display:inline-block;background:${config.color};color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:13px 32px;border-radius:8px;letter-spacing:0.03em;">
                Track My Order →
              </a>
              <p style="margin:12px 0 0;font-size:11px;color:#9ca3af;">
                Or copy this link: https://mj-decor888.vercel.app/order/${order.trackingNumber}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                MJ Decor 888 · Premium Window Solutions
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#d1d5db;">
                This is an automated email. Please do not reply directly to this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        };

        console.log(`📧 Dispatching ${resolvedType} email to ${order.customerEmail}...`)
        const info = await transporter.sendMail(mailOptions)
        console.log(`✅ Success: ${info.messageId}`)

        return { success: true }
    } catch (error) {
        console.error(`❌ Mailer Error:`, error)
        return { success: false, error: `Failed to deliver notification.` }
    }
} //hahaha hihi