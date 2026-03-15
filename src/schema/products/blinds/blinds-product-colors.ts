import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

import { blindsProducts } from "./blinds-product";
export const blindsProductColors = pgTable("blinds_product_colors", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").notNull().references(() => blindsProducts.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    imageUrl: varchar("image_url", { length: 500 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export type BlindsProductColor = typeof blindsProductColors.$inferSelect;
export type NewBlindsProductColor = typeof blindsProductColors.$inferInsert;