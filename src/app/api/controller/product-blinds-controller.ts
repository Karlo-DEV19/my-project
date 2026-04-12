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
import { and, eq, ilike, or, sql } from "drizzle-orm"; // <- use these for conditions
import { Context } from "hono";
import { z } from "zod";
import { createActivityLog } from "./activity-logs";

// src/app/api/controller/product-blinds-controller.ts

export const updateBlindsById = async (ctx: Context) => {
    try {
        // ✅ Match whatever your Hono route declares, e.g. .put("/:productId/update", ...)
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
            // ✅ Accept any non-empty string — URLs from Supabase are valid strings
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

        // Check product exists
        const [existing] = await db
            .select({ id: blindsProducts.id, productCode: blindsProducts.productCode })
            .from(blindsProducts)
            .where(eq(blindsProducts.id, productId))
            .limit(1);

        if (!existing) {
            return ctx.json({ success: false, message: "Product not found" }, 404);
        }

        // Duplicate productCode guard
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

        // Normalize — strip whitespace, drop empty strings
        const normalizedImages = mainImages
            .map((url) => url.trim())
            .filter(Boolean);

        const normalizedColors = availableColors
            .map((c) => ({ name: c.name.trim(), imageUrl: c.imageUrl.trim() }))
            .filter((c) => c.name && c.imageUrl);

        // ✅ Full replace inside a single transaction
        const updatedProduct = await db.transaction(async (tx) => {

            // 1. Update product row
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

            // 2. Wipe old images → insert exactly what client sent
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

            // 3. Wipe old colors → insert exactly what client sent
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

        // 1️⃣ Validate input
        const parsedData: BlindsProductValues = blindsProductSchema.parse(body);

        // 2️⃣ Check for duplicate productCode or name
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
            if (
                existing.some((p) => p.productCode === parsedData.productCode)
            )
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

        // 3️⃣ Insert product
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
                collection: parsedData.collection, // ✅ added field
            })
            .returning();

        const productId = insertedProduct.id;

        // 4️⃣ Insert main images
        if (parsedData.mainImages.length > 0) {
            await db.insert(blindsProductImages).values(
                parsedData.mainImages.map((url) => ({
                    productId,
                    imageUrl: url,
                }))
            );
        }

        // 5️⃣ Insert available colors
        if (parsedData.availableColors.length > 0) {
            await db.insert(blindsProductColors).
                values(
                    parsedData.availableColors.map((color) => ({
                        productId,
                        name: color.name,
                        imageUrl: color.imageUrl,
                    }))
                );
        }

        // 6️⃣ Log activity (non-blocking — will not throw on failure)
        await createActivityLog(db, {
            userId: parsedData.userId,
            action: ActivityAction.CREATE,
            module: ActivityModule.BLINDS_PRODUCT,
            referenceId: insertedProduct.id,
            description: `Created blinds product: ${parsedData.name} (${parsedData.productCode})`,
        });

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
        // 1. Extract and Parse Query Parameters
        const page = Number(c.req.query("page") ?? 1);
        const limit = Number(c.req.query("limit") ?? 10);
        const search = c.req.query("search")?.toString() ?? "";
        const statusFilter = c.req.query("status")?.toString();
        const sortBy = c.req.query("sortBy")?.toString() ?? "createdAt";
        const sortOrder = c.req.query("sortOrder")?.toLowerCase() === "asc" ? "asc" : "desc";

        const offset = (page - 1) * limit;

        // 2. Build Where Conditions
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

        // 3. Get Total Count for Pagination
        const [totalResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(blindsProducts)
            .where(whereCondition);

        const total = Number(totalResult?.count ?? 0);
        const totalPages = Math.ceil(total / limit);

        // 4. Sort Column Validation (Fixes the TS Index error)
        const validSortColumns = ["name", "productCode", "createdAt", "unitPrice", "status"] as const;
        type SortableColumn = (typeof validSortColumns)[number];

        const safeSortBy = validSortColumns.includes(sortBy as SortableColumn)
            ? (sortBy as SortableColumn)
            : "createdAt";

        // 5. Fetch Optimized Data with Relations
        const blinds = await db.query.blindsProducts.findMany({
            where: whereCondition,
            // Select only necessary columns for the table grid
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
                createdAt: true,
                // Explicitly excluding bulky or unused text
                description: false,
                characteristic: false,
                updatedAt: false,
            },
            with: {
                // Fetch colors for display tags/swatches
                colors: {
                    columns: {
                        name: true,
                        imageUrl: true
                    }
                },
                // Fetch only the first image as the primary thumbnail
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

        // 6. Return Structured Response
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

        // 1. Validation: Null, Undefined, or Empty String
        if (!productId || productId.trim() === "" || productId === "undefined" || productId === "null") {
            return ctx.json({
                success: false,
                message: "A valid Product ID is required."
            }, 400);
        }

        // 2. Fetch data with relations
        const product = await db.query.blindsProducts.findFirst({
            where: eq(blindsProducts.id, productId),
            with: {
                images: true,
                colors: true,
            },
        });

        // 3. Validation: Check if product exists in DB
        if (!product) {
            return ctx.json({
                success: false,
                message: `Product with ID "${productId}" not found.`
            }, 404);
        }

        // 4. Return complete details
        return ctx.json({
            success: true,
            data: product,
        }, 200);

    } catch (error: any) {
        console.error("[GET_BLINDS_DETAILS_ERROR]:", error);

        // Handle malformed UUID errors specifically if using Postgres UUID type
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
}



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
            orderBy: (fields, { desc }) => [desc(fields.createdAt)],
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
            }
        });
    } catch (error) {
        console.error("Failed to get best sellers:", error);
        return c.json(
            { success: false, message: "Failed to fetch top seller products." },
            500
        );
    }
}

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
            orderBy: (fields, { desc }) => [desc(fields.createdAt)],
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
            }
        });
    } catch (error) {
        console.error("Failed to get new arrivals:", error);
        return c.json(
            { success: false, message: "Failed to fetch new arrival products." },
            500
        );
    }
}

// No export default needed when using named exports