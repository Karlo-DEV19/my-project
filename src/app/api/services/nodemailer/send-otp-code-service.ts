import { defaultFrom, transporter } from "./config"

/**
 * Sends a 6-digit OTP code
 * Supports both ADMIN and CUSTOMER flows
 */
export async function sendOtpEmail(
    email: string,
    code: string,
    role: "admin" | "customer"
) {
    try {
        const isAdmin = role === "admin"

        const title = isAdmin
            ? "Staff Portal Access"
            : "Account Security Verification"

        const subject = isAdmin
            ? `${code} is your MJ Decor 888 staff access code`
            : `${code} is your MJ Decor 888 verification code`

        const footerNote = isAdmin
            ? `
        Internal Management System<br />
        <span style="color: #d4d4d8;">Authorized Personnel Only</span>
      `
            : `
        Customer Portal Access
      `

        const mailOptions = {
            from: defaultFrom,
            to: email,
            subject,
            html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
            <div style="max-width: 500px; margin: 0 auto; padding: 60px 24px; color: #18181b;">
                
                <div style="text-align: center; margin-bottom: 48px;">
                    <p style="font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: #71717a; margin-bottom: 8px;">
                        MJ Decor 888
                    </p>
                    <h1 style="font-family: 'Georgia', serif; font-size: 26px; font-weight: 400; letter-spacing: 0.05em; margin: 0; color: #000000;">
                        ${title}
                    </h1>
                </div>

                <div style="border: 1px solid #e4e4e7; padding: 48px 32px; text-align: center;">
                    <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #71717a; margin-bottom: 24px; font-weight: 600;">
                        Verification Code
                    </p>
                    
                    <div style="background-color: #fafafa; border: 1px solid #f4f4f5; padding: 32px 10px; margin-bottom: 24px;">
                        <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #000000; font-family: ui-monospace, 'Cascadia Code', Menlo, Monaco, monospace;">
                            ${code}
                        </span>
                    </div>

                    <p style="font-size: 13px; color: #3f3f46; line-height: 1.6; margin-bottom: 0;">
                        Enter this code to verify your identity. <br/>
                        <span style="color: #a1a1aa; font-size: 11px;">Expires in 5 minutes.</span>
                    </p>
                </div>

                <div style="margin-top: 48px; text-align: center; border-top: 1px solid #f4f4f5; padding-top: 32px;">
                    <p style="font-size: 9px; color: #a1a1aa; letter-spacing: 0.15em; text-transform: uppercase; line-height: 2;">
                        <b>MJ DECOR 888</b><br />
                        ${footerNote}
                    </p>
                </div>
            </div>
        </body>
        </html>
      `,
        }

        const info = await transporter.sendMail(mailOptions)
        console.log("✅ OTP Email sent successfully:", info.messageId)

        return { success: true }
    } catch (error) {
        console.error("❌ Error sending OTP email:", error)
        return { success: false, error: "Failed to send verification email." }
    }
}