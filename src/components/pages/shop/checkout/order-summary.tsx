'use client'

import React from 'react'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'
import type { CartItem } from '@/lib/zustand/use-cart-store'
import { computeCartTotals } from '@/lib/zustand/use-cart-store'

function php(n: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
    }).format(n)
}

interface OrderSummaryProps {
    items: CartItem[]
}

export const OrderSummary = ({ items }: OrderSummaryProps) => {
    const {
        fullSubtotal,
        fullVat,
        fullTotal,
        downpaymentSubtotal,
        downpaymentVat,
        downpaymentTotal,
        downpaymentRate,
    } = computeCartTotals(items)

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-muted/30 border border-border text-center">
                <ShoppingBag className="w-10 h-10 text-muted-foreground mb-4" strokeWidth={1} />
                <h3 className="text-sm font-medium text-foreground">Your cart is empty</h3>
                <p className="text-xs text-muted-foreground mt-2 max-w-[250px]">
                    Looks like you haven't added any items to your cart yet.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col border border-border bg-background">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border bg-accent/10">
                <h2 className="font-serif text-xl tracking-wide text-foreground">Order Summary</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                </p>
            </div>

            {/* Items */}
            <div className="flex flex-col p-6 gap-6">
                {items.map((item) => {
                    const { order, quantity, cartItemId } = item
                    const lineTotal = order.priceBreakdown.total * quantity

                    return (
                        <div key={cartItemId} className="flex gap-4">
                            {/* Product image */}
                            <div className="relative w-20 h-24 shrink-0 bg-muted border border-border overflow-hidden">
                                {order.productImage ? (
                                    <Image
                                        src={order.productImage}
                                        alt={order.productName}
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                                        <ShoppingBag className="w-6 h-6" strokeWidth={1} />
                                    </div>
                                )}
                            </div>

                            {/* Product details */}
                            <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium truncate">
                                        {order.productCode}
                                    </span>
                                    <h4 className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                                        {order.productName}
                                    </h4>

                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground border border-border/60 px-1.5 py-0.5 leading-none bg-accent/20">
                                            {order.widthCm} × {order.heightCm} cm
                                        </span>
                                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground border border-border/60 px-1.5 py-0.5 leading-none bg-accent/20">
                                            {order.panels} {order.panels === 1 ? 'panel' : 'panels'}
                                        </span>
                                        {order.selectedColor && (
                                            <span className="text-[9px] uppercase tracking-widest text-muted-foreground border border-border/60 px-1.5 py-0.5 leading-none bg-accent/20 flex items-center gap-1.5">
                                                <span className="relative w-3.5 h-3.5 overflow-hidden rounded-full border border-border/50 shrink-0">
                                                    <Image
                                                        src={order.selectedColor.imageUrl}
                                                        alt={order.selectedColor.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="14px"
                                                    />
                                                </span>
                                                {order.selectedColor.name}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                                        {php(order.priceBreakdown.unitPrice)}/sq·ft
                                        {' · '}
                                        {order.priceBreakdown.chargeableSqFt.toFixed(2)} sq·ft
                                        {' · '}
                                        {order.panels} {order.panels === 1 ? 'panel' : 'panels'}
                                        {order.priceBreakdown.minimumApplied && (
                                            <span className="ml-1 text-amber-600">(min. applied)</span>
                                        )}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-xs text-muted-foreground">
                                        {quantity > 1 ? `× ${quantity} sets` : `1 set`}
                                    </span>
                                    <span className="text-sm font-medium text-foreground font-serif">
                                        {php(lineTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Totals */}
            <div className="px-6 py-5 bg-accent/5 border-t border-border flex flex-col gap-4">

                {/* Full order breakdown */}
                <div className="flex flex-col gap-2.5">
                    <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/70">
                        Full Order Value
                    </p>
                    <div className="flex items-center justify-between text-xs">
                        <span className="uppercase tracking-widest font-medium text-muted-foreground">Subtotal</span>
                        <span className="font-medium text-foreground">{php(fullSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="uppercase tracking-widest font-medium text-muted-foreground">VAT (12%)</span>
                        <span className="font-medium text-foreground">{php(fullVat)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="uppercase tracking-widest font-medium text-muted-foreground">
                            Delivery / Installation
                        </span>
                        <span className="text-muted-foreground">To be quoted</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-border/50 pt-2.5">
                        <span className="uppercase tracking-widest font-semibold text-muted-foreground">Order Total</span>
                        <span className="font-semibold text-foreground line-through decoration-muted-foreground/40">
                            {php(fullTotal)}
                        </span>
                    </div>
                </div>

                <div className="h-px bg-border/80" />

                {/* Downpayment section */}
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                        <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/70">
                            Downpayment Due Now
                        </p>
                        <span className="text-[9px] uppercase tracking-[0.15em] font-semibold px-1.5 py-0.5 bg-foreground text-background">
                            {downpaymentRate * 100}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="uppercase tracking-widest font-medium text-muted-foreground">
                            50% Subtotal
                        </span>
                        <span className="font-medium text-foreground">{php(downpaymentSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="uppercase tracking-widest font-medium text-muted-foreground">
                            VAT (12%)
                        </span>
                        <span className="font-medium text-foreground">{php(downpaymentVat)}</span>
                    </div>
                </div>

                <div className="h-px bg-border/80" />

                {/* Amount due */}
                <div className="flex items-end justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest font-semibold text-foreground">
                            Amount Due Now
                        </span>
                        <span className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">
                            50% downpayment · incl. VAT
                        </span>
                    </div>
                    <span className="font-serif text-3xl font-medium leading-none text-foreground">
                        {php(downpaymentTotal)}
                    </span>
                </div>

                <p className="text-[10px] text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                    The remaining <span className="font-medium text-foreground">{php(fullTotal - downpaymentTotal)}</span> balance
                    is due upon delivery and installation. Our team will contact you to confirm the schedule.
                </p>
            </div>
        </div>
    )
}