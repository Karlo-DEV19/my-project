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
