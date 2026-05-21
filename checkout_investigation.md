# Checkout Delivery/Installation — Step 1 Investigation Report

## 1. Where the checkout page lives

| Route | File |
|---|---|
| `/shop/checkout` | [`src/app/(dashboard)/shop/checkout/page.tsx`](file:///c:/Users/karlo/Documents/GitHub/mj-decors/src/app/(dashboard)/shop/checkout/page.tsx) |
| Checkout form | [`src/components/pages/shop/checkout/checkout-form.tsx`](file:///c:/Users/karlo/Documents/GitHub/mj-decors/src/components/pages/shop/checkout/checkout-form.tsx) |
| Order summary sidebar | [`src/components/pages/shop/checkout/order-summary.tsx`](file:///c:/Users/karlo/Documents/GitHub/mj-decors/src/components/pages/shop/checkout/order-summary.tsx) |

---

## 2. Exactly where "DELIVERY / INSTALLATION — To be quoted" is rendered

**File:** `order-summary.tsx` — lines **183–188**

```tsx
<div className="flex items-center justify-between text-xs">
    <span className="uppercase tracking-widest font-medium text-muted-foreground">
        Delivery / Installation
    </span>
    <span className="text-muted-foreground">To be quoted</span>
</div>
```

This is **static, hardcoded JSX** — it receives no prop, no state, and no computed value. It sits inside the "Full Order Value" totals block, just below the VAT row and above the Order Total row.

---

## 3. How subtotal, VAT, order total, downpayment, and amount due are calculated

All financial logic lives in **one pure function** exported from the cart store:

**File:** [`src/lib/zustand/use-cart-store.ts`](file:///c:/Users/karlo/Documents/GitHub/mj-decors/src/lib/zustand/use-cart-store.ts) — lines **199–219**

```ts
export const DOWNPAYMENT_RATE = 0.5   // line 51
export const VAT_RATE         = 0.12  // line 52

export function computeCartTotals(items: CartItem[]) {
    const fullSubtotal = items.reduce(
        (sum, item) => sum + item.order.priceBreakdown.total * item.quantity, 0
    )
    const fullTotal           = fullSubtotal * (1 + VAT_RATE)
    const downpaymentSubtotal = fullSubtotal * DOWNPAYMENT_RATE
    const downpaymentVat      = downpaymentSubtotal * VAT_RATE
    const downpaymentTotal    = downpaymentSubtotal + downpaymentVat

    return { fullSubtotal, fullVat: fullSubtotal * VAT_RATE, fullTotal,
             downpaymentRate: DOWNPAYMENT_RATE, downpaymentSubtotal,
             downpaymentVat, downpaymentTotal }
}
```

- `deliveryFee` is **not part of** `computeCartTotals`. It is entirely absent from this function.
- The checkout page calls `computeCartTotals(items)` via `useMemo` and passes `totals` to both `<OrderSummary>` and `<CheckoutForm>`.

---

## 4. Where delivery address / location data is stored and passed

### Form schema (`src/lib/zod-schema/checkout.schema.ts`)

The checkout Zod schema defines two separate location structures that the form tracks:

```ts
address: z.object({
    unitFloor, street, barangay, city, province, zipCode
})

coordinates: z.object({       // optional in schema; set imperatively via form.setValue
    lat: z.number(),
    lng: z.number(),
    formattedAddress: z.string().optional()
})
```

### How address fields get populated (`checkout-form.tsx` lines 356–374)

The `LocationPicker` component calls `onLocationSelect(location: LocationData)` whenever a map pin is dropped, searched, or GPS is used. This triggers `handleLocationSelect` which calls `form.setValue(...)` for each address sub-field:

```ts
const handleLocationSelect = useCallback((location: LocationData) => {
    form.setValue("coordinates", { lat, lng, formattedAddress: location.address })
    if (c.street)   form.setValue("address.street",   c.street)
    if (c.barangay) form.setValue("address.barangay", c.barangay)
    if (c.city)     form.setValue("address.city",     c.city)
    if (c.province?.trim()) form.setValue("address.province", c.province)
    else if (c.region)      form.setValue("address.province", c.region)
    if (c.zip)      form.setValue("address.zipCode",  c.zip.slice(0, 4))
    if (c.building) form.setValue("address.unitFloor",c.building)
}, [form])
```

### `LocationData` type (`src/app/api/hooks/useGeocode.ts`)

```ts
export interface AddressComponents {
    building?, street?, block?, barangay?,
    city?,     province?, region?, zip?
}
export interface LocationData {
    lat: number; lng: number; address: string
    components?: AddressComponents
}
```

These components come from **Nominatim** (OpenStreetMap reverse geocode). The `city` field maps to: `addr.city || addr.municipality || addr.town || addr.city_district`.

### What is available at submit time

At `onSubmit`, the following location data is fully available on `data`:

| Field | Available? |
|---|---|
| `data.address.city` | ✅ (manually typed or auto-filled from map) |
| `data.address.province` | ✅ (same) |
| `data.address.barangay` | ✅ |
| `data.address.zipCode` | ✅ |
| `data.coordinates.lat` | ✅ (required — blocks submit if missing) |
| `data.coordinates.lng` | ✅ |
| `data.coordinates.formattedAddress` | ✅ (full Nominatim display string) |

> [!IMPORTANT]
> **City, province, coordinates (lat/lng), and the full formatted address are all available in the form's validated `data` object at submit time.** This means a shipping fee lookup function can consume them directly from the form values.

---

## 5. How `deliveryFee` flows through the backend

**File:** `src/app/api/controller/order-controller.ts` — line **380**

```ts
deliveryFee: "0.00",   // Always hardcoded at order creation time
```

The DB schema (`src/schema/orders/orders.ts` line 63–66) confirms the intent:

```ts
deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 })
    .notNull().default("0.00"),
// Always 0.00 at order time — quoted separately after confirmation
```

The field exists in the database and is already read back by `getOrderDetailsStatus`, `getAllOrders`, and the admin `order-details-modal`. The infrastructure to store and display a real fee already exists — it just always receives `"0.00"` today.

---

## 6. Existing utility files checked

| File | What it does | Delivery/shipping logic? |
|---|---|---|
| `use-cart-store.ts` | `computeCartTotals` — subtotal/VAT/downpayment | ❌ No delivery fee |
| `checkout.schema.ts` | Zod schema for form validation | ❌ No delivery fee |
| `useGeocode.ts` | Nominatim reverse/forward geocode | ❌ Pure geocoding |
| `order-controller.ts` | Creates order in DB + PayMongo | ❌ Hardcodes `"0.00"` |
| `src/lib/helpers/` | `crypto.ts`, `sync-user-with-db.ts` | ❌ Unrelated |
| `src/lib/constans/activity-log.ts` | Activity log constants | ❌ Unrelated |

**There is no existing shipping fee matrix, delivery fee calculator, or distance-to-fee utility anywhere in the codebase.**

---

## 7. Summary — Safe implementation path for Step 2

The codebase is clean and well-structured. Here is what Step 2 needs to touch and why:

### Frontend changes (pure additions, no formula changes)

1. **New utility file** — e.g. `src/lib/utils/delivery-fee.ts`
   - Implement the shipping fee matrix (city/province → fee tier lookup).
   - Export a `computeDeliveryFee(city: string, province: string): number | null` function.
   - `null` = "To be quoted" (unknown location or outside matrix).

2. **`order-summary.tsx`** — replace the static `"To be quoted"` span:
   - Accept `deliveryFee: number | null` as a new prop.
   - Render `php(deliveryFee)` when not null, `"To be quoted"` when null.
   - **Do NOT touch** `computeCartTotals`, subtotal, VAT, or downpayment rows — the existing comment in the schema explicitly says delivery is excluded from `totalAmount`.

3. **`checkout/page.tsx`** — derive `deliveryFee` from form watch + fee utility:
   - Use `form.watch(["address.city", "address.province"])` or pass it down via a callback.
   - Pass `deliveryFee` prop to `<OrderSummary>`.

4. **`checkout-form.tsx`** (optional) — show a live fee estimate near the address section.

### Backend changes (only if you want to store the real fee in the DB)

5. **`order-controller.ts` line 380** — replace `"0.00"` with the computed fee from `input.address.city` / `input.address.province`.
   - The address fields are already present in `CheckoutSchema` and saved to the DB — no schema migration needed.
   - `deliveryFee` column already exists in the `orders` table.

### What must NOT change
- `computeCartTotals` — do not add delivery to this function.
- `fullTotal` / `downpaymentTotal` / `balanceAmount` formulas — delivery stays separate per existing design.
- The Zod checkout schema — `deliveryFee` is a server-computed value, never a user input.
- VAT rate, downpayment rate — no touch.
