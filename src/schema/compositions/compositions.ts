import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const compositions = pgTable('compositions', {
  id: uuid('id').defaultRandom().primaryKey(),
  label: varchar('label', { length: 255 }).notNull().unique(),
  value: varchar('value', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export type Composition = typeof compositions.$inferSelect;
export type NewComposition = typeof compositions.$inferInsert;
