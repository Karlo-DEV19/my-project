// src/app/api/controller/product-blinds-controller.ts
import {
    blindsProductSchema,
    BlindsProductValues,
} from "@/app/api/zod/product-blinds-zod-schema";
import { ActivityAction, ActivityActionType, ActivityModule, ActivityModuleType } from "@/lib/constans/activity-log";
import { db } from "@/lib/supabase/db";
import { blindsProducts } from "@/schema/products/blinds/blinds-product";
import { blindsProductColors } from "@/schema/products/blinds/blinds-product-colors";
import { blindsProductImages } from "@/schema/products/blinds/blinds-product-image";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { Context } from "hono";
import { z } from "zod";
import { createActivityLog } from "./activity-logs";
import { NotificationsService } from "@/app/api/services/notification-service/notifications.service";

export const updateBlindsById = async (ctx: Context) => {
    try {
        const productId = ctx.req.param("productId");

        if (!productId) {
            return ctx.json({ success: false, message: "Missing product ID" }, 400);
        }

        const updateBlindsSchema = z.object({
            userId: z.string().min(1).trim(),
            productCode: z.string().min(1).trim(),
            name: z.string().min(1).trim(),
            description: z.string().trim().default(""),
            type: z.string().trim().default(""),
            collection: z.enum(["Shop Only", "New Arrival", "Best Seller"]),
            status: z.enum(["active", "inactive", "archived"]),
            composition: z.string().trim().default(""),
            fabricWidth: z.string().trim().default(""),
            thickness: z.string().trim().default(""),
            packing: z.string().trim().default(""),
            characteristic: z.string().trim().default(""),
            unitPrice: z.number().min(0),
            mainImages: z
                .array(z.string().min(1))
                .default([]),
            availableColors: z
                .array(z.object({
                    name: z.string().min(1).trim(),
                    imageUrl: z.string().min(1),
                }))
                .default([]),
        });

        const body = await ctx.req.json();
        const parsed = updateBlindsSchema.safeParse(body);

        if (!parsed.success) {
            return ctx.json({
                success: false,
                message: "Invalid request payload",
                errors: parsed.error.flatten().fieldErrors,
            }, 400);
        }

        const {
            productCode, name, description, type,
            collection, status, composition, fabricWidth,
            thickness, packing, characteristic, unitPrice,
            mainImages, availableColors,
        } = parsed.data;

        const [existing] = await db
            .select({ id: blindsProducts.id, productCode: blindsProducts.productCode })
            .from(blindsProducts)
            .where(eq(blindsProducts.id, productId))
            .limit(1);

        if (!existing) {
            return ctx.json({ success: false, message: "Product not found" }, 404);
        }

        if (productCode !== existing.productCode) {
            const [duplicate] = await db
                .select({ id: blindsProducts.id })
                .from(blindsProducts)
                .where(eq(blindsProducts.productCode, productCode))
                .limit(1);

            if (duplicate) {
                return ctx.json({ success: false, message: "Product code already in use" }, 400);
            }
        }

        const normalizedImages = mainImages
            .map((url) => url.trim())
            .filter(Boolean);

        const normalizedColors = availableColors
            .map((c) => ({ name: c.name.trim(), imageUrl: c.imageUrl.trim() }))
            .filter((c) => c.name && c.imageUrl);

        const updatedProduct = await db.transaction(async (tx) => {
            const [product] = await tx
                .update(blindsProducts)
                .set({
                    productCode, name, description, type,
                    collection, status, composition, fabricWidth,
                    thickness, packing, characteristic, unitPrice,
                    updatedAt: new Date(),
                })
                .where(eq(blindsProducts.id, productId))
                .returning();

            await tx
                .delete(blindsProductImages)
                .where(eq(blindsProductImages.productId, productId));

            const insertedImages =
                normalizedImages.length > 0
                    ? await tx
                        .insert(blindsProductImages)
                        .values(
                            normalizedImages.map((imageUrl) => ({ productId, imageUrl }))
                        )
                        .returning()
                    : [];

            await tx
                .delete(blindsProductColors)
                .where(eq(blindsProductColors.productId, productId));

            const insertedColors =
                normalizedColors.length > 0
                    ? await tx
                        .insert(blindsProductColors)
                        .values(
                            normalizedColors.map((c) => ({
                                productId,
                                name: c.name,
                                imageUrl: c.imageUrl,
                            }))
                        )
                        .returning()
                    : [];

            return { ...product, images: insertedImages, colors: insertedColors };
        });

        await createActivityLog(db, {
            userId: parsed.data.userId,
            action: "UPDATE" as ActivityActionType,
            module: "BLINDS_PRODUCT" as ActivityModuleType,
            referenceId: productId,
            description: `Updated product ${productCode}`,
        });

        return ctx.json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct,
        });

    } catch (error) {
        console.error("[updateBlindsById]", error);
        return ctx.json({ success: false, message: "Internal server error" }, 500);
    }
};

