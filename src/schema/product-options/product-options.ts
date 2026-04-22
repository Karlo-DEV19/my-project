import { pgTable, uuid, varchar, timestamp, index, unique } from 'drizzle-orm/pg-core';

export const productOptions = pgTable(
  'product_options',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Discriminator: 'fabric-widths' | 'thickness' | 'characteristics' | etc. */
    type: varchar('type', { length: 100 }).notNull(),
    label: varchar('label', { length: 255 }).notNull(),
    value: varchar('value', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index('product_options_type_idx').on(table.type),
    typeValueUnique: unique('product_options_type_value_unique').on(table.type, table.value),
    typeLabelUnique: unique('product_options_type_label_unique').on(table.type, table.label),
  })
);

export type ProductOption = typeof productOptions.$inferSelect;
export type NewProductOption = typeof productOptions.$inferInsert;
