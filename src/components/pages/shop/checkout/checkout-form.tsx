"use client"

import { useCallback, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import {
    User, MapPin, CreditCard, FileText, ChevronRight,
    Phone, Mail, Building2, Info, Loader2, ShoppingCart,
} from "lucide-react"
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { checkoutSchema, type CheckoutFormValues, normalisePHPhone } from "@/lib/zod-schema/checkout.schema"
import type { LocationData } from "@/components/ui/location-picker"
import { useCheckoutOrder, type PaymentMethodType } from "@/app/api/hooks/use-order"
import type { CartItem, computeCartTotals } from "@/lib/zustand/use-cart-store"
import PaymentMethod from "./payment-method"

const PhPhoneInput = dynamic(
    () => import("@/components/ui/phone-input").then((m) => m.PhPhoneInput),
    {
        ssr: false,
        loading: () => <div className="h-11 border border-input bg-transparent animate-pulse" />,
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

// ─── Terms & Conditions Modal ────────────────────────────────────────────────

interface TermsModalProps {
    open: boolean
    onConfirm: () => void
    onClose: () => void
}

function TermsAndConditionsModal({ open, onConfirm, onClose }: TermsModalProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
    const [confirmed, setConfirmed] = useState(false)

    const handleScroll = () => {
        const el = scrollRef.current
        if (!el) return
        const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8
        if (isAtBottom) setHasScrolledToBottom(true)
    }

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            // reset internal state on close
            setHasScrolledToBottom(false)
            setConfirmed(false)
            onClose()
        }
    }

    const handleConfirm = () => {
        setHasScrolledToBottom(false)
        setConfirmed(false)
        onConfirm()
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-lg w-full rounded-none p-0 gap-0 border border-border bg-background overflow-hidden"
                showCloseButton={true}
            >
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                    <DialogTitle className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground">
                        Terms &amp; Conditions
                    </DialogTitle>
                    <DialogDescription className="text-[10px] text-muted-foreground mt-0.5">
                        Please read the full terms before confirming your order.
                    </DialogDescription>
                </DialogHeader>

                {/* Scrollable content */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="overflow-y-auto px-6 py-5 max-h-[52vh] text-xs text-muted-foreground leading-relaxed space-y-4"
                >
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-foreground">
                            1. Order &amp; Payment
                        </p>
                        <p>
                            All orders require a <strong className="text-foreground">50% downpayment</strong> at the
                            time of checkout. The remaining balance is due upon delivery. MJ Decor 888 reserves the
                            right to cancel any order if the downpayment is not received within 24 hours of placing
                            the order.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-foreground">
                            2. Delivery
                        </p>
                        <p>
                            MJ Decor 888 is not liable for failed or delayed deliveries caused by incorrect or
                            incomplete address information provided by the customer. It is the customer's
                            responsibility to ensure all delivery details are accurate before submitting an order.
                        </p>
                        <p>
                            Delivery timelines are estimates only and may be affected by factors beyond our control,
                            including weather, traffic, and carrier availability.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-foreground">
                            3. Returns &amp; Refunds
                        </p>
                        <p>
                            Custom or made-to-order items are non-refundable once production has started. For
                            eligible returns, customers must notify MJ Decor 888 within 48 hours of receiving the
                            item. Returns must be in original, unused condition with all packaging intact.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-foreground">
                            4. Privacy
                        </p>
                        <p>
                            Personal information collected during checkout is used solely to process and fulfill your
                            order. MJ Decor 888 does not sell, trade, or share your personal data with third parties
                            outside of the delivery process.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-foreground">
                            5. Liability
                        </p>
                        <p>
                            MJ Decor 888's liability is limited to the amount paid for the order. We are not
                            responsible for any indirect, incidental, or consequential damages arising from the use
                            of our products or services.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-foreground">
                            6. Amendments
                        </p>
                        <p>
                            MJ Decor 888 reserves the right to update these Terms &amp; Conditions at any time.
                            Continued use of our services after changes are posted constitutes your acceptance of
                            the revised terms.
                        </p>
                    </div>

                    {/* Scroll sentinel */}
                    <div aria-hidden="true" />
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border/50 space-y-3 bg-accent/5">
                    {!hasScrolledToBottom && (
                        <p className="text-[10px] text-muted-foreground text-center animate-pulse">
                            ↓ Scroll down to read and accept the terms
                        </p>
                    )}

                    <label
                        className={`flex items-start gap-3 cursor-pointer ${hasScrolledToBottom ? "opacity-100" : "opacity-40 pointer-events-none"
                            } transition-opacity duration-200`}
                    >
                        <Checkbox
                            id="terms-confirm-checkbox"
                            checked={confirmed}
                            onCheckedChange={(val) => setConfirmed(val === true)}
                            disabled={!hasScrolledToBottom}
                            className="mt-0.5"
                        />
                        <span className="text-xs text-foreground leading-snug">
                            I have read and agree to the Terms &amp; Conditions
                        </span>
                    </label>

                    <button
                        type="button"
                        disabled={!confirmed}
                        onClick={handleConfirm}
                        className="w-full h-11 bg-foreground text-background text-xs uppercase tracking-[0.2em] font-semibold
                                   hover:bg-foreground/90 active:scale-[0.995] transition-all duration-150
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Confirm &amp; Accept
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, step, title, description }: {
    icon: React.ElementType; step: number; title: string; description?: string
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
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground">{title}</h3>
                {description && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
                )}
            </div>
        </div>
    )
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
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

// ─── Props ────────────────────────────────────────────────────────────────────

type CartTotals = ReturnType<typeof computeCartTotals>

interface CheckoutFormProps {
    items: CartItem[]
    clearCart: () => void
    totals: CartTotals
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const phpFormat = (n: number) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
    }).format(n)

const r2 = (n: number) => Math.round(n * 100) / 100

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CheckoutForm({ items, clearCart, totals }: CheckoutFormProps) {
    const router = useRouter()
    const { checkoutOrderAsync, isPending, isError } = useCheckoutOrder()

    // ── Terms modal state ─────────────────────────────────────────────────────
    const [termsModalOpen, setTermsModalOpen] = useState(false)
    // Callback ref set when user clicks the checkbox — used to accept terms
    const pendingTermsAccept = useRef<((value: boolean | undefined) => void) | null>(null)

    const {
        fullSubtotal: subtotal,
        fullVat: vat,
        fullTotal,
        downpaymentSubtotal,
        downpaymentVat,
        downpaymentTotal,
    } = totals

    const balanceDue = fullTotal - downpaymentTotal

    // ── Form setup ────────────────────────────────────────────────────────────
    // Only fields that are actually rendered as <FormField> / <Controller>
    // go into defaultValues. Items and financials are props — they never touch
    // the form registry, so they must NOT be in the schema or defaultValues.
    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            phoneSecondary: "",
            paymentMethod: "gcash",
            deliveryNotes: "",
            address: {
                unitFloor: "",
                street: "",
                barangay: "",
                city: "",
                province: "",
                zipCode: "",
            },
            // coordinates intentionally omitted — set via form.setValue in handleLocationSelect
            // agreeTerms intentionally omitted — undefined until checkbox ticked
        },
    })

    // ── Location picker ───────────────────────────────────────────────────────
    const handleLocationSelect = useCallback((location: LocationData) => {
        form.setValue("coordinates", {
            lat: location.lat,
            lng: location.lng,
            formattedAddress: location.address,
        })
        const c = location.components
        if (!c) return
        if (c.street) form.setValue("address.street", c.street, { shouldValidate: true })
        if (c.barangay) form.setValue("address.barangay", c.barangay, { shouldValidate: true })
        if (c.city) form.setValue("address.city", c.city, { shouldValidate: true })
        if (c.province?.trim()) {
            form.setValue("address.province", c.province, { shouldValidate: true })
        } else if (c.region) {
            form.setValue("address.province", c.region, { shouldValidate: true })
        }
        if (c.zip) form.setValue("address.zipCode", c.zip.slice(0, 4), { shouldValidate: true })
        if (c.building) form.setValue("address.unitFloor", c.building, { shouldValidate: true })
    }, [form])

    // ── Submit ────────────────────────────────────────────────────────────────
    // `data` here is the zod-validated form payload (contact, address, payment).
    // Items and financials come from props and are assembled into the API payload here.
    const onSubmit = async (data: CheckoutFormValues) => {
        // ── Guard: map must be pinned ─────────────────────────────────────────
        if (!data.coordinates?.lat || !data.coordinates?.lng) {
            toast.error("Please pin your delivery location on the map.")
            return
        }

        // ── Guard: cart must not be empty ─────────────────────────────────────
        if (items.length === 0) {
            toast.error("Your cart is empty.", {
                description: "Add items to your cart before checking out.",
            })
            return
        }

        // ── Build items from cart prop (not from form state) ──────────────────
        const orderItems = items.map((cartItem) => ({
            productId: cartItem.order.productId,
            colorId: cartItem.order.selectedColor?.colorId ?? undefined,
            quantity: cartItem.quantity,
        }))

        // ── Build final payload — financials from computeCartTotals prop ──────
        const payload = {
            // Zod-validated fields
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            // Normalise to E.164 (+639XXXXXXXXX) — handles both 09... and +639... inputs
            phone: normalisePHPhone(data.phone) ?? data.phone,
            phoneSecondary: data.phoneSecondary?.trim()
                ? (normalisePHPhone(data.phoneSecondary) ?? data.phoneSecondary)
                : undefined,
            paymentMethod: data.paymentMethod as PaymentMethodType,
            agreeTerms: true as const,
            deliveryNotes: data.deliveryNotes?.trim() || undefined,
            address: {
                unitFloor: data.address.unitFloor?.trim() || undefined,
                street: data.address.street,
                barangay: data.address.barangay,
                city: data.address.city,
                province: data.address.province,
                zipCode: data.address.zipCode,
            },
            coordinates: {
                lat: data.coordinates.lat,
                lng: data.coordinates.lng,
                formattedAddress: data.coordinates.formattedAddress ?? "",
            },
            // Derived from cart prop — never touched by RHF/zod
            items: orderItems,
            subtotal: r2(subtotal),
            vat: r2(vat),
            totalAmount: r2(fullTotal),
            downpaymentSubtotal: r2(downpaymentSubtotal),
            downpaymentVat: r2(downpaymentVat),
            downpaymentAmount: r2(downpaymentTotal),
        }

        console.log("📦 [CheckoutForm] Final API payload:", JSON.stringify(payload, null, 2))

        try {
            const response = await checkoutOrderAsync(payload)
            console.log("✅ [CheckoutForm] API response:", response)

            if (response.data?.checkoutUrl) {
                toast.success("Redirecting to payment...", {
                    description: `Order ${response.data.trackingNumber} · ${phpFormat(downpaymentTotal)}`,
                })
                clearCart()
                await new Promise((r) => setTimeout(r, 800))
                window.location.assign(response.data.checkoutUrl)
            }
        } catch (error: any) {
            console.error("❌ [CheckoutForm] API error full object:", error)
            console.error("❌ [CheckoutForm] API error response data:", error?.response?.data)

            const message =
                error?.response?.data?.message ??
                error?.message ??
                "Something went wrong. Please try again."
            toast.error("Order failed", { description: message })
        }
    }

    // ── handleSubmit with zod error logger ────────────────────────────────────
    const handleSubmit = form.handleSubmit(
        onSubmit,
        (errors) => {
            // This fires when zodResolver blocks submission — log every field error
            console.warn(
                "🚫 [CheckoutForm] Zod validation errors (submit blocked):",
                JSON.stringify(errors, null, 2)
            )

            // Toast the first error so it's visible without opening devtools
            const firstMessage = Object.values(errors)
                .flatMap((e: any) =>
                    e?.message
                        ? [e.message]
                        : Object.values(e ?? {}).map((nested: any) => nested?.message)
                )
                .filter(Boolean)[0]

            if (firstMessage) {
                toast.error("Please fix the form errors", { description: String(firstMessage) })
            }
        }
    )

    // ── Empty cart guard ──────────────────────────────────────────────────────
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4 border border-border bg-background">
                <div className="w-14 h-14 rounded-full bg-foreground/5 border border-border flex items-center justify-center">
                    <ShoppingCart className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div className="space-y-1.5">
                    <h2 className="text-lg font-semibold tracking-tight">Your cart is empty</h2>
                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                        Add items to your cart before proceeding to checkout.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => router.push("/shop")}
                    className="mt-2 h-11 px-8 bg-foreground text-background text-xs uppercase tracking-[0.2em] font-semibold hover:bg-foreground/90 transition-colors"
                >
                    Browse Products
                </button>
            </div>
        )
    }

    // ── Render ────────────────────────────────────────────────────────────────
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
                <p className="text-xs text-muted-foreground mt-1">
                    {items.length} {items.length === 1 ? "item" : "items"} in your cart
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={handleSubmit} className="flex flex-col divide-y divide-border/50">

                    {/* ── 1. Contact ───────────────────────────────────── */}
                    <section className="p-6 sm:p-8">
                        <SectionHeader icon={Mail} step={1} title="Contact Information"
                            description="Your receipt and order updates will be sent here." />
                        <FormField control={form.control} name="email" render={({ field, fieldState }) => (
                            <FormItem>
                                <FieldLabel>Email Address</FieldLabel>
                                <FormControl>
                                    <Input type="email" placeholder="e.g. juan@gmail.com"
                                        autoComplete="email"
                                        className={`h-11 bg-transparent text-sm rounded-none ${fieldState.error ? "border-destructive" : "border-border/70"}`}
                                        {...field} />
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                            </FormItem>
                        )} />
                    </section>

                    {/* ── 2. Recipient ─────────────────────────────────── */}
                    <section className="p-6 sm:p-8">
                        <SectionHeader icon={User} step={2} title="Recipient Details"
                            description="The person who will receive the delivery." />
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="firstName" render={({ field, fieldState }) => (
                                    <FormItem>
                                        <FieldLabel>First Name</FieldLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. Juan"
                                                autoComplete="given-name"
                                                className={`h-11 bg-transparent text-sm rounded-none ${fieldState.error ? "border-destructive" : "border-border/70"}`}
                                                {...field}
                                                onKeyDown={(e) => {
                                                    if (/^\d$/.test(e.key)) e.preventDefault()
                                                }}
                                                onChange={(e) => {
                                                    field.onChange(e.target.value.replace(/\d/g, ""))
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="lastName" render={({ field, fieldState }) => (
                                    <FormItem>
                                        <FieldLabel>Last Name</FieldLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. Dela Cruz"
                                                autoComplete="family-name"
                                                className={`h-11 bg-transparent text-sm rounded-none ${fieldState.error ? "border-destructive" : "border-border/70"}`}
                                                {...field}
                                                onKeyDown={(e) => {
                                                    if (/^\d$/.test(e.key)) e.preventDefault()
                                                }}
                                                onChange={(e) => {
                                                    field.onChange(e.target.value.replace(/\d/g, ""))
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )} />
                            </div>

                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FieldLabel><Phone className="w-3 h-3" />Primary Phone</FieldLabel>
                                    <FormControl>
                                        <PhPhoneInput value={field.value} onChange={field.onChange}
                                            hasError={!!form.formState.errors.phone} />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="phoneSecondary" render={({ field }) => (
                                <FormItem>
                                    <FieldLabel optional><Phone className="w-3 h-3" />Secondary Phone</FieldLabel>
                                    <FormControl>
                                        <PhPhoneInput value={field.value} onChange={field.onChange}
                                            placeholder="e.g. Backup contact number"
                                            hasError={!!form.formState.errors.phoneSecondary} />
                                    </FormControl>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Recommended — riders often call a backup if the primary is unreachable.
                                    </p>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} />
                        </div>
                    </section>

                    {/* ── 3. Delivery Address ──────────────────────────── */}
                    <section className="p-6 sm:p-8">
                        <SectionHeader icon={MapPin} step={3} title="Delivery Address"
                            description="Pin your location on the map or fill in manually." />
                        <div className="mb-6">
                            <LocationPicker onLocationSelect={handleLocationSelect}
                                className="rounded-none border-border/50" />
                        </div>
                        <div className="space-y-4">
                            <FormField control={form.control} name="address.unitFloor" render={({ field }) => (
                                <FormItem>
                                    <FieldLabel optional><Building2 className="w-3 h-3" />Unit / Floor / House No.</FieldLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Unit 4B, 2nd Floor, House 12"
                                            className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                            {...field} />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="address.street" render={({ field }) => (
                                <FormItem>
                                    <FieldLabel>Street Address</FieldLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. 123 Rizal Avenue" autoComplete="address-line1"
                                            className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                            {...field} />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="address.barangay" render={({ field }) => (
                                    <FormItem>
                                        <FieldLabel>Barangay</FieldLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Brgy. San Lorenzo"
                                                className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                                {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="address.city" render={({ field }) => (
                                    <FormItem>
                                        <FieldLabel>City / Municipality</FieldLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Makati City" autoComplete="address-level2"
                                                className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                                {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="address.province" render={({ field }) => (
                                    <FormItem>
                                        <FieldLabel>Province</FieldLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Metro Manila" autoComplete="address-level1"
                                                className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                                {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="address.zipCode" render={({ field }) => (
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
                                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    </section>

                    {/* ── 4. Delivery Notes ────────────────────────────── */}
                    <section className="p-6 sm:p-8">
                        <SectionHeader icon={FileText} step={4} title="Delivery Instructions"
                            description="Help our riders find you easily." />
                        <FormField control={form.control} name="deliveryNotes" render={({ field }) => (
                            <FormItem>
                                <FieldLabel optional>Landmarks & Delivery Notes</FieldLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="e.g. Brown gate, 3rd house from the corner. Leave at lobby if no answer."
                                        className="bg-transparent text-sm rounded-none border-border/70 resize-none min-h-[100px]"
                                        maxLength={300}
                                        {...field} />
                                </FormControl>
                                <div className="flex items-center justify-between mt-1">
                                    <FormMessage className="text-[10px]" />
                                    <span className="text-[10px] text-muted-foreground ml-auto">
                                        {(field.value ?? "").length}/300
                                    </span>
                                </div>
                            </FormItem>
                        )} />
                    </section>

                    {/* ── 5. Payment ───────────────────────────────────── */}
                    <section className="p-6 sm:p-8">
                        <SectionHeader icon={CreditCard} step={5} title="Payment Method"
                            description="Select your preferred payment channel." />
                        <div className="space-y-4">
                            <Controller
                                control={form.control}
                                name="paymentMethod"
                                render={({ field, fieldState }) => (
                                    <FormItem>
                                        <PaymentMethod
                                            value={field.value as "gcash" | "paymaya" | null}
                                            onChange={(val) => field.onChange(val)}
                                            error={fieldState.error?.message}
                                        />
                                    </FormItem>
                                )}
                            />

                            {/* Order breakdown */}
                            <div className="border border-border/50 divide-y divide-border/50 text-xs">
                                <div className="px-4 py-3 flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>{phpFormat(subtotal)}</span>
                                </div>
                                <div className="px-4 py-3 flex justify-between text-muted-foreground">
                                    <span>VAT (12%)</span>
                                    <span>{phpFormat(vat)}</span>
                                </div>
                                <div className="px-4 py-3 flex justify-between font-semibold text-foreground">
                                    <span>Order Total</span>
                                    <span>{phpFormat(fullTotal)}</span>
                                </div>
                                <div className="px-4 py-3 flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                                    <span>50% Due Now</span>
                                    <span>{phpFormat(downpaymentTotal)}</span>
                                </div>
                                <div className="px-4 py-3 flex justify-between text-muted-foreground">
                                    <span>Balance on Delivery</span>
                                    <span>{phpFormat(balanceDue)}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-accent/10 border border-border/50">
                                <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    A <span className="font-semibold text-foreground">50% downpayment</span> is
                                    charged now to confirm your order. The remaining{" "}
                                    <span className="font-semibold text-foreground">{phpFormat(balanceDue)}</span>{" "}
                                    balance is due upon delivery.
                                </p>
                            </div>

                            <FormField control={form.control} name="agreeTerms" render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-start gap-3 p-4 border border-border/50">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value === true}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        // Intercept — open the modal instead of checking
                                                        pendingTermsAccept.current = field.onChange
                                                        setTermsModalOpen(true)
                                                    } else {
                                                        // Allow unchecking directly
                                                        field.onChange(undefined)
                                                    }
                                                }}
                                                className="mt-0.5"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-xs font-medium text-foreground cursor-pointer">
                                                I agree to the Terms and Conditions
                                            </FormLabel>
                                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                By placing this order, you confirm that all delivery details are correct.
                                                MJ Decor 888 is not liable for failed deliveries due to incorrect address information.
                                            </p>
                                        </div>
                                    </div>
                                    <FormMessage className="text-[10px] mt-1" />
                                </FormItem>
                            )} />

                            {/* Terms & Conditions modal */}
                            <TermsAndConditionsModal
                                open={termsModalOpen}
                                onConfirm={() => {
                                    pendingTermsAccept.current?.(true)
                                    pendingTermsAccept.current = null
                                    setTermsModalOpen(false)
                                }}
                                onClose={() => {
                                    // Dismissed without confirming — keep unchecked
                                    pendingTermsAccept.current = null
                                    setTermsModalOpen(false)
                                }}
                            />
                        </div>
                    </section>

                    {/* ── Downpayment total preview ─────────────────────── */}
                    <div className="px-6 sm:px-8 py-4 bg-accent/5 border-t border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                                    Downpayment due now
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    50% of order total · incl. VAT (12%)
                                </span>
                            </div>
                            <span className="font-serif text-2xl font-medium text-foreground">
                                {phpFormat(downpaymentTotal)}
                            </span>
                        </div>
                    </div>

                    {/* ── Submit ───────────────────────────────────────── */}
                    <div className="p-6 sm:p-8 bg-accent/5">
                        {isError && (
                            <div className="mb-4 px-4 py-3 border border-destructive/40 bg-destructive/5 text-destructive text-xs leading-relaxed">
                                Payment initialization failed. Please check your details and try again.
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full flex items-center justify-center gap-3 h-14 bg-foreground text-background uppercase tracking-[0.2em] text-xs font-semibold hover:bg-foreground/90 active:scale-[0.995] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                            ) : (
                                <><ChevronRight className="w-4 h-4" strokeWidth={2} />Pay {phpFormat(downpaymentTotal)}</>
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