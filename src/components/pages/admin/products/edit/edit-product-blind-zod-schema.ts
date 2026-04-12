import { z } from 'zod';

// ─── Shared Constants ──────────────────────────────────────────────────────────
export const PRODUCT_COLLECTIONS = ['Shop Only', 'New Arrival', 'Best Seller'] as const;
export const PRODUCT_STATUSES = ['active', 'inactive', 'archived'] as const;

export const PRODUCT_TYPES = [
    'Combi Shades',
    'Triple Shades (Open Roman)',
    'Rollscreen Blackout',
    'Sunscreen',
    'Roller Blinds',
    'Roman Blinds',
    'Venetian Blinds',
] as const;

// ─── Image Schema ──────────────────────────────────────────────────────────────
// Accepts either a File (new upload) or a string URL (existing Supabase URL)
export const editImageSchema = z
    .custom<File | string>(
        (val) => {
            if (typeof val === 'string' && val.trim().length > 0) return true;
            if (typeof window !== 'undefined' && val instanceof File) return true;
            return false;
        },
        'Please upload a valid image file or provide a valid URL.'
    )
    .superRefine((val, ctx) => {
        if (typeof val === 'string') return; // existing URL — already valid
        if (val instanceof File) {
            if (val.size > 10 * 1024 * 1024) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Max 10 MB.' });
            }
            if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(val.type)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'JPG, PNG or WEBP only.' });
            }
        }
    });

// ─── Color Schema ──────────────────────────────────────────────────────────────
// For edit: color swatch can be an existing string URL OR a new File
export const editColorSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Color name is required'),
    // file holds either a new File or existing URL string
    file: editImageSchema,
});

// ─── Main Edit Schema ──────────────────────────────────────────────────────────
export const editProductSchema = z.object({
    productCode:   z.string().min(1, 'Product code is required'),
    name:          z.string().min(3, 'Name must be at least 3 characters'),
    description:   z.string().default(''),
    type:          z.string().min(1, 'Type is required'),
    collection:    z.enum(PRODUCT_COLLECTIONS, {
        error: () => ({ message: 'Must be Shop Only, New Arrival, or Best Seller' }),
    }),
    status:        z.enum(PRODUCT_STATUSES).default('active'),
    composition:   z.string().min(1, 'Composition is required'),
    fabricWidth:   z.string().min(1, 'Fabric width is required'),
    thickness:     z.string().min(1, 'Thickness is required'),
    packing:       z.string().min(1, 'Packing is required'),
    characteristic: z.string().default(''),
    unitPrice:     z.coerce.number().min(0.01, 'Price must be greater than 0'),
    // mainImages: array of File (new) | string (existing URL)
    mainImages:    z.array(editImageSchema).min(1, 'At least one image is required').max(6, 'Max 6 images'),
    // colors: array of color objects with id, name, file (File | string)
    availableColors: z.array(editColorSchema).min(1, 'At least one color is required'),
});

export type EditFormValues = z.infer<typeof editProductSchema>;

// ─── Default Values ────────────────────────────────────────────────────────────
export const EDIT_DEFAULT_VALUES: EditFormValues = {
    productCode:     '',
    name:            '',
    description:     '',
    type:            '',
    collection:      'Shop Only',
    status:          'active',
    composition:     '',
    fabricWidth:     '',
    thickness:       '',
    packing:         '',
    characteristic:  '',
    unitPrice:       0,
    mainImages:      [],
    availableColors: [],
};