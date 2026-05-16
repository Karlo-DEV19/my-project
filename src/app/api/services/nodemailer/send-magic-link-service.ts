// ─────────────────────────────────────────────────────────────
// Magic Link Email Sender
//
// Thin wrapper around the shared Nodemailer transporter.
// Builds the HTML via buildMagicLinkEmail(), then delegates
// to transporter.sendMail(). All errors are caught and
// returned as a typed result — never thrown to callers.
//
// Reuses: config.ts → transporter + defaultFrom
//         magic-link-email.ts → buildMagicLinkEmail()
// ─────────────────────────────────────────────────────────────

import { transporter, defaultFrom } from './config'
import { buildMagicLinkEmail } from '../emails/magic-link-email'

// ─── Return type ──────────────────────────────────────────────
export type SendMagicLinkResult =
    | { success: true }
    | { success: false; error: string }

// ─────────────────────────────────────────────────────────────
// sendMagicLinkEmail
//
// @param recipientEmail  - The customer's email address
// @param magicLinkUrl    - The raw Supabase action_link URL
//                          (NEVER logged or returned to the client)
// ─────────────────────────────────────────────────────────────
export async function sendMagicLinkEmail(
    recipientEmail: string,
    magicLinkUrl: string,
): Promise<SendMagicLinkResult> {
    try {
        const html = buildMagicLinkEmail({
            recipientEmail,
            magicLinkUrl,
            expiresInMinutes: 60,
        })

        const info = await transporter.sendMail({
            from: defaultFrom,
            to: recipientEmail,
            subject: 'Your MJ Decors sign-in link',
            html,
        })

        console.log(`[magic-link] Sent to ${recipientEmail} — messageId: ${info.messageId}`)
        return { success: true }
    } catch (err) {
        console.error('[magic-link] sendMail failed:', err)
        return { success: false, error: 'Failed to send sign-in email.' }
    }
}
