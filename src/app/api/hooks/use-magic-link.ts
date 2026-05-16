// ─────────────────────────────────────────────────────────────
// Customer Auth — React Query Mutation Hook
//
// Calls POST /api/v1/auth/magic-link/send via axiosApiClient.
// This deliberately goes through the Hono backend instead of
// calling Supabase directly so that:
//   • Email enumeration protection applies
//   • Branded Nodemailer email is sent (not Supabase default)
//   • Activity logging runs
//   • Rate-limiting middleware applies
//
// Pattern: mirrors use-users-api.ts (useMutation signature).
// ─────────────────────────────────────────────────────────────

import { useMutation } from '@tanstack/react-query'
import { axiosApiClient } from '../axiosApiClient'
import type { MagicLinkApiResponse, SendMagicLinkRequest } from '@/lib/types/customer-auth.types'

// ─── Mutation fn ──────────────────────────────────────────────
async function sendMagicLinkRequest(
    payload: SendMagicLinkRequest,
): Promise<MagicLinkApiResponse> {
    const { data } = await axiosApiClient.post<MagicLinkApiResponse>(
        '/auth/magic-link/send',
        payload,
    )
    return data
}

// ─────────────────────────────────────────────────────────────
// useSendMagicLink
//
// Provides a typed useMutation for the customer magic-link flow.
//
// The caller supplies { email } — redirectTo is built here from
// window.location.origin so it always matches the current domain
// (localhost in dev, production domain in prod).
//
// Usage:
//   const { mutate, isPending, isSuccess, isError } = useSendMagicLink()
//   mutate({ email: 'user@example.com' })
// ─────────────────────────────────────────────────────────────
export function useSendMagicLink() {
    return useMutation<MagicLinkApiResponse, Error, Pick<SendMagicLinkRequest, 'email'>>({
        mutationKey: ['customer', 'magic-link', 'send'],
        mutationFn: async ({ email }) => {
            // Build the redirectTo from the current origin so the controller's
            // open-redirect guard always passes (same-origin check).
            const redirectTo =
                typeof window !== 'undefined'
                    ? `${window.location.origin}/auth/callback`
                    : undefined

            return sendMagicLinkRequest({ email, redirectTo })
        },
        // No onSuccess cache invalidation needed — auth state is managed
        // by Supabase's onAuthStateChange in the header (untouched).
        retry: false, // Never silently retry auth mutations
    })
}
