// src/app/api/zod/product-blinds-zod-schema.ts
import { z } from 'zod';

// Schema for individual color option
export const blindsColorSchema = z.object({
    name: z.string().min(1, 'Color name required'),
    imageUrl: z.string().url('Valid image URL required'),
});

// Schema for blinds product
export const blindsProductSchema = z.object({
    productCode: z.string().min(1, 'Product code required'),
    name: z.string().min(2, 'Product name required'),
    type: z.string().min(1, 'Select a type'),
    description: z.string().min(10, 'Minimum 10 characters'),
    unitPrice: z.number().positive('Must be a positive number'),
    composition: z.string().min(1, 'Required'),
    fabricWidth: z.string().min(1, 'Required'),
    thickness: z.string().min(1, 'Required'),
    packing: z.string().min(1, 'Required'),
    characteristic: z.string().optional(),
    mainImages: z
        .array(z.string().url('Valid image URL required'))
        .min(1, 'At least one image required'),
    availableColors: z
        .array(blindsColorSchema)
        .min(1, 'At least one color required'),
});

// Type for TypeScript
export type BlindsProductValues = z.infer<typeof blindsProductSchema>;