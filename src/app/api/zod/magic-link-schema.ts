import { z } from 'zod'

// ─────────────────────────────────────────────────────────────
// Request body — POST /api/v1/auth/magic-link/send
//
// email    : validated, normalised (trim + lowercase) by Zod
// redirectTo : optional, validated as a URL string.
//              The controller enforces same-origin before use.
// ─────────────────────────────────────────────────────────────
export const sendMagicLinkSchema = z.object({
    email: z
        .string({ error: 'Email is required.' })
        .email('A valid email address is required.')
        .max(255, 'Email address is too long.')
        .transform((v) => v.trim().toLowerCase()),

    redirectTo: z
        .string()
        .url('redirectTo must be a valid URL.')
        .optional(),
})

export type SendMagicLinkPayload = z.infer<typeof sendMagicLinkSchema>

// ─────────────────────────────────────────────────────────────
// Typed API response union
// ─────────────────────────────────────────────────────────────
export type MagicLinkSuccessResponse = {
    success: true
    message: string
}

export type MagicLinkErrorResponse = {
    success: false
    message: string
}

export type MagicLinkApiResponse =
    | MagicLinkSuccessResponse
    | MagicLinkErrorResponse
