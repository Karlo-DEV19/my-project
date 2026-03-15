import { BlindOrderFields } from '@/components/pages/shop/shop-product-details-view';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Cart Item ────────────────────────────────────────────────────────────────

export interface CartItem {
    /** Unique cart line ID — distinct from productId so same product + different config = separate lines */
    cartItemId: string;
    quantity: number;
    order: BlindOrderFields;
}

// ─── Store Shape ──────────────────────────────────────────────────────────────

interface CartState {
    items: CartItem[];
    itemCount: number;
    isSheetOpen: boolean;
}

interface CartActions {
    addToCart: (order: BlindOrderFields) => void;
    removeFromCart: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    clearCart: () => void;
    toggleCartSheet: () => void;
    openCartSheet: () => void;
    closeCartSheet: () => void;
}

type CartStore = CartState & CartActions;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generates a stable key for a given order configuration.
 * Two orders with the same product + color + size + config map to the same key,
 * so "add again" increments quantity instead of creating a duplicate.
 */
function buildCartKey(order: BlindOrderFields): string {
    return [
        order.productId,
        order.selectedColor?.name ?? '',
        order.widthCm,
        order.heightCm,
        order.panels,
        order.mountingType,
        order.controlSide,
        order.controlType,
        order.branch,
    ].join('|');
}

function deriveCount(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity, 0);
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            // ── State
            items: [],
            itemCount: 0,
            isSheetOpen: false,

            // ── Actions
            addToCart: (order) => {
                const key = buildCartKey(order);
                const existing = get().items.find(i => i.cartItemId === key);

                let nextItems: CartItem[];

                if (existing) {
                    // Same configuration — increment quantity
                    nextItems = get().items.map(i =>
                        i.cartItemId === key
                            ? { ...i, quantity: i.quantity + order.panels }
                            : i
                    );
                } else {
                    const newItem: CartItem = {
                        cartItemId: key,
                        quantity: order.panels,
                        order,
                    };
                    nextItems = [...get().items, newItem];
                }

                set({
                    items: nextItems,
                    itemCount: deriveCount(nextItems),
                    isSheetOpen: true,
                });
            },

            removeFromCart: (cartItemId) => {
                const nextItems = get().items.filter(i => i.cartItemId !== cartItemId);
                set({ items: nextItems, itemCount: deriveCount(nextItems) });
            },

            updateQuantity: (cartItemId, quantity) => {
                if (quantity < 1) {
                    get().removeFromCart(cartItemId);
                    return;
                }
                const nextItems = get().items.map(i =>
                    i.cartItemId === cartItemId ? { ...i, quantity } : i
                );
                set({ items: nextItems, itemCount: deriveCount(nextItems) });
            },

            clearCart: () => set({ items: [], itemCount: 0 }),

            toggleCartSheet: () => set(s => ({ isSheetOpen: !s.isSheetOpen })),
            openCartSheet: () => set({ isSheetOpen: true }),
            closeCartSheet: () => set({ isSheetOpen: false }),
        }),
        {
            name: 'mj-decor-cart',
            // Only persist items — sheet state resets on refresh
            partialize: (state) => ({ items: state.items, itemCount: state.itemCount }),
        }
    )
);