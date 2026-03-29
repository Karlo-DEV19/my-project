import { z } from "zod"

// ─── Schema ───────────────────────────────────────────────────────────────────
// IMPORTANT: `items` and all financial totals (subtotal, vat, totalAmount, etc.)
// are intentionally NOT in this schema.
//
// WHY: They are never rendered as <FormField> or <Controller> elements, so RHF
// never registers them. zodResolver evaluates the raw registered field values —
// if a field has no corresponding input, its value is `undefined` regardless of
// what you put in defaultValues or form.setValue. This is what caused:
//   "Invalid input: expected array, received undefined"
//
// The fix: validate ONLY what the user actually types/selects in the form.
// Items and financials are derived from props (cart store + computeCartTotals)
// and are assembled into the API payload manually in the handleSubmit wrapper,
// bypassing zodResolver entirely.

export const checkoutSchema = z.object({
    // ── Contact ───────────────────────────────────────────────────────────────
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    phoneSecondary: z.string().optional(),

    // ── Order meta ────────────────────────────────────────────────────────────
    paymentMethod: z.enum(["gcash", "paymaya"], {
        error: () => ({ message: "Please select a payment method" }),
    }),

    // Must equal literal true — zod blocks submit and shows the error if unchecked.
    agreeTerms: z.literal(true, {
        error: () => ({ message: "You must agree to the terms and conditions" }),
    }),

    deliveryNotes: z.string().max(300).optional(),

    // ── Address ───────────────────────────────────────────────────────────────
    address: z.object({
        unitFloor: z.string().optional(),
        street: z.string().min(1, "Street address is required"),
        barangay: z.string().min(1, "Barangay is required"),
        city: z.string().min(1, "City / Municipality is required"),
        province: z.string().min(1, "Province is required"),
        zipCode: z.string().min(4, "Valid zip code is required"),
    }),

    // ── Coordinates ───────────────────────────────────────────────────────────
    // Optional in schema — set imperatively via form.setValue when user pins map.
    // onSubmit guard provides the user-facing "pin your location" error.
    coordinates: z
        .object({
            lat: z.number(),
            lng: z.number(),
            formattedAddress: z.string().optional(),
        })
        .optional(),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>