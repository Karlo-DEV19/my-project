import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItemColor {
    colorId: string
    name: string
    imageUrl: string
}

export interface BlindOrderFields {
    productId: string
    productName: string
    productCode: string
    productImage?: string
    selectedColor?: CartItemColor
    widthCm: number
    heightCm: number
    panels: number
    mountingType: string
    controlSide: string
    controlType: string
    notes?: string
    branch: string
    priceBreakdown: {
        widthCm: number
        heightCm: number
        sqFt: number
        chargeableSqFt: number
        unitPrice: number
        subTotalPerPanel: number
        panels: number
        total: number           // subTotalPerPanel × panels — already the full config price
        minimumApplied: boolean
    }
}

export interface CartItem {
    cartItemId: string
    quantity: number            // how many sets of this exact configuration (default 1)
    order: BlindOrderFields
}

interface CartState {
    items: CartItem[]
    itemCount: number
    isSheetOpen: boolean
}

interface CartActions {
    addToCart: (order: BlindOrderFields) => void
    removeFromCart: (cartItemId: string) => void
    updateQuantity: (cartItemId: string, quantity: number) => void
    clearCart: () => void
    toggleCartSheet: () => void
    openCartSheet: () => void
    closeCartSheet: () => void
}

type CartStore = CartState & CartActions

function buildCartKey(order: BlindOrderFields): string {
    return [
        order.productId,
        order.selectedColor?.colorId ?? 'no-color',
        order.widthCm,
        order.heightCm,
        order.panels,
        order.mountingType,
        order.controlSide,
        order.controlType,
        order.branch,
    ].join('|')
}

function deriveCount(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity, 0)
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            itemCount: 0,
            isSheetOpen: false,

            addToCart: (order) => {
                const key = buildCartKey(order)
                const existing = get().items.find(i => i.cartItemId === key)

                // quantity = number of identical sets the customer wants
                // starts at 1, not order.panels (panels is already baked into priceBreakdown.total)
                const nextItems: CartItem[] = existing
                    ? get().items.map(i =>
                        i.cartItemId === key
                            ? { ...i, quantity: i.quantity + 1 }
                            : i
                    )
                    : [...get().items, { cartItemId: key, quantity: 1, order }]

                set({
                    items: nextItems,
                    itemCount: deriveCount(nextItems),
                    isSheetOpen: true,
                })
            },

            removeFromCart: (cartItemId) => {
                const nextItems = get().items.filter(i => i.cartItemId !== cartItemId)
                set({ items: nextItems, itemCount: deriveCount(nextItems) })
            },

            updateQuantity: (cartItemId, quantity) => {
                if (quantity < 1) {
                    get().removeFromCart(cartItemId)
                    return
                }
                const nextItems = get().items.map(i =>
                    i.cartItemId === cartItemId ? { ...i, quantity } : i
                )
                set({ items: nextItems, itemCount: deriveCount(nextItems) })
            },

            clearCart: () => set({ items: [], itemCount: 0 }),
            toggleCartSheet: () => set(s => ({ isSheetOpen: !s.isSheetOpen })),
            openCartSheet: () => set({ isSheetOpen: true }),
            closeCartSheet: () => set({ isSheetOpen: false }),
        }),
        {
            name: 'mj-decor-cart',
            partialize: (state) => ({ items: state.items, itemCount: state.itemCount }),
        }
    )
)