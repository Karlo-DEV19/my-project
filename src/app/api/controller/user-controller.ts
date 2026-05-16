import type { Context } from 'hono';
import { supabaseAdmin } from '@/lib/supabase/db';
import {
  adminAccountSchema,
  getUsersQuerySchema,
  syncUserSchema,
} from '@/lib/validations/admin-account.schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRow = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  last_login: string | null;
  login_count: number;
};

// ─── GET /api/v1/users ────────────────────────────────────────────────────────

export async function getAllUsers(c: Context): Promise<Response> {
  try {
    const parsed = getUsersQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json(
        { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid query params.' },
        400
      );
    }

    const search = parsed.data.search?.trim() ?? '';
    const month = parsed.data.month ?? 'all';
    const page = parsed.data.page ?? 1;
    const limit = parsed.data.limit ?? 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, created_at, login_count', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (month !== 'all') {
      const now = new Date();
      let start: Date;
      let end: Date;

      if (month === 'this_month') {
        start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      } else {
        start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
        end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      }

      query = query
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString());
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('[getAllUsers]', error.message);
      return c.json({ success: false, message: error.message }, 500);
    }

    const total = count ?? 0;

    return c.json({
      success: true,
      data: data ?? [],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error('[getAllUsers] unexpected error:', err);
    return c.json({ success: false, message: 'Failed to fetch users.' }, 500);
  }
}

// ─── POST /api/v1/users ───────────────────────────────────────────────────────

export async function createUser(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();

    const parsed = adminAccountSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid input.' },
        400
      );
    }

    const { name, email } = parsed.data;

    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert([{ name, email }])
      .select('id, name, email, created_at')
      .single();

    if (error) {
      console.error('[createUser]', error.message);
      return c.json({ success: false, message: error.message }, 500);
    }

    return c.json({ success: true, data: newUser }, 201);
  } catch (err) {
    console.error('[createUser] unexpected error:', err);
    return c.json({ success: false, message: 'Failed to create user.' }, 500);
  }
}

// ─── DELETE /api/v1/users/:id ─────────────────────────────────────────────────

export async function deleteUser(c: Context): Promise<Response> {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json({ success: false, message: 'User ID is required.' }, 400);
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[deleteUser]', error.message);
      return c.json({ success: false, message: error.message }, 500);
    }

    return c.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error('[deleteUser] unexpected error:', err);
    return c.json({ success: false, message: 'Failed to delete user.' }, 500);
  }
}

// ─── PATCH /api/v1/users/profile ─────────────────────────────────────────────

export async function updateUserProfile(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const { email, name } = body as { email?: string; name?: string };

    if (!email || !name) {
      return c.json({ success: false, message: 'Email and name are required.' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      return c.json({ success: false, message: 'Name cannot be empty.' }, 400);
    }

    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update({ name: trimmedName })
      .eq('email', normalizedEmail)
      .select('id, name, email, created_at, login_count')
      .single();

    if (error) {
      console.error('[updateUserProfile]', error.message);
      return c.json({ success: false, message: error.message }, 500);
    }

    if (!updated) {
      return c.json({ success: false, message: 'User not found.' }, 404);
    }

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('[updateUserProfile] unexpected error:', err);
    return c.json({ success: false, message: 'Failed to update profile.' }, 500);
  }
}

// ─── POST /api/v1/users/sync ──────────────────────────────────────────────────
// Called by the frontend after Magic Link login.
//
// Logic:
//   • Email found → update ONLY last_login (preserves id, name, created_at).
//   • Email absent → insert new row using the Supabase auth id as PK.
//
// NOTE: We intentionally use a 2-step select→update/insert rather than a
// bare upsert because Supabase's upsert includes every payload key in the
// DO UPDATE SET clause — which would overwrite the existing row's `id` and
// `created_at` on conflict.  The 2-step guarantees we never mutate those.

export async function syncUser(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();

    const parsed = syncUserSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid input.' },
        400
      );
    }

    const email        = parsed.data.email.trim().toLowerCase();
    const providedName = parsed.data.name?.trim();
    const authId       = parsed.data.id?.trim();   // Supabase auth user UUID (optional)
    const now          = new Date().toISOString();

    // ── 1. Look up by email ──────────────────────────────────────────────────
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, created_at, last_login, login_count')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      console.error('[syncUser] fetch error:', fetchError.message);
      return c.json({ success: false, message: fetchError.message }, 500);
    }

    if (existing) {
      // ── 2a. Existing row: stamp last_login + increment login_count
      //    login_count was fetched in the SELECT above — no extra query needed.
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          last_login:  now,
          login_count: (existing.login_count ?? 0) + 1,
        })
        .eq('id', existing.id)           // match by id, not email, for precision
        .select('id, name, email, created_at, last_login, login_count')
        .single();

      if (updateError) {
        console.error('[syncUser] update error:', updateError.message);
        return c.json({ success: false, message: updateError.message }, 500);
      }

      return c.json({ success: true, data: updated, created: false }, 200);
    }

    // ── 2b. New user: insert with auth id (or random fallback) ───────────────
    // Derive a readable name from the email local-part when none is provided
    // (e.g. "jane.doe@example.com" → "Jane Doe").
    const fallbackName = email
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([{
        id:          authId ?? crypto.randomUUID(),
        email,
        name:        providedName || fallbackName,
        created_at:  now,
        last_login:  now,
        login_count: 1,
      }])
      .select('id, name, email, created_at, last_login, login_count')
      .single();

    if (insertError) {
      console.error('[syncUser] insert error:', insertError.message);
      return c.json({ success: false, message: insertError.message }, 500);
    }

    return c.json({ success: true, data: newUser, created: true }, 201);

  } catch (err) {
    console.error('[syncUser] unexpected error:', err);
    return c.json({ success: false, message: 'Failed to sync user.' }, 500);
  }
}