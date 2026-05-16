// ─────────────────────────────────────────────────────────────
// Magic Link Route
//
// Mounts the customer magic-link auth endpoints.
// Route handlers are thin — all logic lives in the controller.
//
// Mounted at: /api/v1/auth/magic-link
// ─────────────────────────────────────────────────────────────

import { Hono } from 'hono'
import { sendMagicLink } from '../../controller/magic-link-controller'

const magicLinkRoute = new Hono()

// ── Customer magic link ────────────────────────────────────────
// POST /api/v1/auth/magic-link/send
// Body: { email: string; redirectTo?: string }
magicLinkRoute.post('/send', sendMagicLink)

export default magicLinkRoute
