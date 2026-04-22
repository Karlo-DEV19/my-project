import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
        total: number
        minimumApplied: boolean
    }
}

export interface CartItem {
    cartItemId: string
    quantity: number
    order: BlindOrderFields
}

// 50% downpayment rate — change here to update everywhere
export const DOWNPAYMENT_RATE = 0.5
export const VAT_RATE = 0.12

interface CartState {
    items: CartItem[]
    itemCount: number
    isSheetOpen: boolean
    /** Becomes true after Zustand has rehydrated from localStorage on the client */
    _hydrated: boolean
    /** True when a guest clicked "Checkout" — cleared after login redirect */
    checkoutRedirectPending: boolean
    /** Why the auth modal was opened — used to show contextual messages */
    authModalContext: 'default' | 'checkout'
}

interface CartActions {
    addToCart: (order: BlindOrderFields) => void
    removeFromCart: (cartItemId: string) => void
    updateQuantity: (cartItemId: string, quantity: number) => void
    clearCart: () => void
    toggleCartSheet: () => void
    openCartSheet: () => void
    closeCartSheet: () => void
    setHydrated: () => void
    setCheckoutRedirectPending: (pending: boolean) => void
    setAuthModalContext: (context: 'default' | 'checkout') => void
    /** Registered by Header so CartSheet can open the auth modal without prop drilling */
    _openAuthModal: (() => void) | null
    registerOpenAuthModal: (fn: () => void) => void
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
            // ── State ──────────────────────────────────────────────────────
            items: [],
            itemCount: 0,
            isSheetOpen: false,
            _hydrated: false,
            checkoutRedirectPending: false,
            authModalContext: 'default',
            _openAuthModal: null,

            // ── Actions ────────────────────────────────────────────────────
            setHydrated: () => set({ _hydrated: true }),
            setCheckoutRedirectPending: (pending) => set({ checkoutRedirectPending: pending }),
            setAuthModalContext: (context) => set({ authModalContext: context }),
            registerOpenAuthModal: (fn) => set({ _openAuthModal: fn }),

            addToCart: (order) => {
                const key = buildCartKey(order)
                const existing = get().items.find(i => i.cartItemId === key)

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
            // Use createJSONStorage to be explicit and avoid SSR issues
            storage: createJSONStorage(() => {
                // Safely return localStorage only on the client
                if (typeof window !== 'undefined') return localStorage
                // Return a no-op storage on the server so persist doesn't crash
                return {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                }
            }),
            // Only persist cart data — never persist UI state or _hydrated flag
            partialize: (state) => ({
                items: state.items,
                itemCount: state.itemCount,
            }),
            // Called once rehydration from localStorage is complete
            onRehydrateStorage: () => (state) => {
                if (state) state.setHydrated()
            },
        }
    )
)

// ─── Hydration-safe selector hook ────────────────────────────────────────────
// Use this instead of direct useCartStore(s => s.items) in SSR components
// to avoid hydration mismatches. Returns empty defaults until rehydrated.
export function useHydratedCartStore<T>(
    selector: (state: CartStore) => T,
    fallback: T
): T {
    const _hydrated = useCartStore(s => s._hydrated)
    const value = useCartStore(selector)
    return _hydrated ? value : fallback
}

// ── Derived cart totals (use these everywhere for consistency) ────────────────
export function computeCartTotals(items: CartItem[]) {
    const fullSubtotal = items.reduce(
        (sum, item) => sum + item.order.priceBreakdown.total * item.quantity,
        0
    )
    const fullTotal = fullSubtotal * (1 + VAT_RATE)

    const downpaymentSubtotal = fullSubtotal * DOWNPAYMENT_RATE
    const downpaymentVat = downpaymentSubtotal * VAT_RATE
    const downpaymentTotal = downpaymentSubtotal + downpaymentVat

    return {
        fullSubtotal,
        fullVat: fullSubtotal * VAT_RATE,
        fullTotal,
        downpaymentRate: DOWNPAYMENT_RATE,
        downpaymentSubtotal,
        downpaymentVat,
        downpaymentTotal,
    }
}