import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlindColor {
  name: string;
  image: string;
}

export interface BlindProduct {
  id: string;
  name: string;
  code: string;
  type: string;
  composition: string;
  fabricWidth: string;
  packing: string;
  thickness: string;
  characteristic: string;
  description: string;
  availableColors: BlindColor[];
  imageUrls: string[];
  /**
   * Unit price per sq/ft in PHP — used in the live price calculator.
   * Formula (from Quotation Template xlsx):
   *   sqFt       = (W_cm / 100) × (H_cm / 100) × 10.76
   *   chargeableSqFt = MAX(sqFt, 10)          ← minimum 10 sq/ft
   *   subTotal   = pricePerSqFt × chargeableSqFt
   *   total      = subTotal × panels
   */
  pricePerSqFt: number;
}

// ─── Product Catalog ──────────────────────────────────────────────────────────
// Unit prices (pricePerSqFt) are set per product type.
// The sample in the xlsx uses code "saranghe" at ₱120/sq·ft.
// Prices are differentiated by fabric tier and type.

export const blindsProducts: BlindProduct[] = [
  {
    id: "CB-43",
    name: "Cherry Blossom",
    code: "CB 43",
    type: "Combi Shades",
    composition: "POLYESTER 100%",
    fabricWidth: "250cm",
    packing: "50m/Roll",
    thickness: "0.3mm",
    characteristic: "With flower design",
    description: "Premium Combi Shade featuring an elegant flower design.",
    pricePerSqFt: 120,
    availableColors: [
      { name: "Red", image: "/images/blinds/colors/cb-43-red.jpg" },
      { name: "Green", image: "/images/blinds/colors/cb-43-green.jpg" },
      { name: "Blue", image: "/images/blinds/colors/cb-43-blue.jpg" },
      { name: "Other Color", image: "/images/blinds/colors/cb-43-other.jpg" },
    ],
    imageUrls: ["/images/blinds/cherry-blossom-1.jpg"],
  },
  {
    id: "C-101",
    name: "CUBE",
    code: "C 101 - C 105",
    type: "Combi Shades",
    composition: "POLYESTER 100%",
    fabricWidth: "280cm",
    packing: "50m/Roll",
    thickness: "0.54mm",
    characteristic: "Standard Block",
    description: "Modern block-style Combi Shade for contemporary spaces.",
    pricePerSqFt: 120,
    availableColors: [
      { name: "Beige", image: "/images/blinds/colors/c-101-beige.jpg" },
      { name: "Brown", image: "/images/blinds/colors/c-101-brown.jpg" },
      { name: "Choco", image: "/images/blinds/colors/c-101-choco.jpg" },
      { name: "Violet", image: "/images/blinds/colors/c-101-violet.jpg" },
      { name: "Wine", image: "/images/blinds/colors/c-101-wine.jpg" },
    ],
    imageUrls: ["/images/blinds/cube-1.jpg"],
  },
  {
    id: "EG-001",
    name: "Evergreen",
    code: "EG 001 - EG 013",
    type: "Combi Shades",
    composition: "POLYESTER 100%",
    fabricWidth: "280cm",
    packing: "50m/Roll",
    thickness: "Solid: 0.45mm Mesh: 0.16mm",
    characteristic: "Woodlook effect.",
    description: "Beautiful Combi Shade featuring a natural woodlook effect.",
    pricePerSqFt: 130,
    availableColors: [
      { name: "Beige", image: "/images/blinds/colors/eg-001-beige.jpg" },
      { name: "Pastel", image: "/images/blinds/colors/eg-001-pastel.jpg" },
      { name: "Pine", image: "/images/blinds/colors/eg-001-pine.jpg" },
      { name: "Brown", image: "/images/blinds/colors/eg-001-brown.jpg" },
      { name: "Copper", image: "/images/blinds/colors/eg-001-copper.jpg" },
      { name: "Chocolate", image: "/images/blinds/colors/eg-001-chocolate.jpg" },
      { name: "Lime", image: "/images/blinds/colors/eg-001-lime.jpg" },
      { name: "Gray", image: "/images/blinds/colors/eg-001-gray.jpg" },
      { name: "White", image: "/images/blinds/colors/eg-001-white.jpg" },
      { name: "Cobalt", image: "/images/blinds/colors/eg-001-cobalt.jpg" },
    ],
    imageUrls: ["/images/blinds/evergreen-1.jpg"],
  },
  {
    id: "PT-001",
    name: "Phantom",
    code: "PT 001 - PT 005",
    type: "Open Roman/Triple Shades",
    composition: "POLYESTER 100%",
    fabricWidth: "280cm",
    packing: "50m/Roll",
    thickness: "Solid: 0.52mm Mesh: 0.19mm",
    characteristic: "Tri-color combination effect, Wood look zebra design",
    description: "Tri-color combination effect with a wood look zebra design.",
    pricePerSqFt: 150,
    availableColors: [
      { name: "Ivory/Lime", image: "/images/blinds/colors/pt-001-ivory-lime.jpg" },
      { name: "Pink/Scarlet", image: "/images/blinds/colors/pt-001-pink-scarlet.jpg" },
      { name: "Mint/Blue", image: "/images/blinds/colors/pt-001-mint-blue.jpg" },
      { name: "Ivory/Brown", image: "/images/blinds/colors/pt-001-ivory-brown.jpg" },
      { name: "Gray/Black", image: "/images/blinds/colors/pt-001-gray-black.jpg" },
    ],
    imageUrls: ["/images/blinds/phantom-1.jpg"],
  },
  {
    id: "Y-315",
    name: "Rollscreen Blackout",
    code: "Y-315-1 to Y-373-1",
    type: "Rollscreen Blackout",
    composition: "POLYESTER 45% / POLYURETHANE 55%",
    fabricWidth: "210cm/280cm",
    packing: "50m/Roll",
    thickness: "0.30mm",
    characteristic: "Blocks over 80% of ultraviolet rays, it perfectly ensures protect privacy. Fireproof.",
    description: "Blocks over 80% of ultraviolet rays, ensuring perfect privacy and fireproof protection.",
    pricePerSqFt: 110,
    availableColors: [
      { name: "White-Silver", image: "/images/blinds/colors/y-315-white-silver.jpg" },
      { name: "Ivory-Silver", image: "/images/blinds/colors/y-315-ivory-silver.jpg" },
      { name: "Beige-Silver", image: "/images/blinds/colors/y-315-beige-silver.jpg" },
      { name: "Green-Silver", image: "/images/blinds/colors/y-315-green-silver.jpg" },
      { name: "Gray-Silver", image: "/images/blinds/colors/y-315-gray-silver.jpg" },
      { name: "Ivory-Ivory", image: "/images/blinds/colors/y-315-ivory-ivory.jpg" },
      { name: "Beige-Beige", image: "/images/blinds/colors/y-315-beige-beige.jpg" },
      { name: "Green-Green", image: "/images/blinds/colors/y-315-green-green.jpg" },
      { name: "Gray-Gray", image: "/images/blinds/colors/y-315-gray-gray.jpg" },
      { name: "Ivory-Gray", image: "/images/blinds/colors/y-315-ivory-gray.jpg" },
      { name: "Blue-Gold", image: "/images/blinds/colors/y-315-blue-gold.jpg" },
    ],
    imageUrls: ["/images/blinds/blackout-1.jpg"],
  },
  {
    id: "Y-366",
    name: "Sunscreen 5%",
    code: "Y-366-1 to Y-368-1",
    type: "Sunscreen",
    composition: "POLYESTER 25% / PVC 75%",
    fabricWidth: "200cm/250cm",
    packing: "30m/Roll",
    thickness: "0.67mm",
    characteristic: "Sunscreen",
    description: "Durable 5% openness sunscreen fabric weighing 445g/sqm.",
    pricePerSqFt: 115,
    availableColors: [
      { name: "White", image: "/images/blinds/colors/y-366-white.jpg" },
      { name: "Beige", image: "/images/blinds/colors/y-366-beige.jpg" },
      { name: "Gray", image: "/images/blinds/colors/y-366-gray.jpg" },
    ],
    imageUrls: ["/images/blinds/sunscreen-5-1.jpg"],
  },
  {
    id: "AD-800",
    name: "Afternoon Delight",
    code: "AD 800 - AD 807",
    type: "Triple Shades (Open Roman)",
    composition: "POLYESTER 100%",
    fabricWidth: "260cm",
    packing: "30m/Roll",
    thickness: "0.38mm",
    characteristic: "Premium open roman style",
    description: "Elegant Triple Shades providing an open roman structural look.",
    pricePerSqFt: 145,
    availableColors: [
      { name: "Ivory", image: "/images/blinds/colors/ad-800-ivory.jpg" },
      { name: "Cherry", image: "/images/blinds/colors/ad-800-cherry.jpg" },
      { name: "Brown", image: "/images/blinds/colors/ad-800-brown.jpg" },
      { name: "Green", image: "/images/blinds/colors/ad-800-green.jpg" },
      { name: "Shiny White", image: "/images/blinds/colors/ad-800-shiny-white.jpg" },
      { name: "Shiny Beige", image: "/images/blinds/colors/ad-800-shiny-beige.jpg" },
      { name: "Shiny Brown", image: "/images/blinds/colors/ad-800-shiny-brown.jpg" },
    ],
    imageUrls: ["/images/blinds/afternoon-delight-1.jpg"],
  },
];