export const createNewBlinds = async (ctx: Context) => {
    try {
        const body = await ctx.req.json();

        const parsedData: BlindsProductValues = blindsProductSchema.parse(body);

        const existing = await db
            .select()
            .from(blindsProducts)
            .where(
                or(
                    eq(blindsProducts.productCode, parsedData.productCode),
                    eq(blindsProducts.name, parsedData.name)
                )
            );

        if (existing.length > 0) {
            const duplicateFields = [];
            if (existing.some((p) => p.productCode === parsedData.productCode))
                duplicateFields.push("productCode");
            if (existing.some((p) => p.name === parsedData.name))
                duplicateFields.push("name");

            throw new z.ZodError(
                duplicateFields.map((f) => ({
                    path: [f],
                    message: `${f} already exists`,
                    code: "custom",
                }))
            );
        }

        const [insertedProduct] = await db
            .insert(blindsProducts)
            .values({
                productCode: parsedData.productCode,
                name: parsedData.name,
                type: parsedData.type,
                description: parsedData.description,
                unitPrice: parsedData.unitPrice,
                composition: parsedData.composition,
                fabricWidth: parsedData.fabricWidth,
                thickness: parsedData.thickness,
                packing: parsedData.packing,
                characteristic: parsedData.characteristic,
                collection: parsedData.collection,
                stock: parsedData.stock ?? 0,
            })
            .returning();

        const productId = insertedProduct.id;

        if (parsedData.mainImages.length > 0) {
            await db.insert(blindsProductImages).values(
                parsedData.mainImages.map((url) => ({
                    productId,
                    imageUrl: url,
                }))
            );
        }

        if (parsedData.availableColors.length > 0) {
            await db.insert(blindsProductColors).values(
                parsedData.availableColors.map((color) => ({
                    productId,
                    name: color.name,
                    imageUrl: color.imageUrl,
                }))
            );
        }

        if (parsedData.userId) {
            await createActivityLog(db, {
                userId: parsedData.userId,
                action: ActivityAction.CREATE,
                module: ActivityModule.BLINDS_PRODUCT,
                referenceId: insertedProduct.id,
                description: `Created blinds product: ${parsedData.name} (${parsedData.productCode})`,
            });
        }

        // ── Notification: New Arrival global broadcast ───────────────────────────
        // Intentionally ONLY on create — update/reactivation should NOT re-notify.
        // userId = null → shown to every logged-in customer.
        if (parsedData.collection === "New Arrival") {
            try {
                await NotificationsService.createNotification({
                    userId: null,
                    title: "New Arrival",
                    message: `${parsedData.name} just landed in our New Arrivals collection!`,
                    type: "NEW_ARRIVAL",
                    targetRole: "customer",
                });
            } catch (notifErr) {
                console.error("⚠️ Failed to create New Arrival notification:", notifErr);
            }
        }

        return ctx.json({ success: true, product: insertedProduct });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return ctx.json({ success: false, errors: error.format() }, 400);
        }
        console.error("Failed to create blinds product:", error);
        return ctx.json(
            { success: false, message: "Failed to create new blinds product." },
            500
        );
    }
};

