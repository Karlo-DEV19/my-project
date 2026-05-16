// ─────────────────────────────────────────────────────────────
// syncUserWithDb
//
// Lightweight client-side helper that calls the existing
// POST /api/v1/users/sync endpoint after a successful
// Magic Link sign-in.
//
// Behaviour:
//   • Email exists in `users` table → updates last_login, returns row
//   • Email absent                  → inserts new row (UUID, name,
//                                     created_at, last_login), returns it
//
// Usage (inside a client component / callback page):
//   const result = await syncUserWithDb(email, name)
//   if (result.success) console.log('synced user:', result.data)
// ─────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────

/** Shape of the user row returned by the sync endpoint. */
export interface SyncedUser {
    id: string;
    name: string;
    email: string;
    created_at: string;
    last_login: string | null;
    login_count: number;
}

/** Discriminated-union response from syncUserWithDb. */
export type SyncUserResult =
    | { success: true;  data: SyncedUser; created: boolean }
    | { success: false; message: string };

// ─── Helper ───────────────────────────────────────────────────

/**
 * Upserts the signed-in customer in the `users` table.
 *
 * @param email - The user's email (from Supabase session).
 * @param name  - Optional display name from Supabase user_metadata.
 *                When omitted for a new user, the server derives a
 *                readable name from the email local-part.
 *
 * @returns SyncUserResult — always resolves, never throws.
 */
export async function syncUserWithDb(
    email: string,
    name?: string,
): Promise<SyncUserResult> {
    try {
        const payload: { email: string; name?: string } = { email };
        if (name?.trim()) payload.name = name.trim();

        const res = await fetch('/api/v1/users/sync', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
        });

        // Parse JSON regardless of HTTP status so we can surface the message.
        const json = await res.json() as
            | { success: true;  data: SyncedUser; created: boolean }
            | { success: false; message: string };

        return json;

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[syncUserWithDb] network error:', message);
        return { success: false, message };
    }
}
