"use client"

import { useMemo } from "react"
import { CheckoutForm } from '@/components/pages/shop/checkout/checkout-form'
import { OrderSummary } from '@/components/pages/shop/checkout/order-summary'
import { useCartStore } from '@/lib/zustand/use-cart-store'
import { computeCartTotals } from '@/lib/zustand/use-cart-store'

// Hydration-safe: useCartStore with selector runs on client only after persist rehydrates.
// We render a stable skeleton on the server (items=[]) and let the client fill it in.
// No useState+useEffect isMounted pattern needed — Zustand's persist handles this
// transparently as long as we don't conditionally return null (which causes layout shift).

const CheckoutPage = () => {
    const items = useCartStore((s) => s.items)
    const clearCart = useCartStore((s) => s.clearCart)

    // Compute downpayment totals — what PayMongo actually charges (50% of full total)
    const totals = useMemo(() => computeCartTotals(items), [items])

    return (
        <div className="min-h-screen bg-accent/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">

                <div className="mb-10 flex flex-col gap-2">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-medium">
                        MJ Decor 888
                    </p>
                    <h1 className="font-serif text-3xl md:text-4xl tracking-wide text-foreground">
                        Checkout
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        A <span className="font-medium text-foreground">50% downpayment</span> is required to confirm your order.
                        The balance is collected upon delivery and installation.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

                    {/* Order Summary — sticky on desktop, shown first on mobile */}
                    <div className="w-full lg:w-[45%] xl:w-[40%] flex-shrink-0 lg:sticky lg:top-24 order-1 lg:order-2">
                        <OrderSummary items={items} />
                    </div>

                    {/* Checkout Form */}
                    <div className="flex-1 w-full order-2 lg:order-1">
                        <CheckoutForm
                            items={items}
                            clearCart={clearCart}
                            totals={totals}
                        />
                    </div>

                </div>
            </div>
        </div>
    )
}

export default CheckoutPage