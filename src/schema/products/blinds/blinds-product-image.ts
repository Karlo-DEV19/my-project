import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

import { blindsProducts } from "./blinds-product";
export const blindsProductImages = pgTable("blinds_product_images", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").notNull().references(() => blindsProducts.id, { onDelete: "cascade" }),
    imageUrl: varchar("image_url", { length: 500 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export type BlindsProductImage = typeof blindsProductImages.$inferSelect;
export type NewBlindsProductImage = typeof blindsProductImages.$inferInsert;    