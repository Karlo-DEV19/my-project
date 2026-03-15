'use client';

import React from 'react';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/zustand/use-cart-store';

function php(n: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
    }).format(n);
}

export const OrderSummary = () => {
    const { items } = useCartStore();

    const grandTotal = items.reduce(
        (sum, item) => sum + item.order.priceBreakdown.total * item.quantity,
        0
    );

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-muted/30 border border-border text-center">
                <ShoppingBag className="w-10 h-10 text-muted-foreground mb-4" strokeWidth={1} />
                <h3 className="text-sm font-medium text-foreground">Your cart is empty</h3>
                <p className="text-xs text-muted-foreground mt-2 max-w-[250px]">
                    Looks like you haven't added any items to your cart yet.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col border border-border bg-background">
            <div className="px-6 py-5 border-b border-border bg-accent/10">
                <h2 className="font-serif text-xl tracking-wide text-foreground">Order Summary</h2>
            </div>

            <div className="flex flex-col p-6 gap-6">
                {items.map((item) => {
                    const { order, quantity, cartItemId } = item;
                    const lineTotal = order.priceBreakdown.total * quantity;

                    return (
                        <div key={cartItemId} className="flex gap-4 group">
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

                            <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium truncate">
                                        {order.productCode}
                                    </span>
                                    <h4 className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                                        {order.productName}
                                    </h4>

                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        {[
                                            `${order.widthCm} × ${order.heightCm} cm`,
                                            order.selectedColor ? (
                                                <span className="flex items-center gap-1.5" key="color">
                                                    <span className="relative w-3.5 h-3.5 overflow-hidden rounded-full border border-border/50 shrink-0">
                                                        <Image src={order.selectedColor.imageUrl} alt={order.selectedColor.name} fill className="object-cover" sizes="14px" />
                                                    </span>
                                                    {order.selectedColor.name}
                                                </span>
                                            ) : null,
                                        ]
                                            .filter(Boolean)
                                            .map((tag, i) => (
                                                <span
                                                    key={i}
                                                    className="text-[9px] uppercase tracking-widest text-muted-foreground border border-border/60 px-1.5 py-0.5 leading-none bg-accent/20 flex items-center"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-xs text-muted-foreground">Qty: {quantity}</span>
                                    <span className="text-sm font-medium text-foreground font-serif">
                                        {php(lineTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="px-6 py-5 bg-accent/5 border-t border-border flex flex-col gap-4">
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="uppercase tracking-widest font-medium">Subtotal</span>
                        <span className="font-medium text-foreground">{php(grandTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="uppercase tracking-widest font-medium">Installation & Delivery</span>
                        <span>To be quoted</span>
                    </div>
                </div>

                <div className="h-px bg-border my-1" />

                <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest font-semibold text-foreground">
                        Total Estimate
                    </span>
                    <span className="font-serif text-2xl font-medium text-foreground">
                        {php(grandTotal)}
                    </span>
                </div>
            </div>
        </div>
    );
};