export const getAllBlinds = async (c: Context) => {
    try {
        const page = Number(c.req.query("page") ?? 1);
        const limit = Number(c.req.query("limit") ?? 10);
        const search = c.req.query("search")?.toString() ?? "";
        const statusFilter = c.req.query("status")?.toString();
        const sortBy = c.req.query("sortBy")?.toString() ?? "createdAt";
        const sortOrder = c.req.query("sortOrder")?.toLowerCase() === "asc" ? "asc" : "desc";

        const offset = (page - 1) * limit;

        const filters = [];
        if (statusFilter) {
            filters.push(eq(blindsProducts.status, statusFilter));
        }
        if (search) {
            filters.push(
                or(
                    ilike(blindsProducts.name, `%${search}%`),
                    ilike(blindsProducts.productCode, `%${search}%`)
                )
            );
        }

        const whereCondition = filters.length > 0 ? and(...filters) : undefined;

        const [totalResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(blindsProducts)
            .where(whereCondition);

        const total = Number(totalResult?.count ?? 0);
        const totalPages = Math.ceil(total / limit);

        const validSortColumns = ["name", "productCode", "createdAt", "unitPrice", "status"] as const;
        type SortableColumn = (typeof validSortColumns)[number];

        const safeSortBy = validSortColumns.includes(sortBy as SortableColumn)
            ? (sortBy as SortableColumn)
            : "createdAt";

        const blinds = await db.query.blindsProducts.findMany({
            where: whereCondition,
            // ✅ FIXED: Tanggal ang false values, explicit true lang lahat
            columns: {
                id: true,
                productCode: true,
                name: true,
                type: true,
                composition: true,
                fabricWidth: true,
                packing: true,
                thickness: true,
                status: true,
                unitPrice: true,
                stock: true,       // ✅ stock included
                collection: true,
                createdAt: true,
            },
            with: {
                colors: {
                    columns: {
                        name: true,
                        imageUrl: true
                    }
                },
                images: {
                    limit: 1,
                    columns: {
                        imageUrl: true
                    }
                }
            },
            orderBy: (fields, { asc, desc }) => [
                sortOrder === "asc" ? asc(fields[safeSortBy]) : desc(fields[safeSortBy])
            ],
            limit,
            offset,
        });

        return c.json({
            success: true,
            blinds,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            filters: {
                search,
                status: statusFilter ?? null,
                sortBy: safeSortBy,
                sortOrder,
            }
        });

    } catch (error) {
        console.error("Failed to get blinds products:", error);
        return c.json(
            { success: false, message: "Failed to fetch inventory data." },
            500
        );
    }
};
export const getDetailsBlindByProductId = async (ctx: Context) => {
    try {
        const productId = ctx.req.param("productId");

        if (!productId || productId.trim() === "" || productId === "undefined" || productId === "null") {
            return ctx.json({
                success: false,
                message: "A valid Product ID is required."
            }, 400);
        }

        const product = await db.query.blindsProducts.findFirst({
            where: eq(blindsProducts.id, productId),
            with: {
                images: true,
                colors: true,
            },
        });

        if (!product) {
            return ctx.json({
                success: false,
                message: `Product with ID "${productId}" not found.`
            }, 404);
        }

        return ctx.json({
            success: true,
            data: product,
        }, 200);

    } catch (error: any) {
        console.error("[GET_BLINDS_DETAILS_ERROR]:", error);

        if (error.message?.includes("invalid input syntax for type uuid")) {
            return ctx.json({
                success: false,
                message: "Invalid Product ID format."
            }, 400);
        }

        return ctx.json({
            success: false,
            message: "Internal server error occurred while fetching product details."
        }, 500);
    }
};

export const getAllBestSeller = async (c: Context) => {
    try {
        const page = Number(c.req.query("page") ?? 1);
        const limit = Number(c.req.query("limit") ?? 10);
        const offset = (page - 1) * limit;

        const whereCondition = and(
            eq(blindsProducts.status, "active"),
            eq(blindsProducts.collection, "Best Seller")
        );

        const [totalResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(blindsProducts)
            .where(whereCondition);

        const total = Number(totalResult?.count ?? 0);
        const totalPages = Math.ceil(total / limit);

        const blinds = await db.query.blindsProducts.findMany({
            where: whereCondition,
            columns: {
                id: true,
                productCode: true,
                name: true,
                type: true,
                composition: true,
                fabricWidth: true,
                packing: true,
                thickness: true,
                status: true,
                unitPrice: true,
                collection: true,
                createdAt: true,
            },
            with: {
                colors: { columns: { name: true, imageUrl: true } },
                images: { limit: 1, columns: { imageUrl: true } }
            },
            orderBy: (fields, { desc }) => [desc(fields.createdAt)],
            limit,
            offset,
        });

        return c.json({
            success: true,
            blinds,
            pagination: {
                page, limit, total, totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            }
        });
    } catch (error) {
        console.error("Failed to get best sellers:", error);
        return c.json({ success: false, message: "Failed to fetch top seller products." }, 500);
    }
};

export const getAllNewArrival = async (c: Context) => {
    try {
        const page = Number(c.req.query("page") ?? 1);
        const limit = Number(c.req.query("limit") ?? 10);
        const offset = (page - 1) * limit;

        const whereCondition = and(
            eq(blindsProducts.status, "active"),
            eq(blindsProducts.collection, "New Arrival")
        );

        const [totalResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(blindsProducts)
            .where(whereCondition);

        const total = Number(totalResult?.count ?? 0);
        const totalPages = Math.ceil(total / limit);

        const blinds = await db.query.blindsProducts.findMany({
            where: whereCondition,
            columns: {
                id: true,
                productCode: true,
                name: true,
                type: true,
                composition: true,
                fabricWidth: true,
                packing: true,
                thickness: true,
                status: true,
                unitPrice: true,
                collection: true,
                createdAt: true,
            },
            with: {
                colors: { columns: { name: true, imageUrl: true } },
                images: { limit: 1, columns: { imageUrl: true } }
            },
            orderBy: (fields, { desc }) => [desc(fields.createdAt)],
            limit,
            offset,
        });

        return c.json({
            success: true,
            blinds,
            pagination: {
                page, limit, total, totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            }
        });
    } catch (error) {
        console.error("Failed to get new arrivals:", error);
        return c.json({ success: false, message: "Failed to fetch new arrival products." }, 500);
    }
};

// ✅ NEW — Update stock only (for Inventory Management)
export const updateBlindStock = async (ctx: Context) => {
    try {
        const productId = ctx.req.param("productId");

        if (!productId) {
            return ctx.json({ success: false, message: "Missing product ID" }, 400);
        }

        const body = await ctx.req.json();
        const { stock } = body;

        if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) {
            return ctx.json({ success: false, message: "Invalid stock value" }, 400);
        }

        const [existing] = await db
            .select({ id: blindsProducts.id })
            .from(blindsProducts)
            .where(eq(blindsProducts.id, productId))
            .limit(1);

        if (!existing) {
            return ctx.json({ success: false, message: "Product not found" }, 404);
        }

        await db
            .update(blindsProducts)
            .set({ stock, updatedAt: new Date() })
            .where(eq(blindsProducts.id, productId));

        return ctx.json({ success: true, message: "Stock updated successfully" });

    } catch (error) {
        console.error("[updateBlindStock]", error);
        return ctx.json({ success: false, message: "Internal server error" }, 500);
    }
};

export const deleteBlindsById = async (ctx: Context) => {
    try {
        const productId = ctx.req.param("productId");

        if (!productId) {
            return ctx.json({ success: false, message: "Missing product ID" }, 400);
        }

        const [existing] = await db
            .select({ id: blindsProducts.id, productCode: blindsProducts.productCode, name: blindsProducts.name })
            .from(blindsProducts)
            .where(eq(blindsProducts.id, productId))
            .limit(1);

        if (!existing) {
            return ctx.json({ success: false, message: "Product not found" }, 404);
        }

        await db.transaction(async (tx) => {
            await tx
                .delete(blindsProductImages)
                .where(eq(blindsProductImages.productId, productId));

            await tx
                .delete(blindsProductColors)
                .where(eq(blindsProductColors.productId, productId));

            await tx
                .delete(blindsProducts)
                .where(eq(blindsProducts.id, productId));
        });

        // Optional activity log — userId passed as query param from the client.
        // Silently skipped if missing; deletion must never fail because of logging.
        const userId = ctx.req.query("userId");
        if (userId) {
            await createActivityLog(db, {
                userId,
                action: "DELETE" as ActivityActionType,
                module: "BLINDS_PRODUCT" as ActivityModuleType,
                referenceId: productId,
                description: `Deleted product: ${existing.name} (${existing.productCode})`,
            });
        }

        return ctx.json({
            success: true,
            message: "Product deleted successfully",
        });

    } catch (error) {
        console.error("[deleteBlindsById]", error);
        return ctx.json({ success: false, message: "Internal server error" }, 500);
    }
};