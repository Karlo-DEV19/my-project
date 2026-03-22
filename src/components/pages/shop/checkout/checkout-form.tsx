"use client"

// components/pages/shop/checkout/checkout-form.tsx

import { useState, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import dynamic from "next/dynamic"
import {
    User,
    MapPin,
    CreditCard,
    FileText,
    ChevronRight,
    Phone,
    Mail,
    Building2,
    Info,
    Loader2,
    CheckCircle2,
} from "lucide-react"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { checkoutSchema, type CheckoutFormValues } from "@/lib/zod-schema/checkout.schema"
import type { LocationData } from "@/components/ui/location-picker"

// ─────────────────────────────────────────────────────────────
// Dynamic imports — both are client-only and must never SSR.
//
// PhPhoneInput: imports react-phone-number-input/style.css which
//   crashes the SSR chunk if bundled server-side.
//
// LocationPicker: imports Leaflet which has direct DOM access and
//   also cannot run in a Node.js environment.
// ─────────────────────────────────────────────────────────────
const PhPhoneInput = dynamic(
    () => import("@/components/ui/phone-input").then((m) => m.PhPhoneInput),
    {
        ssr: false,
        // Render a matching skeleton so layout doesn't shift while loading
        loading: () => (
            <div className="h-11 border border-input bg-transparent animate-pulse" />
        ),
    }
)

const LocationPicker = dynamic(
    () => import("@/components/ui/location-picker"),
    {
        ssr: false,
        loading: () => (
            <div className="h-[420px] border border-border/50 bg-muted/20 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <p className="text-xs tracking-widest uppercase">Loading map</p>
                </div>
            </div>
        ),
    }
)

// ─────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────
function SectionHeader({
    icon: Icon,
    step,
    title,
    description,
}: {
    icon: React.ElementType
    step: number
    title: string
    description?: string
}) {
    return (
        <div className="flex items-start gap-4 pb-6 border-b border-border/50 mb-6">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center">
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
                    Step {step}
                </span>
            </div>
            <div className="pt-1">
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground">
                    {title}
                </h3>
                {description && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Field label
// ─────────────────────────────────────────────────────────────
function FieldLabel({
    children,
    optional,
}: {
    children: React.ReactNode
    optional?: boolean
}) {
    return (
        <FormLabel className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground flex items-center gap-2">
            {children}
            {optional && (
                <span className="normal-case tracking-normal font-normal text-muted-foreground/60 text-[10px]">
                    optional
                </span>
            )}
        </FormLabel>
    )
}

// ─────────────────────────────────────────────────────────────
// Payment card
// ─────────────────────────────────────────────────────────────
function PaymentCard({
    selected,
    onSelect,
    label,
    sublabel,
    accentColor,
}: {
    value: string
    selected: boolean
    onSelect: () => void
    label: string
    sublabel: string
    accentColor: string
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`
                relative flex items-center gap-4 p-4 border text-left transition-all duration-200
                ${selected
                    ? "border-foreground bg-foreground/[0.03]"
                    : "border-border/50 hover:border-border"
                }
            `}
        >
            <div
                className="absolute left-0 top-0 bottom-0 w-0.5 transition-opacity duration-200"
                style={{ backgroundColor: accentColor, opacity: selected ? 1 : 0 }}
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold tracking-wide text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
            </div>
            <div
                className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    transition-all duration-200 shrink-0
                    ${selected ? "border-foreground bg-foreground" : "border-border"}
                `}
            >
                {selected && <div className="w-2 h-2 rounded-full bg-background" />}
            </div>
        </button>
    )
}

// ─────────────────────────────────────────────────────────────
// CheckoutForm
// ─────────────────────────────────────────────────────────────
export function CheckoutForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            email: "",
            firstName: "",
            lastName: "",
            phone: "",
            phoneSecondary: "",
            address: {
                unitFloor: "",
                street: "",
                barangay: "",
                city: "",
                province: "",
                zipCode: "",
            },
            deliveryNotes: "",
            paymentMethod: "gcash",
            agreeTerms: undefined as unknown as true,
        },
    })

    // Fill address fields from map-resolved location data.
    // Uses location.components (not addressComponents) per the LocationData type.
    const handleLocationSelect = useCallback(
        (location: LocationData) => {
            form.setValue("coordinates", {
                lat: location.lat,
                lng: location.lng,
                formattedAddress: location.address,
            })

            const c = location.components
            console.log("c", c)
            if (!c) return

            if (c.street) form.setValue("address.street", c.street, { shouldValidate: true })
            if (c.barangay) form.setValue("address.barangay", c.barangay, { shouldValidate: true })
            if (c.city) form.setValue("address.city", c.city, { shouldValidate: true })
            if (c.province && c.province.trim() !== "") {
                form.setValue("address.province", c.province, {
                    shouldValidate: true,
                });
            } else if (c.region) {
                form.setValue("address.province", c.region, {
                    shouldValidate: true,
                });
            }
            if (c.zip) form.setValue("address.zipCode", c.zip.slice(0, 4), { shouldValidate: true })
            if (c.building) form.setValue("address.unitFloor", c.building, { shouldValidate: true })
        },
        [form]
    )

    const onSubmit = async (data: CheckoutFormValues) => {
        setIsSubmitting(true)
        try {
            // TODO: replace with your actual server action
            await new Promise((r) => setTimeout(r, 1500))
            console.log("[CHECKOUT] Submitted:", data)
            setIsSubmitted(true)
            toast.success("Order placed successfully!", {
                description: `Confirmation will be sent to ${data.email}`,
            })
        } catch {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4 border border-border bg-background">
                <div className="w-14 h-14 rounded-full bg-foreground/5 border border-border flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-foreground" strokeWidth={1.5} />
                </div>
                <div className="space-y-1.5">
                    <h2 className="text-xl font-semibold tracking-tight">Order Received</h2>
                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                        Thank you for your order. We'll send a confirmation to your email shortly.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col border border-border bg-background">
            {/* Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-border bg-accent/5">
                <p className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground mb-1">
                    MJ Decor 888
                </p>
                <h2 className="font-serif text-xl sm:text-2xl tracking-wide text-foreground">
                    Checkout Details
                </h2>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-col divide-y divide-border/50"
                >
                    {/* ── 1. Contact ──────────────────────────────────── */}
                    <section className="p-6 sm:p-8">
                        <SectionHeader
                            icon={Mail}
                            step={1}
                            title="Contact Information"
                            description="Your receipt and order updates will be sent here."
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FieldLabel>Email Address</FieldLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="e.g. juan@example.com"
                                            autoComplete="email"
                                            className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />
                    </section>

                    {/* ── 2. Recipient ─────────────────────────────────── */}
                    <section className="p-6 sm:p-8">
                        <SectionHeader
                            icon={User}
                            step={2}
                            title="Recipient Details"
                            description="The person who will receive the delivery."
                        />

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FieldLabel>First Name</FieldLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Juan"
                                                    autoComplete="given-name"
                                                    className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FieldLabel>Last Name</FieldLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Dela Cruz"
                                                    autoComplete="family-name"
                                                    className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Primary phone */}
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FieldLabel>
                                            <Phone className="w-3 h-3" />
                                            Primary Phone
                                        </FieldLabel>
                                        <FormControl>
                                            <PhPhoneInput
                                                value={field.value}
                                                onChange={field.onChange}
                                                hasError={!!form.formState.errors.phone}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            {/* Secondary phone */}
                            <FormField
                                control={form.control}
                                name="phoneSecondary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FieldLabel optional>
                                            <Phone className="w-3 h-3" />
                                            Secondary Phone
                                        </FieldLabel>
                                        <FormControl>
                                            <PhPhoneInput
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="e.g. Backup contact number"
                                                hasError={!!form.formState.errors.phoneSecondary}
                                            />
                                        </FormControl>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Recommended — riders often call a backup if the primary is unreachable.
                                        </p>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </section>

                    {/* ── 3. Delivery Address ──────────────────────────── */}
                    <section className="p-6 sm:p-8">
                        <SectionHeader
                            icon={MapPin}
                            step={3}
                            title="Delivery Address"
                            description="Pin your location on the map or fill in manually."
                        />

                        <div className="mb-6">
                            <LocationPicker
                                onLocationSelect={handleLocationSelect}
                                className="rounded-none border-border/50"
                            />
                        </div>

                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="address.unitFloor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FieldLabel optional>
                                            <Building2 className="w-3 h-3" />
                                            Unit / Floor / House No.
                                        </FieldLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. Unit 4B, 2nd Floor, House 12"
                                                className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address.street"
                                render={({ field }) => (
                                    <FormItem>
                                        <FieldLabel>Street Address</FieldLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. 123 Rizal Avenue"
                                                autoComplete="address-line1"
                                                className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address.barangay"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FieldLabel>Barangay</FieldLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Brgy. San Lorenzo"
                                                    className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address.city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FieldLabel>City / Municipality</FieldLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Makati City"
                                                    autoComplete="address-level2"
                                                    className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address.province"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FieldLabel>Province</FieldLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Metro Manila"
                                                    autoComplete="address-level1"
                                                    className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address.zipCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FieldLabel>Postal / Zip Code</FieldLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. 1223"
                                                    inputMode="numeric"
                                                    maxLength={4}
                                                    autoComplete="postal-code"
                                                    className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(e.target.value.replace(/\D/g, ""))
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </section>

                    {/* ── 4. Delivery Notes ────────────────────────────── */}
                    <section className="p-6 sm:p-8">
                        <SectionHeader
                            icon={FileText}
                            step={4}
                            title="Delivery Instructions"
                            description="Help our riders find you easily."
                        />
                        <FormField
                            control={form.control}
                            name="deliveryNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FieldLabel optional>Landmarks & Delivery Notes</FieldLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="e.g. Brown gate, 3rd house from the corner. Leave at lobby if no answer."
                                            className="bg-transparent text-sm rounded-none border-border/70 resize-none min-h-[100px]"
                                            maxLength={300}
                                            {...field}
                                        />
                                    </FormControl>
                                    <div className="flex items-center justify-between mt-1">
                                        <FormMessage className="text-[10px]" />
                                        <span className="text-[10px] text-muted-foreground ml-auto">
                                            {(field.value ?? "").length}/300
                                        </span>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </section>

                    {/* ── 5. Payment ───────────────────────────────────── */}
                    <section className="p-6 sm:p-8">
                        <SectionHeader
                            icon={CreditCard}
                            step={5}
                            title="Payment Method"
                            description="Select your preferred payment channel."
                        />

                        <div className="space-y-4">
                            <Controller
                                control={form.control}
                                name="paymentMethod"
                                render={({ field, fieldState }) => (
                                    <FormItem>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <PaymentCard
                                                value="gcash"
                                                selected={field.value === "gcash"}
                                                onSelect={() => field.onChange("gcash")}
                                                label="GCash"
                                                sublabel="Instant mobile wallet payment"
                                                accentColor="#0066cc"
                                            />
                                            <PaymentCard
                                                value="maya"
                                                selected={field.value === "maya"}
                                                onSelect={() => field.onChange("maya")}
                                                label="Maya"
                                                sublabel="Formerly PayMaya"
                                                accentColor="#00a86b"
                                            />
                                        </div>
                                        {fieldState.error && (
                                            <p className="text-[10px] font-medium text-destructive mt-1">
                                                {fieldState.error.message}
                                            </p>
                                        )}
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-start gap-3 p-4 bg-accent/10 border border-border/50">
                                <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    For custom items like blinds, a{" "}
                                    <span className="font-semibold text-foreground">
                                        downpayment is required
                                    </span>{" "}
                                    to confirm your order and schedule installation. Our team will
                                    contact you with payment instructions.
                                </p>
                            </div>

                            <FormField
                                control={form.control}
                                name="agreeTerms"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-start gap-3 p-4 border border-border/50">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value === true}
                                                    onCheckedChange={(checked) =>
                                                        field.onChange(checked ? true : undefined)
                                                    }
                                                    className="mt-0.5"
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-xs font-medium text-foreground cursor-pointer">
                                                    I agree to the Terms and Conditions
                                                </FormLabel>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                    By placing this order, you confirm that all delivery details are correct. MJ Decor 888 is not liable for failed deliveries due to incorrect address information.
                                                </p>
                                            </div>
                                        </div>
                                        <FormMessage className="text-[10px] mt-1" />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </section>

                    {/* ── Submit ───────────────────────────────────────── */}
                    <div className="p-6 sm:p-8 bg-accent/5">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="
                                w-full flex items-center justify-center gap-3
                                h-14 bg-foreground text-background
                                uppercase tracking-[0.2em] text-xs font-semibold
                                hover:bg-foreground/90 active:scale-[0.995]
                                transition-all duration-150
                                disabled:opacity-60 disabled:cursor-not-allowed
                            "
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Place Order
                                    <ChevronRight className="w-4 h-4" strokeWidth={2} />
                                </>
                            )}
                        </button>
                        <p className="text-[10px] text-center text-muted-foreground mt-4 leading-relaxed">
                            Your personal data is used only to process your order and is never shared with third parties.
                        </p>
                    </div>
                </form>
            </Form>
        </div>
    )
}