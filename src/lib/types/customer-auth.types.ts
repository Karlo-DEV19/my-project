// ─────────────────────────────────────────────────────────────
// Customer Auth — Shared Types
//
// Lightweight type definitions for the customer magic-link flow.
// Kept separate from admin auth types (lib/types/auth.ts) to
// maintain strict auth-domain isolation.
// ─────────────────────────────────────────────────────────────

// ─── Dialog step machine ──────────────────────────────────────
// 'form'  → email input screen
// 'sent'  → check-your-inbox confirmation screen
export type MagicLinkStep = 'form' | 'sent'

// ─── API request payload ──────────────────────────────────────
// Matches the Hono controller's validated body.
// redirectTo is set internally by the hook — not exposed in the UI.
export interface SendMagicLinkRequest {
    email: string
    redirectTo?: string
}

// ─── API response ─────────────────────────────────────────────
// Mirrors MagicLinkApiResponse from the backend Zod schema.
// Redeclared here so the client hook has no server-bundle imports.
export type MagicLinkApiResponse =
    | { success: true; message: string }
    | { success: false; message: string }
