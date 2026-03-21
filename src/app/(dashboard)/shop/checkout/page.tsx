"use client"
import { CheckoutForm } from '@/components/pages/shop/checkout/checkout-form'
import { OrderSummary } from '@/components/pages/shop/checkout/order-summary'

const CheckoutPage = () => {
    return (
        <div className="min-h-screen bg-accent/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">

                <div className="mb-10 flex flex-col gap-2">
                    <h1 className="font-serif text-3xl md:text-4xl tracking-wide text-foreground">Checkout</h1>
                    <p className="text-sm text-muted-foreground">Complete your order details below.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

                    {/* Left Column - Order Summary - Sticky on Desktop */}
                    <div className="w-full lg:w-[45%] xl:w-[40%] flex-shrink-0 lg:sticky lg:top-24 order-2 lg:order-1">
                        <OrderSummary />
                    </div>

                    {/* Right Column - Checkout Form */}
                    <div className="flex-1 w-full order-1 lg:order-2">
                        <CheckoutForm />
                    </div>

                </div>
            </div>
        </div>
    )
}

export default CheckoutPage