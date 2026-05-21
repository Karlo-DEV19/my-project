'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from '@/components/ui/sheet';
import { CartItem, useCartStore } from '@/lib/zustand/use-cart-store';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function php(n: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
    }).format(n);
}

/** Returns a short discount label, e.g. "50% OFF" or "₱45 OFF" */
function promoLabel(discountType: 'percentage' | 'fixed', discountValue: number): string {
    return discountType === 'percentage'
        ? `${discountValue}% OFF`
        : `₱${discountValue.toLocaleString()} OFF`;
}

// ─── Single cart line ─────────────────────────────────────────────────────────

const RelativeImage = ({ url, name }: { url: string; name: string }) => (
    <span className="relative w-3.5 h-3.5 overflow-hidden rounded-full border border-border/50 shrink-0">
        <Image src={url} alt={name} fill className="object-cover" sizes="14px" />
    </span>
);

const CartLineItem = React.memo(({ item }: { item: CartItem }) => {
    const { removeFromCart, updateQuantity } = useCartStore();
    const { order, quantity, cartItemId } = item;
    const { priceBreakdown: pb } = order;

    // Promo detection — safe for legacy items without promo fields
    const hasActivePromo =
        pb.enablePromo === true &&
        !!pb.discountType &&
        pb.discountValue != null &&
        pb.discountValue > 0 &&
        pb.unitPrice !== pb.regularUnitPrice;

    const lineTotal = pb.total * quantity;

    return (
        <div className="flex gap-4 py-5 border-b border-border last:border-0 group">
            {/* Product image */}
            <div className="relative w-16 h-20 shrink-0 bg-muted border border-border overflow-hidden">
                {order.productImage ? (
                    <Image
                        src={order.productImage}
                        alt={order.productName}
                        fill
                        className="object-cover"
                        sizes="64px"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                        <ShoppingBag className="w-5 h-5" strokeWidth={1} />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium truncate">
                            {order.productCode} · {order.branch.toUpperCase()}
                        </span>
                        <h4 className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                            {order.productName}
                        </h4>
                    </div>
                    <button
                        onClick={() => removeFromCart(cartItemId)}
                        className="shrink-0 w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Remove item"
                    >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Config pills */}
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {[
                        `${order.widthCm} × ${order.heightCm} cm`,
                        order.selectedColor ? (
                            <span className="flex items-center gap-1.5">
                                <RelativeImage url={order.selectedColor.imageUrl} name={order.selectedColor.name} />
                                {order.selectedColor.name}
                            </span>
                        ) : null,
                        order.mountingType,
                        order.controlType,
                    ]
                        .filter(Boolean)
                        .map((tag, i) => (
                            <span
                                key={i}
                                className="text-[9px] uppercase tracking-widest text-muted-foreground border border-border/60 px-1.5 py-0.5 leading-none flex items-center"
                            >
                                {tag}
                            </span>
                        ))}
                </div>

                {/* Promo badge */}
                {hasActivePromo && pb.discountType && pb.discountValue != null && (
                    <span className="self-start inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 bg-rose-600 text-white leading-none">
                        <Tag className="w-2 h-2" strokeWidth={2} />
                        {promoLabel(pb.discountType, pb.discountValue)}
                    </span>
                )}

                {/* Unit price info line */}
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {hasActivePromo ? (
                        <>
                            <span className="line-through">{php(pb.regularUnitPrice)}</span>
                            {' '}
                            <span className="text-rose-600 font-medium">{php(pb.unitPrice)}</span>
                        </>
                    ) : (
                        php(pb.unitPrice)
                    )}
                    {'/sq·ft · '}
                    {pb.chargeableSqFt.toFixed(2)} sq·ft
                    {' · '}
                    {order.panels} {order.panels === 1 ? 'panel' : 'panels'}
                    {pb.minimumApplied && (
                        <span className="ml-1 text-amber-600">(min. applied)</span>
                    )}
                </p>

                {/* Quantity + Price row */}
                <div className="flex items-center justify-between mt-1">
                    {/* Quantity stepper */}
                    <div className="flex items-center border border-border h-7">
                        <button
                            onClick={() => updateQuantity(cartItemId, quantity - 1)}
                            className="w-7 h-full flex items-center justify-center text-foreground hover:bg-accent transition-colors"
                            aria-label="Decrease"
                        >
                            <Minus className="w-2.5 h-2.5" strokeWidth={2} />
                        </button>
                        <span className="w-8 text-center text-xs font-medium text-foreground select-none">
                            {quantity}
                        </span>
                        <button
                            onClick={() => updateQuantity(cartItemId, quantity + 1)}
                            className="w-7 h-full flex items-center justify-center text-foreground hover:bg-accent transition-colors"
                            aria-label="Increase"
                        >
                            <Plus className="w-2.5 h-2.5" strokeWidth={2} />
                        </button>
                    </div>

                    {/* Line total */}
                    <span className={`text-sm font-medium font-serif ${hasActivePromo ? 'text-rose-600' : 'text-foreground'}`}>
                        {php(lineTotal)}
                    </span>
                </div>
            </div>
        </div>
    );
});

CartLineItem.displayName = 'CartLineItem';

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyCart = () => (
    <div className="flex flex-col items-center justify-center flex-1 gap-5 py-16 text-center px-6">
        <div className="w-16 h-16 border border-border flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-muted-foreground" strokeWidth={1} />
        </div>
        <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Your cart is empty</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                Configure a blind from our collection and add it here.
            </p>
        </div>
    </div>
);

// ─── Cart Sheet ───────────────────────────────────────────────────────────────

const CartSheet = () => {
    const { items, isSheetOpen, closeCartSheet, clearCart, itemCount, _openAuthModal, setAuthModalContext } = useCartStore();
    const router = useRouter();

    const grandTotal = items.reduce(
        (sum, item) => sum + item.order.priceBreakdown.total * item.quantity,
        0
    );

    const handleOpenChange = useCallback((open: boolean) => {
        if (!open) closeCartSheet();
    }, [closeCartSheet]);

    // ── Auth-aware checkout ────────────────────────────────────────
    const handleCheckout = useCallback(async () => {
        // Use Supabase session directly — avoids localStorage timing race:
        // localStorage.user is written asynchronously by the Header on mount,
        // so checking it synchronously always returns null on first load,
        // causing the cart to close silently with nothing happening.
        // getSession() reads from the Supabase client's in-memory cache and
        // is reliable regardless of when Header finishes its async init.
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            // Guest: preserve redirect intent, close cart, open auth modal
            try { localStorage.setItem('redirectAfterLogin', '/shop/checkout'); } catch { /* noop */ }
            setAuthModalContext('checkout');
            closeCartSheet();
            // _openAuthModal is registered by LoginButton (in Header) on mount.
            // By the time a user can interact with the cart, Header is long mounted.
            _openAuthModal?.();
            return;
        }

        // Authenticated: navigate to checkout page
        closeCartSheet();
        router.push('/shop/checkout');
    }, [_openAuthModal, closeCartSheet, router, setAuthModalContext]);

    return (
        <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:w-[420px] p-0 flex flex-col bg-background border-l border-border gap-0"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <SheetTitle className="font-serif text-lg tracking-wide text-foreground">
                            Cart
                        </SheetTitle>
                        {itemCount > 0 && (
                            <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground border border-border px-2 py-0.5">
                                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {items.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 hover:bg-accent"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                </div>

                {/* Items list */}
                <div className="flex-1 overflow-y-auto px-6">
                    {items.length === 0 ? (
                        <EmptyCart />
                    ) : (
                        <div className="py-2">
                            {items.map(item => (
                                <CartLineItem key={item.cartItemId} item={item} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer — only shown when cart has items */}
                {items.length > 0 && (
                    <div className="shrink-0 border-t border-border px-6 py-5 flex flex-col gap-4 bg-background">
                        {/* Summary rows */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="uppercase tracking-widest font-medium">Subtotal</span>
                                <span className="font-medium text-foreground">{php(grandTotal)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="uppercase tracking-widest font-medium">Installation</span>
                                <span>To be quoted</span>
                            </div>
                        </div>

                        <div className="h-px bg-border" />

                        {/* Grand total */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest font-semibold text-foreground">
                                Total Estimate
                            </span>
                            <span className="font-serif text-xl font-medium text-foreground">
                                {php(grandTotal)}
                            </span>
                        </div>

                        {/* CTA */}
                        <button
                            onClick={handleCheckout}
                            className="flex items-center justify-center gap-2 h-12 w-full bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:bg-foreground/90 transition-colors"
                        >
                            Checkout Order
                            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default CartSheet;