import { pgTable, uuid, varchar, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const blindsProducts = pgTable(
    "blinds_products",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        productCode: varchar("product_code", { length: 120 }).notNull(),
        name: varchar("name", { length: 255 }).notNull(),
        description: text("description"),
        type: varchar("type", { length: 100 }),
        characteristic: varchar("characteristic", { length: 150 }),
        composition: varchar("composition", { length: 150 }),
        fabricWidth: varchar("fabric_width", { length: 50 }),
        packing: varchar("packing", { length: 50 }),
        thickness: varchar("thickness", { length: 50 }),
        status: varchar("status", { length: 50 }).default("active").notNull(),
        unitPrice: integer("unit_price").notNull(),
        collection: varchar("collection", { length: 50 }).default("Shop Only").notNull(),
        createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
    },
    (table) => ({
        productCodeUnique: uniqueIndex("blinds_products_product_code_unique").on(table.productCode),
    })
);

export type BlindsProduct = typeof blindsProducts.$inferSelect;
export type NewBlindsProduct = typeof blindsProducts.$inferInsert;