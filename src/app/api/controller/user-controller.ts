import type { Context } from 'hono';
import { supabaseAdmin } from '@/lib/supabase/db';
import {
  adminAccountSchema,
  getUsersQuerySchema,
} from '@/lib/validations/admin-account.schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRow = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

// ─── GET /api/v1/users ────────────────────────────────────────────────────────

export async function getAllUsers(c: Context): Promise<Response> {
  try {
    // ── Validate query params ──────────────────────────────────────────────────
    const parsed = getUsersQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json(
        { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid query params.' },
        400
      );
    }

    const search = parsed.data.search?.trim() ?? '';
    const month  = parsed.data.month ?? 'all';
    const page   = parsed.data.page  ?? 1;
    const limit  = parsed.data.limit ?? 10;
    const from   = (page - 1) * limit;
    const to     = from + limit - 1;

    // ── Build query ───────────────────────────────────────────────────────────
    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Case-insensitive search across name and email.
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Month filter — derive UTC date range boundaries and apply to created_at.
    if (month !== 'all') {
      const now = new Date();
      let start: Date;
      let end: Date;

      if (month === 'this_month') {
        start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        end   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      } else {
        // last_month
        start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
        end   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      }

      query = query
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString());
    }

    // Paginate using Supabase range (inclusive on both ends).
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

    return c.json({ success: true });
  } catch (err) {
    console.error('[deleteUser] unexpected error:', err);
    return c.json({ success: false, message: 'Failed to delete user.' }, 500);
  }
}

// ─── POST /api/v1/users/signup ────────────────────────────────────────────────
// Customer-facing signup — inserts into the public users table.

export async function signupUser(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const { name, email } = body as { name?: string; email?: string };

    if (!name || !email) {
      return c.json({ success: false, message: 'Name and email are required.' }, 400);
    }

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (existing) {
      return c.json({ success: false, message: 'An account with this email already exists.' }, 409);
    }

    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert([{ name: name.trim(), email: email.trim().toLowerCase() }])
      .select('id, name, email')
      .single();

    if (error) {
      console.error('[signupUser]', error.message);
      return c.json({ success: false, message: error.message }, 500);
    }

    return c.json({ success: true, data: newUser }, 201);
  } catch (err) {
    console.error('[signupUser] unexpected error:', err);
    return c.json({ success: false, message: 'Failed to create account.' }, 500);
  }
}

// ─── POST /api/v1/users/login ─────────────────────────────────────────────────
// Customer-facing login — looks up user by email in the public users table.

export async function loginUser(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const { email } = body as { email?: string };

    if (!email) {
      return c.json({ success: false, message: 'Email is required.' }, 400);
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !user) {
      return c.json({ success: false, message: 'No account found with that email address.' }, 404);
    }

    return c.json({ success: true, data: user });
  } catch (err) {
    console.error('[loginUser] unexpected error:', err);
    return c.json({ success: false, message: 'Login failed.' }, 500);
  }
}