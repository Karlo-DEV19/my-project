// lib/schemas/checkout.schema.ts
import { z } from "zod"

// Philippine mobile: always +63 9XXXXXXXXX (11 digits local, 10 after stripping leading 0)
// react-phone-number-input stores E.164: +639XXXXXXXXX
const phMobileRegex = /^\+639\d{9}$/

export const checkoutSchema = z.object({
    // ── Contact ──────────────────────────────────────────────
    email: z
        .string()
        .min(1, "Email is required.")
        .email("Please enter a valid email address."),

    // ── Recipient ────────────────────────────────────────────
    firstName: z.string().min(2, "First name must be at least 2 characters."),
    lastName: z.string().min(2, "Last name must be at least 2 characters."),

    phone: z
        .string()
        .min(1, "Phone number is required.")
        .regex(phMobileRegex, "Enter a valid PH mobile number starting with 9."),

    phoneSecondary: z
        .string()
        .optional()
        .refine(
            (val) => !val || phMobileRegex.test(val),
            "Enter a valid PH mobile number starting with 9."
        ),

    // ── Delivery Address ─────────────────────────────────────
    address: z.object({
        unitFloor: z.string().optional(),
        street: z.string().min(3, "Street address is required."),
        barangay: z.string().min(2, "Barangay is required."),
        city: z.string().min(2, "City / Municipality is required."),
        province: z.string().min(2, "Province is required."),
        zipCode: z
            .string()
            .min(4, "Zip code must be at least 4 digits.")
            .max(4, "Zip code must be 4 digits.")
            .regex(/^\d{4}$/, "Zip code must be 4 digits."),
    }),

    // ── Map pin (optional — falls back to manual entry) ──────
    coordinates: z
        .object({
            lat: z.number(),
            lng: z.number(),
            formattedAddress: z.string().optional(),
        })
        .optional(),

    // ── Delivery Notes ───────────────────────────────────────
    deliveryNotes: z
        .string()
        .max(300, "Notes must be under 300 characters.")
        .optional(),

    // ── Payment ──────────────────────────────────────────────
    paymentMethod: z.enum(["gcash", "maya"], {
        error: "Please select a payment method.",
    }),

    agreeTerms: z.literal(true, {
        error: "You must agree to the terms to continue.",
    }),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>