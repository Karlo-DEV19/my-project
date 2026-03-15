import { relations } from "drizzle-orm";
import { blindsProducts } from "./blinds-product";
import { blindsProductColors } from "./blinds-product-colors";
import { blindsProductImages } from "./blinds-product-image";

export const blindsProductsRelations = relations(blindsProducts, ({ many }) => ({
    images: many(blindsProductImages),
    colors: many(blindsProductColors),
}));

export const blindsProductImagesRelations = relations(blindsProductImages, ({ one }) => ({
    product: one(blindsProducts, {
        fields: [blindsProductImages.productId],
        references: [blindsProducts.id],
    }),
}));

export const blindsProductColorsRelations = relations(blindsProductColors, ({ one }) => ({
    product: one(blindsProducts, {
        fields: [blindsProductColors.productId],
        references: [blindsProducts.id],
    }),
}));