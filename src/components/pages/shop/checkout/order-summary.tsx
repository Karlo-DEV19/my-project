'use client'

import React from 'react'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'
import type { CartItem } from '@/lib/zustand/use-cart-store'

function php(n: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
    }).format(n)
}

interface OrderSummaryProps {
    items: CartItem[]
}

export const OrderSummary = ({ items }: OrderSummaryProps) => {
    // priceBreakdown.total already includes all panels for that config
    // quantity = how many identical sets (default 1)
    // so lineTotal = priceBreakdown.total × quantity is always correct
    const subtotal = items.reduce(
        (sum, item) => sum + item.order.priceBreakdown.total * item.quantity,
        0
    )
    const vat = subtotal * 0.12
    const finalTotal = subtotal + vat

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
            <div className="px-6 py-5 border-b border-border bg-accent/10">
                <h2 className="font-serif text-xl tracking-wide text-foreground">Order Summary</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                </p>
            </div>

            <div className="flex flex-col p-6 gap-6">
                {items.map((item) => {
                    const { order, quantity, cartItemId } = item

                    // priceBreakdown.total = subTotalPerPanel × panels (full config price)
                    // × quantity = how many identical sets
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

                                        {/* Panels tag */}
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

                                    {/* Price breakdown hint */}
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
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="uppercase tracking-widest font-medium text-muted-foreground">Subtotal</span>
                        <span className="font-medium text-foreground">{php(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="uppercase tracking-widest font-medium text-muted-foreground">VAT (12%)</span>
                        <span className="font-medium text-foreground">{php(vat)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="uppercase tracking-widest font-medium text-muted-foreground">
                            Delivery / Installation
                        </span>
                        <span className="text-muted-foreground">To be quoted</span>
                    </div>
                </div>

                <div className="h-px bg-border/80" />

                <div className="flex items-end justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest font-semibold text-foreground">
                            Total Estimate
                        </span>
                        <span className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">
                            Includes VAT · excl. delivery
                        </span>
                    </div>
                    <span className="font-serif text-3xl font-medium leading-none text-foreground">
                        {php(finalTotal)}
                    </span>
                </div>
            </div>
        </div>
    )
}