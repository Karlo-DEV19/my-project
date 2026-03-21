import { defaultFrom, transporter } from "./config"

/**
 * Sends a 6-digit OTP code to the MJ Decor 888 staff email.
 */
export async function sendOtpEmail(email: string, code: string) {
    try {
        const mailOptions = {
            from: defaultFrom,
            to: email,
            subject: `${code} is your MJ Decor 888 access code`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; color: #18181b; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h1 style="font-size: 24px; font-weight: bold; letter-spacing: -0.02em; margin: 0; font-family: serif;">
                            MJ DECOR 888
                        </h1>
                        <p style="font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">
                            Staff Portal Access
                        </p>
                    </div>

                    <div style="border: 1px solid #e4e4e7; border-radius: 12px; padding: 32px; text-align: center;">
                        <p style="font-size: 16px; color: #3f3f46; margin-bottom: 24px;">
                            Enter the following code to verify your identity and access the workspace.
                        </p>
                        
                        <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 24px 0;">
                            <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #000000; font-family: monospace;">
                                ${code}
                            </span>
                        </div>
                        
                        <p style="font-size: 14px; color: #71717a; line-height: 1.5;">
                            This code expires in <b>5 minutes</b>.<br />
                            If you didn't request this, please ignore this email.
                        </p>
                    </div>

                    <div style="margin-top: 32px; text-align: center; border-top: 1px solid #f4f4f5; padding-top: 24px;">
                        <p style="font-size: 11px; color: #a1a1aa; line-height: 1.6;">
                            <b>MJ Decor 888</b><br />
                            Premium Blinds & Window Solutions<br />
                            Internal Management System • Authorized Personnel Only
                        </p>
                    </div>
                </div>
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