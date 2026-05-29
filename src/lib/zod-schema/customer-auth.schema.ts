// ─────────────────────────────────────────────────────────────
// Customer Auth — Client-Side Zod Schema
//
// Mirrors the server-side sendMagicLinkSchema (app/api/zod/) but
// lives separately to avoid pulling server-only code into the
// client bundle.
//
// Intentionally does NOT include redirectTo — that is appended
// by the mutation hook at runtime (window.location.origin + /auth/callback).
// ─────────────────────────────────────────────────────────────

import { z } from 'zod'

export const customerMagicLinkSchema = z.object({
    email: z
        .string({ error: 'Email address is required.' })
        .min(1, 'Email address is required.')
        .email('Please enter a valid email address.')
        .max(255, 'Email address is too long.')
        .transform((v) => v.trim().toLowerCase()),
})

export type CustomerMagicLinkValues = z.infer<typeof customerMagicLinkSchema>

// ─────────────────────────────────────────────────────────────
// Step 2 — OTP code entry
// ─────────────────────────────────────────────────────────────
export const customerOtpSchema = z.object({
    code: z
        .string({ error: 'Verification code is required.' })
        .length(6, 'Please enter the 6-digit code.')
        .regex(/^\d{6}$/, 'Code must be 6 digits.'),
})

export type CustomerOtpValues = z.infer<typeof customerOtpSchema>
