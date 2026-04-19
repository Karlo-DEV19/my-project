import { z } from "zod"

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalise a PH phone number to E.164 (+639XXXXXXXXX).
 * Accepts:
 *   09XXXXXXXXX  → +639XXXXXXXXX
 *   +639XXXXXXXXX → unchanged
 * Returns null on unrecognised format.
 */
export function normalisePHPhone(raw: string): string | null {
    const trimmed = raw.trim()
    if (/^09\d{9}$/.test(trimmed)) {
        return "+63" + trimmed.slice(1) // 09... → +639...
    }
    if (/^\+639\d{9}$/.test(trimmed)) {
        return trimmed // already E.164
    }
    return null
}

/**
 * Shared Zod schema for a Philippine mobile number.
 * Validates that the raw string is one of the two accepted formats.
 * Normalisation (09... → +63...) is done at submit time in the form.
 */
const phPhoneSchema = z
    .string()
    .min(1, "Phone number is required")
    .refine(
        (val) => /^[+\d]+$/.test(val.trim()),
        "Phone number must contain digits only (no letters or symbols)"
    )
    .superRefine((val, ctx) => {
        if (normalisePHPhone(val) !== null) return
        const t = val.trim()
        const message = t.startsWith("+63")
            ? "International format must be +639XXXXXXXXX (13 characters total)"
            : t.startsWith("09")
                ? "Local format must be exactly 11 digits: 09XXXXXXXXX"
                : "Enter a valid PH number: 09XXXXXXXXX or +639XXXXXXXXX"
        ctx.addIssue({ code: "custom", message })
    })

/**
 * Optional variant — only validates when a non-empty value is provided.
 */
const phPhoneOptionalSchema = z
    .string()
    .optional()
    .refine(
        (val) => !val || /^[+\d]+$/.test(val.trim()),
        "Phone number must contain digits only (no letters or symbols)"
    )
    .superRefine((val, ctx) => {
        if (!val || normalisePHPhone(val) !== null) return
        const t = val.trim()
        const message = t.startsWith("+63")
            ? "International format must be +639XXXXXXXXX (13 characters total)"
            : t.startsWith("09")
                ? "Local format must be exactly 11 digits: 09XXXXXXXXX"
                : "Enter a valid PH number: 09XXXXXXXXX or +639XXXXXXXXX"
        ctx.addIssue({ code: "custom", message })
    })


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
    firstName: z
        .string()
        .min(1, "First name is required")
        .regex(
            /^[A-Za-z\s]+$/,
            "First name must contain letters only — no numbers or special characters"
        ),
    lastName: z
        .string()
        .min(1, "Last name is required")
        .regex(
            /^[A-Za-z\s]+$/,
            "Last name must contain letters only — no numbers or special characters"
        ),
    email: z
        .string()
        .min(1, "Email address is required")
        .email("Please enter a valid email address")
        .refine(
            (val) => {
                const domain = val.split("@")[1]?.toLowerCase()
                return domain === "gmail.com" || domain === "yahoo.com"
            },
            "Only Gmail (@gmail.com) and Yahoo (@yahoo.com) addresses are accepted"
        ),
    // Primary phone — accepts 09XXXXXXXXX or +639XXXXXXXXX, stored as E.164
    phone: phPhoneSchema,
    // Secondary phone — same rules but optional
    phoneSecondary: phPhoneOptionalSchema,

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