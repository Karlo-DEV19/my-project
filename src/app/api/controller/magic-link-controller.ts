// ─────────────────────────────────────────────────────────────
// Magic Link Controller
//
// Business logic for POST /api/v1/auth/magic-link/send.
// This file is the only place that orchestrates:
//   1. Request validation (Zod)
//   2. Magic link generation (Supabase Admin API)
//   3. Email delivery (Nodemailer)
//   4. Activity logging (non-blocking)
//
// Security invariants enforced here:
//   • The action_link URL is NEVER returned to the client
//   • Email enumeration is prevented (identical response for
//     existing / non-existing accounts)
//   • redirectTo is validated against the same origin
//     before being passed to Supabase
// ─────────────────────────────────────────────────────────────

import type { Context } from 'hono'

import { sendMagicLinkSchema } from '@/app/api/zod/magic-link-schema'
import type { MagicLinkApiResponse } from '@/app/api/zod/magic-link-schema'

import { sendMagicLinkEmail } from '@/app/api/services/nodemailer/send-magic-link-service'
import { supabaseAdmin, db } from '@/lib/supabase/db'
import { createActivityLog } from '@/app/api/controller/activity-logs'
import { ActivityAction, ActivityModule } from '@/lib/constans/activity-log'

// ─── Environment ──────────────────────────────────────────────
// NEXT_PUBLIC_API_URL is already set in .env.local (http://localhost:3000)
const SITE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
const DEFAULT_REDIRECT_PATH = '/auth/callback'
const DEFAULT_REDIRECT_URL = `${SITE_URL}${DEFAULT_REDIRECT_PATH}`

// ─── Response helpers ─────────────────────────────────────────
function ok(c: Context, message: string): Response {
    return c.json<MagicLinkApiResponse>({ success: true, message }, 200)
}

function fail(
    c: Context,
    message: string,
    status: 400 | 429 | 500 = 500,
): Response {
    return c.json<MagicLinkApiResponse>({ success: false, message }, status)
}

// ─── Open-redirect guard ──────────────────────────────────────
// Ensures redirectTo is on the same origin as SITE_URL.
// Any external or malformed URL falls back to DEFAULT_REDIRECT_URL.
function resolveSafeRedirect(redirectTo: string | undefined): string {
    if (!redirectTo) return DEFAULT_REDIRECT_URL

    try {
        const siteOrigin = new URL(SITE_URL).origin
        const redirectOrigin = new URL(redirectTo).origin
        return redirectOrigin === siteOrigin ? redirectTo : DEFAULT_REDIRECT_URL
    } catch {
        return DEFAULT_REDIRECT_URL
    }
}

// ─────────────────────────────────────────────────────────────
// POST /api/v1/auth/magic-link/send
// ─────────────────────────────────────────────────────────────
export async function sendMagicLink(c: Context): Promise<Response> {
    try {
        // ── 1. Validate & normalise request body ──────────────────────────
        const body: unknown = await c.req.json()

        const parsed = sendMagicLinkSchema.safeParse(body)
        if (!parsed.success) {
            const message =
                parsed.error.issues[0]?.message ?? 'Invalid request body.'
            return fail(c, message, 400)
        }

        const { email, redirectTo } = parsed.data

        // ── 2. Resolve safe redirect URL ──────────────────────────────────
        const safeRedirectTo = resolveSafeRedirect(redirectTo)

        // ── 3. Generate magic link via Supabase Admin API ─────────────────
        // generateLink() returns the raw token URL without sending any email.
        // This is the Admin API — requires SUPABASE_SERVICE_ROLE_KEY.
        const { data: linkData, error: linkError } =
            await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email,
                options: { redirectTo: safeRedirectTo },
            })

        // If Supabase rejects the request (rate limit, invalid config, etc.)
        // we log internally but return a neutral message to prevent enumeration.
        if (linkError) {
            console.error('[magic-link] generateLink error:', linkError.message)
            // Intentionally identical to success to prevent email enumeration
            return ok(
                c,
                "If an account exists for this email, a sign-in link has been sent.",
            )
        }

        const magicLinkUrl = linkData.properties?.action_link

        if (!magicLinkUrl) {
            console.error('[magic-link] action_link missing from generateLink response')
            return fail(c, 'Failed to generate sign-in link. Please try again.', 500)
        }

        // ── 4. Send branded email via Nodemailer ──────────────────────────
        // IMPORTANT: magicLinkUrl is passed to the service layer only.
        // It is never returned in the API response.
        const emailResult = await sendMagicLinkEmail(email, magicLinkUrl)

        if (!emailResult.success) {
            return fail(
                c,
                'Failed to send sign-in email. Please try again.',
                500,
            )
        }

        // ── 5. Log activity (non-blocking, never throws) ──────────────────
        // linkData.user.id is the Supabase auth UID (may be new or existing).
        const userId = linkData.user?.id
        if (userId) {
            void createActivityLog(db, {
                userId,
                action: ActivityAction.MAGIC_LINK_SENT,
                module: ActivityModule.AUTH,
                description: `Magic link sent to ${email}`,
            })
        }

        // ── 6. Return success ──────────────────────────────────────────────
        // Neutral message prevents email enumeration.
        return ok(
            c,
            "If an account exists for this email, a sign-in link has been sent.",
        )
    } catch (err) {
        console.error('[magic-link] Unexpected controller error:', err)
        return fail(c, 'An unexpected error occurred. Please try again.', 500)
    }
}
