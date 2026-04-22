import type { Context } from 'hono';
import { and, eq, gt } from 'drizzle-orm';
import { supabaseAdmin, db } from '@/lib/supabase/db';
import { otpCodes } from '@/schema/otp/otp-code';
import { sendOtpEmail } from '@/app/api/services/nodemailer/send-otp-code-service';
import {
  adminAccountSchema,
  getUsersQuerySchema,
} from '@/lib/validations/admin-account.schema';

// ─── OTP Helper ───────────────────────────────────────────────────────────────
// Now supports role-based email content

async function issueOtp(
  email: string,
  role: "admin" | "customer"
): Promise<{ success: true } | { success: false; error: string }> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db
    .update(otpCodes)
    .set({ isUsed: true })
    .where(and(eq(otpCodes.email, email), eq(otpCodes.isUsed, false)));

  await db.insert(otpCodes).values({ email, code, expiresAt, isUsed: false });

  // ✅ PASS ROLE HERE
  const emailResult = await sendOtpEmail(email, code, role);

  if (!emailResult.success) {
    return { success: false, error: 'Failed to send verification code. Please try again.' };
  }

  return { success: true };
}

// ─── syncUserProfile ──────────────────────────────────────────────────────────

async function syncUserProfile(email: string, name?: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('users')
    .upsert(
      { email, name: name?.trim() || email },
      { onConflict: 'email', ignoreDuplicates: true }
    );

  if (error) {
    console.warn('[syncUserProfile] upsert warning:', error.message);
  }
}

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
      .select('id, name, email, created_at', { count: 'exact' })
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

// ─── POST /api/v1/users/signup ────────────────────────────────────────────────

export async function signupUser(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const { name, email } = body as { name?: string; email?: string };

    if (!name || !email) {
      return c.json({ success: false, message: 'Name and email are required.' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      return c.json({ success: false, message: 'An account with this email already exists.' }, 409);
    }

    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert([{ name: name.trim(), email: normalizedEmail }])
      .select('id, name, email')
      .single();

    if (error) {
      console.error('[signupUser]', error.message);
      return c.json({ success: false, message: error.message }, 500);
    }

    // ✅ CUSTOMER ROLE
    const otpResult = await issueOtp(newUser.email, "customer");

    if (!otpResult.success) {
      return c.json(
        { success: false, message: 'Account created but verification email failed. Please try signing in to resend.' },
        500
      );
    }

    return c.json({ success: true, status: 'OTP_REQUIRED', email: newUser.email }, 201);
  } catch (err) {
    console.error('[signupUser] unexpected error:', err);
    return c.json({ success: false, message: 'Failed to create account.' }, 500);
  }
}

// ─── POST /api/v1/users/login ─────────────────────────────────────────────────

export async function loginUser(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const { email } = body as { email?: string };

    if (!email) {
      return c.json({ success: false, message: 'Email is required.' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('email', normalizedEmail)
      .single();

    if (error || !user) {
      return c.json({ success: false, message: 'No account found with that email address.' }, 404);
    }

    // ✅ CUSTOMER ROLE
    const otpResult = await issueOtp(user.email, "customer");

    if (!otpResult.success) {
      return c.json({ success: false, message: otpResult.error }, 500);
    }

    return c.json({ success: true, status: 'OTP_REQUIRED', email: user.email });
  } catch (err) {
    console.error('[loginUser] unexpected error:', err);
    return c.json({ success: false, message: 'Login failed.' }, 500);
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

// ─── POST /api/v1/users/verify-otp ───────────────────────────────────────────

export async function verifyUserOtp(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const { email, code } = body as { email?: string; code?: string };

    if (!email || !code) {
      return c.json({ success: false, message: 'Email and code are required.' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();

    const record = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, normalizedEmail),
          eq(otpCodes.code, code.trim()),
          eq(otpCodes.isUsed, false),
          gt(otpCodes.expiresAt, now)
        )
      )
      .limit(1);

    if (!record.length) {
      return c.json({ success: false, message: 'Invalid or expired verification code.' }, 400);
    }

    // Mark OTP as used
    await db
      .update(otpCodes)
      .set({ isUsed: true })
      .where(eq(otpCodes.id, record[0].id));

    // Fetch the user record to return
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, created_at')
      .eq('email', normalizedEmail)
      .single();

    if (error || !user) {
      return c.json({ success: false, message: 'User not found.' }, 404);
    }

    return c.json({ success: true, data: user });
  } catch (err) {
    console.error('[verifyUserOtp] unexpected error:', err);
    return c.json({ success: false, message: 'OTP verification failed.' }, 500);
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
      .select('id, name, email, created_at')
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