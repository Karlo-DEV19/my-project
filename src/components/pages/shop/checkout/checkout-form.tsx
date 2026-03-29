"use client"

import { useCallback } from "react"
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
import { toast } from "sonner"
import { checkoutSchema, type CheckoutFormValues } from "@/lib/zod-schema/checkout.schema"
import type { LocationData } from "@/components/ui/location-picker"
import { useCheckoutOrder, type PaymentMethodType } from "@/app/api/hooks/use-order"
import type { CartItem } from "@/lib/zustand/use-cart-store"
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

interface CheckoutFormProps {
    items: CartItem[]
    clearCart: () => void
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CheckoutForm({ items, clearCart }: CheckoutFormProps) {
    const router = useRouter()
    const { checkoutOrderAsync, isPending, isError } = useCheckoutOrder()

    // ── Compute totals from cart (mirrors OrderSummary exactly) ──────────────
    // priceBreakdown.total = subTotalPerPanel × panels (full config price for the blind)
    // quantity             = number of identical sets the customer wants (default 1)
    const subtotal = items.reduce(
        (sum, item) => sum + item.order.priceBreakdown.total * item.quantity,
        0
    )
    const vat = subtotal * 0.12
    const totalAmount = subtotal + vat

    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            phoneSecondary: "",
            paymentMethod: "gcash",
            agreeTerms: undefined as unknown as true,
            deliveryNotes: "",
            address: {
                unitFloor: "",
                street: "",
                barangay: "",
                city: "",
                province: "",
                zipCode: "",
            },
        },
    })

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

    const onSubmit = async (data: CheckoutFormValues) => {
        if (!data.coordinates?.lat || !data.coordinates?.lng) {
            toast.error("Please pin your delivery location on the map.")
            return
        }
        if (items.length === 0) {
            toast.error("Your cart is empty.", {
                description: "Add items to your cart before checking out.",
            })
            return
        }

        // Map cart items → payload items
        // quantity here = number of identical sets (not panels — panels is in priceBreakdown)
        // The controller will look up unitPrice from the DB and use quantity for its own calc,
        // but we override amount/subtotal/vat/totalAmount so PayMongo charges the cart total
        const orderItems = items.map((cartItem) => ({
            productId: cartItem.order.productId,
            colorId: cartItem.order.selectedColor?.colorId ?? undefined,
            quantity: cartItem.quantity,
        }))

        try {
            const response = await checkoutOrderAsync({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                phoneSecondary: data.phoneSecondary?.trim() || undefined,
                paymentMethod: data.paymentMethod as PaymentMethodType,
                agreeTerms: true,
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
                items: orderItems,
                subtotal,
                vat,
                totalAmount,
            })

            if (response.data?.checkoutUrl) {
                toast.success("Redirecting to payment...", {
                    description: `Order ${response.data.trackingNumber} · ₱${totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
                })
                clearCart()
                await new Promise((r) => setTimeout(r, 800))
                window.location.href = response.data.checkoutUrl
            }
        } catch (error: any) {
            const message =
                error?.response?.data?.message ??
                error?.message ??
                "Something went wrong. Please try again."
            toast.error("Order failed", { description: message })
        }
    }

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
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-col divide-y divide-border/50"
                >
                    {/* ── 1. Contact ───────────────────────────────────── */}
                    <section className="p-6 sm:p-8">
                        <SectionHeader icon={Mail} step={1} title="Contact Information"
                            description="Your receipt and order updates will be sent here." />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FieldLabel>Email Address</FieldLabel>
                                <FormControl>
                                    <Input type="email" placeholder="e.g. juan@example.com"
                                        autoComplete="email"
                                        className="h-11 bg-transparent text-sm rounded-none border-border/70"
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
                                <FormField control={form.control} name="firstName" render={({ field }) => (
                                    <FormItem>
                                        <FieldLabel>First Name</FieldLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Juan" autoComplete="given-name"
                                                className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                                {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="lastName" render={({ field }) => (
                                    <FormItem>
                                        <FieldLabel>Last Name</FieldLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Dela Cruz" autoComplete="family-name"
                                                className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                                {...field} />
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
                                            <Input placeholder="e.g. 1223" inputMode="numeric" maxLength={4}
                                                autoComplete="postal-code"
                                                className="h-11 bg-transparent text-sm rounded-none border-border/70"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} />
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
                            <Controller control={form.control} name="paymentMethod"
                                render={({ field, fieldState }) => (
                                    <FormItem>
                                        <PaymentMethod
                                            value={field.value as "gcash" | "paymaya" | null}
                                            onChange={(val) => field.onChange(val)}
                                            error={fieldState.error?.message}
                                        />
                                    </FormItem>
                                )} />

                            <div className="flex items-start gap-3 p-4 bg-accent/10 border border-border/50">
                                <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    For custom items like blinds, a{" "}
                                    <span className="font-semibold text-foreground">downpayment is required</span>{" "}
                                    to confirm your order and schedule installation. Our team will
                                    contact you with payment instructions.
                                </p>
                            </div>

                            <FormField control={form.control} name="agreeTerms" render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-start gap-3 p-4 border border-border/50">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value === true}
                                                onCheckedChange={(checked) =>
                                                    field.onChange(checked ? true : undefined)
                                                }
                                                className="mt-0.5" />
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
                        </div>
                    </section>

                    {/* ── Order total preview before submit ────────────── */}
                    <div className="px-6 sm:px-8 py-4 bg-accent/5 border-t border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                                    Amount to pay
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    Subtotal + VAT (12%) · excl. delivery
                                </span>
                            </div>
                            <span className="font-serif text-2xl font-medium text-foreground">
                                {new Intl.NumberFormat('en-PH', {
                                    style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
                                }).format(totalAmount)}
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
                        <button type="submit" disabled={isPending}
                            className="w-full flex items-center justify-center gap-3 h-14 bg-foreground text-background uppercase tracking-[0.2em] text-xs font-semibold hover:bg-foreground/90 active:scale-[0.995] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                            ) : (
                                <><ChevronRight className="w-4 h-4" strokeWidth={2} />Place Order</>
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