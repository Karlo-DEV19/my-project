import type { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/supabase/db';
import { compositions } from '@/schema/compositions/compositions';

// ─── GET /api/v1/compositions ─────────────────────────────────────────────────

export async function getAllCompositions(c: Context): Promise<Response> {
  try {
    const rows = await db
      .select()
      .from(compositions)
      .orderBy(compositions.label);

    return c.json({ success: true, data: rows });
  } catch (err) {
    console.error('[getAllCompositions] unexpected error:', err);
    return c.json({ success: false, message: 'Failed to fetch compositions.' }, 500);
  }
}

// ─── POST /api/v1/compositions ────────────────────────────────────────────────

export async function createComposition(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const { label } = body as { label?: string };

    if (!label?.trim()) {
      return c.json({ success: false, message: 'Label is required.' }, 400);
    }

    const trimmedLabel = label.trim();
    // value = kebab-case of the label (mirrors combobox toKebabCase logic)
    const value = trimmedLabel
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const [inserted] = await db
      .insert(compositions)
      .values({ label: trimmedLabel, value })
      .onConflictDoNothing()
      .returning();

    if (!inserted) {
      // Already exists — return the existing row instead of erroring
      const existing = await db
        .select()
        .from(compositions)
        .where(eq(compositions.value, value))
        .limit(1);

      return c.json({ success: true, data: existing[0] }, 200);
    }

    return c.json({ success: true, data: inserted }, 201);
  } catch (err) {
    console.error('[createComposition] unexpected error:', err);
    return c.json({ success: false, message: 'Failed to create composition.' }, 500);
  }
}

// ─── DELETE /api/v1/compositions/:id ─────────────────────────────────────────

export async function deleteComposition(c: Context): Promise<Response> {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json({ success: false, message: 'ID is required.' }, 400);
    }

    const [deleted] = await db
      .delete(compositions)
      .where(eq(compositions.id, id))
      .returning();

    if (!deleted) {
      return c.json({ success: false, message: 'Composition not found.' }, 404);
    }

    return c.json({ success: true, message: 'Composition deleted.', data: deleted });
  } catch (err) {
    console.error('[deleteComposition] unexpected error:', err);
    return c.json({ success: false, message: 'Failed to delete composition.' }, 500);
  }
}
