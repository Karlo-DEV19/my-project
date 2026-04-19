import { error } from 'console';
import { z } from 'zod';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

// Safely handles both File objects (new uploads) and strings (existing Supabase URLs)
export const imageOrFileSchema = z
    .custom<File | string>(
        (val) => {
            if (typeof val === 'string' && val.trim().length > 0) return true;
            if (typeof window !== 'undefined' && val instanceof File) return true;
            return false;
        },
        'Please upload a valid image file or provide a valid URL.'
    )
    .superRefine((val, ctx) => {
        // If it's a string (URL), we assume it's already valid and uploaded
        if (typeof val === 'string') return;

        // If it's a File, run the strict size and type validations
        if (val instanceof File) {
            if (val.size > MAX_BYTES) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Max 10 MB.' });
            }
            if (!ALLOWED_MIME.includes(val.type)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'JPG, PNG or WEBP only.' });
            }
        }
    });

export const colorSchema = z.object({
    name: z.string().min(1, 'Color name required'),
    file: imageOrFileSchema,
});

export const PRODUCT_COLLECTIONS = ['Shop Only', 'New Arrival', 'Best Seller'] as const;

export const productSchema = z.object({
    productCode: z.string().min(1, 'Product code required'),
    name: z.string().min(2, 'Minimum 2 characters'),
    type: z.string().min(1, 'Select a type'),
    description: z.string().min(10, 'Minimum 10 characters'),
    unitPrice: z.coerce.number().positive('Must be a positive number'),
    composition: z.string().min(1, 'Required'),
    fabricWidth: z.string().min(1, 'Required'),
    thickness: z.string().min(1, 'Required'),
    packing: z.string().min(1, 'Required'),
    characteristic: z.string().optional(),
    mainImages: z
        .array(imageOrFileSchema)
        .min(1, 'At least one image required')
        .max(6, 'Max 6 images'),
    availableColors: z.array(colorSchema).min(1, 'At least one color required'),
    collection: z.enum(PRODUCT_COLLECTIONS, {
        error: () => ({
            message: 'Collection display type must be one of: Shop Only, New Arrival, Best Seller',
        }),
    }),
    stock: z.coerce.number().min(0, 'Must be 0 or greater'),
});

export type FormValues = z.infer<typeof productSchema>;

export const PRODUCT_TYPES = [
    'Combi Shades',
    'Triple Shades (Open Roman)',
    'Rollscreen Blackout',
    'Sunscreen',
    'Roller Blinds',
    'Roman Blinds',
    'Venetian Blinds',
] as const;

export const DEFAULT_VALUES: Partial<FormValues> = {
    productCode: '',
    name: '',
    type: '',
    description: '',
    unitPrice: 0,
    composition: '',
    fabricWidth: '',
    thickness: '',
    packing: '',
    characteristic: '',
    mainImages: [],
    availableColors: [{ name: '', file: undefined as unknown as File | string }],
    collection: 'Shop Only',
    stock: 0,

};