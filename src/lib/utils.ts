import { BlindProduct } from "@/components/pages/shop/shop-grid-products";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



// ✅ UPDATED DATA: Extracted directly from MJ-DECOR-888-Catalog.pdf
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
    availableColors: ["Red", "Green", "Blue", "Other Color"],
    imageUrls: ["/images/blinds/cherry-blossom-1.jpg"]
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
    availableColors: ["Beige", "Brown", "Choco", "Violet", "Wine"],
    imageUrls: ["/images/blinds/cube-1.jpg"]
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
    availableColors: ["Beige", "Pastel", "Pine", "Brown", "Copper", "Chocolate", "Lime", "Gray", "White", "Cobalt"],
    imageUrls: ["/images/blinds/evergreen-1.jpg"]
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
    availableColors: ["Ivory/Lime", "Pink/Scarlet", "Mint/Blue", "Ivory/Brown", "Gray/Black"],
    imageUrls: ["/images/blinds/phantom-1.jpg"]
  },
  {
    id: "Y-315",
    name: "Rollscreen Blackout",
    code: "Y-315-1 to Y-373-1",
    type: "Rollsreen Blackout",
    composition: "POLYESTER 45% / POLYURETHANE 55%",
    fabricWidth: "210cm/280cm",
    packing: "50m/Roll",
    thickness: "0.30mm",
    characteristic: "Blocks over 80% of ultraviolet rays, it perfectly ensures protect privacy. Fireproof.",
    description: "Blocks over 80% of ultraviolet rays, ensuring perfect privacy and fireproof protection.",
    availableColors: ["White-Silver", "Ivory-Silver", "Beige-Silver", "Green-Silver", "Gray-Silver", "Ivory-Ivory", "Beige-Beige", "Green-Green", "Gray-Gray", "Ivory-Gray", "Blue-Gold"],
    imageUrls: ["/images/blinds/blackout-1.jpg"]
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
    availableColors: ["White", "Beige", "Gray"],
    imageUrls: ["/images/blinds/sunscreen-5-1.jpg"]
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
    availableColors: ["Ivory", "Cherry", "Brown", "Green", "Shiny White", "Shiny Beige", "Shiny Brown"],
    imageUrls: ["/images/blinds/afternoon-delight-1.jpg"]
  }
];