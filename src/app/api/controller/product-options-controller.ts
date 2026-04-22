import type { Context } from 'hono';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/supabase/db';
import { productOptions } from '@/schema/product-options/product-options';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toKebabCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─── Factory ─────────────────────────────────────────────────────────────────
// Returns a plain object of Hono handlers bound to a specific option type.
// Mount these handlers in a Hono route to get full CRUD for that type.

export function createProductOptionsHandlers(type: string) {
  // ── GET /api/v1/{type} ────────────────────────────────────────────────────
  async function getAll(c: Context): Promise<Response> {
    try {
      const rows = await db
        .select()
        .from(productOptions)
        .where(eq(productOptions.type, type))
        .orderBy(productOptions.label);

      return c.json({ success: true, data: rows });
    } catch (err) {
      console.error(`[getAll:${type}]`, err);
      return c.json({ success: false, message: `Failed to fetch ${type}.` }, 500);
    }
  }

  // ── POST /api/v1/{type} ───────────────────────────────────────────────────
  async function create(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const { label } = body as { label?: string };

      if (!label?.trim()) {
        return c.json({ success: false, message: 'Label is required.' }, 400);
      }

      const trimmedLabel = label.trim();
      const value = toKebabCase(trimmedLabel);

      const [inserted] = await db
        .insert(productOptions)
        .values({ type, label: trimmedLabel, value })
        .onConflictDoNothing()
        .returning();

      if (!inserted) {
        // Already exists — return the existing row
        const existing = await db
          .select()
          .from(productOptions)
          .where(and(eq(productOptions.type, type), eq(productOptions.value, value)))
          .limit(1);

        return c.json({ success: true, data: existing[0] }, 200);
      }

      return c.json({ success: true, data: inserted }, 201);
    } catch (err) {
      console.error(`[create:${type}]`, err);
      return c.json({ success: false, message: `Failed to create ${type} option.` }, 500);
    }
  }

  // ── DELETE /api/v1/{type}/:id ─────────────────────────────────────────────
  async function remove(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id) {
        return c.json({ success: false, message: 'ID is required.' }, 400);
      }

      const [deleted] = await db
        .delete(productOptions)
        .where(and(eq(productOptions.id, id), eq(productOptions.type, type)))
        .returning();

      if (!deleted) {
        return c.json({ success: false, message: 'Option not found.' }, 404);
      }

      return c.json({ success: true, message: 'Option deleted.', data: deleted });
    } catch (err) {
      console.error(`[delete:${type}]`, err);
      return c.json({ success: false, message: `Failed to delete ${type} option.` }, 500);
    }
  }

  return { getAll, create, remove };
}
