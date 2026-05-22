/**
 * Delivery Fee Helper – Step 2A + 2B + 2C + 4
 *
 * Step 2A: Metro Manila free-shipping detection.
 * Step 2B: Fixed delivery fees for Rizal and Bulacan.
 * Step 2C: Fixed delivery fees for Laguna and Cavite.
 * Step 4:  Fixed delivery fees for Batangas, Pampanga, Tarlac, and Quezon Province.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DeliveryFeeStatus = "free" | "fixed" | "quoted";

export type DeliveryFeeInput = {
  city?: string | null;
  municipality?: string | null;
  province?: string | null;
  fullAddress?: string | null;
  itemCount?: number | null;
};

export type DeliveryFeeResult =
  | {
    status: "free";
    fee: 0;
    label: "Free Shipping";
    matchedLocation: string;
  }
  | {
    status: "fixed";
    fee: number;
    label: string;
    matchedLocation: string;
  }
  | {
    status: "quoted";
    fee: null;
    label: "To be quoted";
    matchedLocation: null;
  };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalizes a location string to a consistent lowercase ASCII form so that
 * accented/special Filipino characters compare correctly.
 *
 * Examples:
 *   "Biñan"       -> "binan"
 *   "Los Baños"   -> "los banos"
 *   "Parañaque"   -> "paranaque"
 *   "Dasmariñas"  -> "dasmarinas"
 */
function normalizeLocation(value: string): string {
  return value
    .normalize("NFD")               // decompose accented chars (ñ -> n + combining tilde)
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritical marks
    .toLowerCase()
    .trim();
}

/**
 * All 17 cities/municipalities that make up Metro Manila (NCR).
 * Both accented and plain-ASCII variants are included where applicable so
 * that the normalised lookup never misses them.
 */
const METRO_MANILA_LOCATIONS: readonly string[] = [
  "caloocan",
  "las pinas",   // normalised form of "Las Piñas"
  "makati",
  "malabon",
  "mandaluyong",
  "manila",
  "marikina",
  "muntinlupa",
  "navotas",
  "paranaque",   // normalised form of "Parañaque"
  "pasay",
  "pasig",
  "quezon city",
  "san juan",
  "taguig",
  "valenzuela",
  "pateros",
] as const;

/**
 * Returns the canonical Metro Manila city name if the provided string matches
 * any entry in the list, otherwise returns `null`.
 */
function matchMetroManila(value: string): string | null {
  const normalized = normalizeLocation(value);
  const match = METRO_MANILA_LOCATIONS.find((city) =>
    normalized.includes(city)
  );
  return match ?? null;
}

/**
 * Checks a single candidate string (city, municipality, or full address)
 * against the Metro Manila location list.
 */
function checkCandidate(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  return matchMetroManila(candidate);
}

// ---------------------------------------------------------------------------
// Provincial fixed-rate matrix – Step 2B
// ---------------------------------------------------------------------------

/**
 * A single entry in the fixed-rate matrix.
 *
 * `aliases`         – all normalised forms that should map to this city.
 * `fee`             – delivery fee in PHP.
 * `displayName`     – human-readable label used in the result.
 * `requireProvince` – if true, only match when the province field is confirmed.
 *                     Used for ambiguous city names that exist in multiple
 *                     provinces (e.g. "Santa Maria", "San Jose").
 */
type FixedRateEntry = {
  aliases: readonly string[];
  fee: number;
  displayName: string;
  requireProvince?: boolean;
};

/** Rizal province – fixed delivery rates */
const RIZAL_ENTRIES: readonly FixedRateEntry[] = [
  { aliases: ["cainta"], fee: 800, displayName: "Cainta, Rizal" },
  { aliases: ["taytay"], fee: 800, displayName: "Taytay, Rizal" },
  { aliases: ["antipolo"], fee: 1000, displayName: "Antipolo, Rizal" },
  { aliases: ["rodriguez", "montalban"], fee: 1000, displayName: "Rodriguez, Rizal" },
  { aliases: ["angono"], fee: 1200, displayName: "Angono, Rizal" },
  { aliases: ["binangonan"], fee: 1200, displayName: "Binangonan, Rizal" },
  { aliases: ["cardona"], fee: 1200, displayName: "Cardona, Rizal" },
  { aliases: ["teresa"], fee: 1500, displayName: "Teresa, Rizal" },
  { aliases: ["baras"], fee: 1500, displayName: "Baras, Rizal" },
  { aliases: ["morong"], fee: 1500, displayName: "Morong, Rizal" },
  { aliases: ["tanay"], fee: 1500, displayName: "Tanay, Rizal" },
  { aliases: ["jalajala"], fee: 2500, displayName: "Jalajala, Rizal" },
  { aliases: ["pililla"], fee: 2500, displayName: "Pililla, Rizal" },
] as const;

/** Bulacan province – fixed delivery rates */
const BULACAN_ENTRIES: readonly FixedRateEntry[] = [
  { aliases: ["meycauayan"], fee: 500, displayName: "Meycauayan, Bulacan" },
  // "San Jose" is ambiguous across provinces – require confirmed province field
  { aliases: ["san jose del monte", "san jose"], fee: 500, displayName: "San Jose del Monte, Bulacan", requireProvince: true },
  { aliases: ["bocaue"], fee: 800, displayName: "Bocaue, Bulacan" },
  { aliases: ["malolos"], fee: 800, displayName: "Malolos, Bulacan" },
  { aliases: ["marilao"], fee: 800, displayName: "Marilao, Bulacan" },
  { aliases: ["norzagaray"], fee: 800, displayName: "Norzagaray, Bulacan" },
  // "Santa Maria" is ambiguous (also exists in Laguna) – require confirmed province field
  { aliases: ["santa maria"], fee: 800, displayName: "Santa Maria, Bulacan", requireProvince: true },
  { aliases: ["san miguel"], fee: 1000, displayName: "San Miguel, Bulacan", requireProvince: true },
  { aliases: ["san rafael"], fee: 1000, displayName: "San Rafael, Bulacan", requireProvince: true },
  { aliases: ["san ildefonso"], fee: 1000, displayName: "San Ildefonso, Bulacan", requireProvince: true },
  { aliases: ["pulilan"], fee: 1000, displayName: "Pulilan, Bulacan" },
  { aliases: ["angat"], fee: 1200, displayName: "Angat, Bulacan" },
  { aliases: ["balagtas"], fee: 1300, displayName: "Balagtas, Bulacan" },
  { aliases: ["bulakan"], fee: 1300, displayName: "Bulakan, Bulacan" },
  { aliases: ["bustos"], fee: 1300, displayName: "Bustos, Bulacan" },
  { aliases: ["calumpit"], fee: 1300, displayName: "Calumpit, Bulacan" },
  // Doña Remedios Trinidad – plain ASCII + abbreviation
  { aliases: ["dona remedios trinidad", "drt"], fee: 1300, displayName: "Doña Remedios Trinidad, Bulacan" },
  { aliases: ["guiguinto"], fee: 1300, displayName: "Guiguinto, Bulacan" },
  { aliases: ["hagonoy"], fee: 1300, displayName: "Hagonoy, Bulacan" },
  { aliases: ["obando"], fee: 1300, displayName: "Obando, Bulacan" },
  { aliases: ["pandi"], fee: 1300, displayName: "Pandi, Bulacan" },
  { aliases: ["paombong"], fee: 1300, displayName: "Paombong, Bulacan" },
  { aliases: ["plaridel"], fee: 1300, displayName: "Plaridel, Bulacan" },
  { aliases: ["baliuag"], fee: 1500, displayName: "Baliuag, Bulacan" },
] as const;

/** Laguna province – fixed delivery rates */
const LAGUNA_ENTRIES: readonly FixedRateEntry[] = [
  // Biñan normalises to "binan" via normalizeLocation()
  { aliases: ["binan"], fee: 1500, displayName: "Biñan, Laguna" },
  { aliases: ["alaminos"], fee: 1800, displayName: "Alaminos, Laguna" },
  { aliases: ["bay"], fee: 1800, displayName: "Bay, Laguna" },
  { aliases: ["calamba"], fee: 1800, displayName: "Calamba, Laguna" },
  { aliases: ["cabuyao"], fee: 1800, displayName: "Cabuyao, Laguna" },
  // Los Baños normalises to "los banos" via normalizeLocation()
  { aliases: ["los banos"], fee: 1800, displayName: "Los Baños, Laguna" },
  { aliases: ["luisiana"], fee: 1800, displayName: "Luisiana, Laguna" },
  { aliases: ["lumban"], fee: 1800, displayName: "Lumban, Laguna" },
  { aliases: ["mabitac"], fee: 1800, displayName: "Mabitac, Laguna" },
  { aliases: ["magdalena"], fee: 1800, displayName: "Magdalena, Laguna" },
  { aliases: ["majayjay"], fee: 1800, displayName: "Majayjay, Laguna" },
  { aliases: ["nagcarlan"], fee: 1800, displayName: "Nagcarlan, Laguna" },
  { aliases: ["paete"], fee: 1800, displayName: "Paete, Laguna" },
  { aliases: ["pagsanjan"], fee: 1800, displayName: "Pagsanjan, Laguna" },
  { aliases: ["pakil"], fee: 1800, displayName: "Pakil, Laguna" },
  { aliases: ["pangil"], fee: 1800, displayName: "Pangil, Laguna" },
  { aliases: ["pila"], fee: 1800, displayName: "Pila, Laguna" },
  // "Rizal" is also a province – requireProvince prevents cross-province false match
  { aliases: ["rizal"], fee: 1800, displayName: "Rizal, Laguna", requireProvince: true },
  { aliases: ["san pedro"], fee: 1800, displayName: "San Pedro, Laguna", requireProvince: true },
  { aliases: ["santa cruz"], fee: 1800, displayName: "Santa Cruz, Laguna", requireProvince: true },
  // "Santa Maria" also exists in Bulacan – requireProvince prevents false match
  { aliases: ["santa maria"], fee: 1800, displayName: "Santa Maria, Laguna", requireProvince: true },
  { aliases: ["santa rosa"], fee: 1800, displayName: "Santa Rosa, Laguna", requireProvince: true },
  { aliases: ["siniloan"], fee: 1800, displayName: "Siniloan, Laguna" },
  { aliases: ["victoria"], fee: 1800, displayName: "Victoria, Laguna", requireProvince: true },
  { aliases: ["calauan"], fee: 2200, displayName: "Calauan, Laguna" },
  { aliases: ["cavinti"], fee: 2200, displayName: "Cavinti, Laguna" },
  { aliases: ["makiling"], fee: 2500, displayName: "Makiling, Laguna" },
  { aliases: ["san pablo"], fee: 2500, displayName: "San Pablo, Laguna", requireProvince: true },
  { aliases: ["famy"], fee: 3500, displayName: "Famy, Laguna" },
  { aliases: ["kalayaan"], fee: 3500, displayName: "Kalayaan, Laguna" },
  { aliases: ["liliw"], fee: 3500, displayName: "Liliw, Laguna" },
] as const;

/** Cavite province – fixed delivery rates */
const CAVITE_ENTRIES: readonly FixedRateEntry[] = [
  { aliases: ["bacoor"], fee: 1200, displayName: "Bacoor, Cavite" },
  { aliases: ["imus"], fee: 1200, displayName: "Imus, Cavite" },
  { aliases: ["kawit"], fee: 1200, displayName: "Kawit, Cavite" },
  { aliases: ["noveleta"], fee: 1200, displayName: "Noveleta, Cavite" },
  { aliases: ["rosario"], fee: 1200, displayName: "Rosario, Cavite", requireProvince: true },
  { aliases: ["carmona"], fee: 1600, displayName: "Carmona, Cavite" },
  { aliases: ["cavite city", "cavite"], fee: 1600, displayName: "Cavite City, Cavite", requireProvince: true },
  // Dasmariñas normalises to "dasmarinas" via normalizeLocation()
  { aliases: ["dasmarinas"], fee: 1600, displayName: "Dasmariñas, Cavite" },
  // General Mariano Alvarez / GMA
  { aliases: ["general mariano alvarez", "gma"], fee: 1600, displayName: "General Mariano Alvarez, Cavite" },
  { aliases: ["general trias"], fee: 1600, displayName: "General Trias, Cavite" },
  { aliases: ["maragondon"], fee: 1600, displayName: "Maragondon, Cavite" },
  { aliases: ["naic"], fee: 1600, displayName: "Naic, Cavite" },
  { aliases: ["tanza"], fee: 1600, displayName: "Tanza, Cavite" },
  { aliases: ["ternate"], fee: 1600, displayName: "Ternate, Cavite" },
  { aliases: ["trece martires"], fee: 1600, displayName: "Trece Martires, Cavite" },
  { aliases: ["alfonso"], fee: 2200, displayName: "Alfonso, Cavite" },
  { aliases: ["amadeo"], fee: 2200, displayName: "Amadeo, Cavite" },
  { aliases: ["indang"], fee: 2200, displayName: "Indang, Cavite" },
  { aliases: ["magallanes"], fee: 2200, displayName: "Magallanes, Cavite", requireProvince: true },
  { aliases: ["mendez"], fee: 2200, displayName: "Mendez, Cavite" },
  { aliases: ["silang"], fee: 2200, displayName: "Silang, Cavite" },
  // Tagaytay City / Tagaytay – requireProvince so "tagaytay" alone stays safe
  { aliases: ["tagaytay city", "tagaytay"], fee: 2200, displayName: "Tagaytay City, Cavite", requireProvince: true },
] as const;

/** Batangas province – fixed delivery rates */
const BATANGAS_ENTRIES: readonly FixedRateEntry[] = [
  { aliases: ["agoncillo"], fee: 4500, displayName: "Agoncillo, Batangas" },
  { aliases: ["alitagtag"], fee: 4500, displayName: "Alitagtag, Batangas" },
  { aliases: ["balayan"], fee: 4500, displayName: "Balayan, Batangas" },
  { aliases: ["balete"], fee: 4500, displayName: "Balete, Batangas", requireProvince: true },
  { aliases: ["batangas city", "batangas"], fee: 4500, displayName: "Batangas City, Batangas", requireProvince: true },
  { aliases: ["bauan"], fee: 4500, displayName: "Bauan, Batangas" },
  { aliases: ["calaca"], fee: 4500, displayName: "Calaca, Batangas" },
  { aliases: ["calatagan"], fee: 4500, displayName: "Calatagan, Batangas" },
  { aliases: ["cuenca"], fee: 4500, displayName: "Cuenca, Batangas", requireProvince: true },
  { aliases: ["ibaan"], fee: 4500, displayName: "Ibaan, Batangas" },
  { aliases: ["laurel"], fee: 4500, displayName: "Laurel, Batangas", requireProvince: true },
  { aliases: ["lemery"], fee: 4500, displayName: "Lemery, Batangas", requireProvince: true },
  { aliases: ["lian"], fee: 4500, displayName: "Lian, Batangas" },
  { aliases: ["lipa"], fee: 4500, displayName: "Lipa, Batangas" },
  { aliases: ["lobo"], fee: 4500, displayName: "Lobo, Batangas" },
  { aliases: ["mabini"], fee: 4500, displayName: "Mabini, Batangas", requireProvince: true },
  { aliases: ["malvar"], fee: 4500, displayName: "Malvar, Batangas" },
  { aliases: ["mataas na kahoy"], fee: 4500, displayName: "Mataas na Kahoy, Batangas" },
  { aliases: ["nasugbu"], fee: 4500, displayName: "Nasugbu, Batangas" },
  { aliases: ["padre garcia"], fee: 4500, displayName: "Padre Garcia, Batangas" },
  // "Rosario" is ambiguous (also in Cavite) – require province
  { aliases: ["rosario"], fee: 4500, displayName: "Rosario, Batangas", requireProvince: true },
  // "San Jose" is ambiguous across many provinces
  { aliases: ["san jose"], fee: 4500, displayName: "San Jose, Batangas", requireProvince: true },
  // "San Juan" is ambiguous across many provinces
  { aliases: ["san juan"], fee: 4500, displayName: "San Juan, Batangas", requireProvince: true },
  // "San Luis" is ambiguous (also in Pampanga)
  { aliases: ["san luis"], fee: 4500, displayName: "San Luis, Batangas", requireProvince: true },
  { aliases: ["san nicolas"], fee: 4500, displayName: "San Nicolas, Batangas", requireProvince: true },
  { aliases: ["san pascual"], fee: 4500, displayName: "San Pascual, Batangas" },
  { aliases: ["santa teresita"], fee: 4500, displayName: "Santa Teresita, Batangas" },
  // "Santo Tomas" is ambiguous (also in Pampanga)
  { aliases: ["santo tomas"], fee: 4500, displayName: "Santo Tomas, Batangas", requireProvince: true },
  { aliases: ["taal"], fee: 4500, displayName: "Taal, Batangas" },
  { aliases: ["talisay"], fee: 4500, displayName: "Talisay, Batangas", requireProvince: true },
  { aliases: ["tanauan"], fee: 4500, displayName: "Tanauan, Batangas" },
  { aliases: ["taysan"], fee: 4500, displayName: "Taysan, Batangas" },
  { aliases: ["tingloy"], fee: 4500, displayName: "Tingloy, Batangas" },
  { aliases: ["tuy"], fee: 4500, displayName: "Tuy, Batangas" },
] as const;

/** Pampanga province – fixed delivery rates */
const PAMPANGA_ENTRIES: readonly FixedRateEntry[] = [
  // "San Luis" is ambiguous (also in Batangas)
  { aliases: ["san luis"], fee: 1300, displayName: "San Luis, Pampanga", requireProvince: true },
  { aliases: ["san simon"], fee: 1300, displayName: "San Simon, Pampanga", requireProvince: true },
  { aliases: ["santa ana"], fee: 1300, displayName: "Santa Ana, Pampanga", requireProvince: true },
  { aliases: ["santa rita"], fee: 1300, displayName: "Santa Rita, Pampanga", requireProvince: true },
  // "Santo Tomas" is ambiguous (also in Batangas)
  { aliases: ["santo tomas"], fee: 1300, displayName: "Santo Tomas, Pampanga", requireProvince: true },
  { aliases: ["sasmuan"], fee: 1300, displayName: "Sasmuan, Pampanga" },
  { aliases: ["apalit"], fee: 1500, displayName: "Apalit, Pampanga" },
  { aliases: ["arayat"], fee: 1500, displayName: "Arayat, Pampanga" },
  { aliases: ["macabebe"], fee: 1500, displayName: "Macabebe, Pampanga" },
  { aliases: ["magalang"], fee: 1500, displayName: "Magalang, Pampanga" },
  { aliases: ["masantol"], fee: 1500, displayName: "Masantol, Pampanga" },
  { aliases: ["minalin"], fee: 1500, displayName: "Minalin, Pampanga" },
  { aliases: ["bacolor"], fee: 1800, displayName: "Bacolor, Pampanga" },
  { aliases: ["guagua"], fee: 1800, displayName: "Guagua, Pampanga" },
  { aliases: ["mexico"], fee: 1800, displayName: "Mexico, Pampanga", requireProvince: true },
  { aliases: ["san fernando"], fee: 1800, displayName: "San Fernando, Pampanga", requireProvince: true },
  { aliases: ["angeles city", "angeles"], fee: 2000, displayName: "Angeles City, Pampanga" },
  { aliases: ["candaba"], fee: 2000, displayName: "Candaba, Pampanga" },
  { aliases: ["floridablanca"], fee: 2000, displayName: "Floridablanca, Pampanga" },
  { aliases: ["lubao"], fee: 2000, displayName: "Lubao, Pampanga" },
  { aliases: ["porac"], fee: 2200, displayName: "Porac, Pampanga" },
  { aliases: ["mabalacat"], fee: 2500, displayName: "Mabalacat, Pampanga" },
] as const;

/** Tarlac province – fixed delivery rates */
const TARLAC_ENTRIES: readonly FixedRateEntry[] = [
  { aliases: ["anao"], fee: 4500, displayName: "Anao, Tarlac" },
  { aliases: ["bamban"], fee: 4500, displayName: "Bamban, Tarlac" },
  { aliases: ["camiling"], fee: 4500, displayName: "Camiling, Tarlac" },
  { aliases: ["capaz"], fee: 4500, displayName: "Capaz, Tarlac" },
  { aliases: ["concepcion"], fee: 4500, displayName: "Concepcion, Tarlac", requireProvince: true },
  { aliases: ["gerona"], fee: 4500, displayName: "Gerona, Tarlac" },
  { aliases: ["la paz"], fee: 4500, displayName: "La Paz, Tarlac", requireProvince: true },
  { aliases: ["mayantoc"], fee: 4500, displayName: "Mayantoc, Tarlac" },
  { aliases: ["moncada"], fee: 4500, displayName: "Moncada, Tarlac" },
  { aliases: ["paniqui"], fee: 4500, displayName: "Paniqui, Tarlac" },
  { aliases: ["pura"], fee: 4500, displayName: "Pura, Tarlac" },
  { aliases: ["ramos"], fee: 4500, displayName: "Ramos, Tarlac", requireProvince: true },
  { aliases: ["san clemente"], fee: 4500, displayName: "San Clemente, Tarlac", requireProvince: true },
  // "San Jose" is ambiguous across provinces
  { aliases: ["san jose"], fee: 4500, displayName: "San Jose, Tarlac", requireProvince: true },
  { aliases: ["san manuel"], fee: 4500, displayName: "San Manuel, Tarlac", requireProvince: true },
  { aliases: ["santa ignacia"], fee: 4500, displayName: "Santa Ignacia, Tarlac" },
  { aliases: ["tarlac city", "tarlac"], fee: 4500, displayName: "Tarlac City, Tarlac", requireProvince: true },
  // "Victoria" is ambiguous (also in Laguna)
  { aliases: ["victoria"], fee: 4500, displayName: "Victoria, Tarlac", requireProvince: true },
] as const;

/**
 * Quezon Province – fixed delivery rates.
 * ProvinceKey is "quezon province" (not "quezon") to avoid collision with
 * Quezon City which is an NCR Metro Manila city already handled by free shipping.
 */
const QUEZON_PROVINCE_ENTRIES: readonly FixedRateEntry[] = [
  { aliases: ["agdangan"], fee: 4500, displayName: "Agdangan, Quezon Province" },
  { aliases: ["alabat"], fee: 4500, displayName: "Alabat, Quezon Province" },
  { aliases: ["atimonan"], fee: 4500, displayName: "Atimonan, Quezon Province" },
  { aliases: ["burdeos"], fee: 4500, displayName: "Burdeos, Quezon Province" },
  { aliases: ["calauag"], fee: 4500, displayName: "Calauag, Quezon Province" },
  { aliases: ["candelaria"], fee: 4500, displayName: "Candelaria, Quezon Province", requireProvince: true },
  { aliases: ["dolores"], fee: 4500, displayName: "Dolores, Quezon Province", requireProvince: true },
  { aliases: ["general nakar"], fee: 4500, displayName: "General Nakar, Quezon Province" },
  { aliases: ["infanta"], fee: 4500, displayName: "Infanta, Quezon Province" },
  { aliases: ["lucban"], fee: 4500, displayName: "Lucban, Quezon Province" },
  { aliases: ["jomalig"], fee: 4500, displayName: "Jomalig, Quezon Province" },
  { aliases: ["panukulan"], fee: 4500, displayName: "Panukulan, Quezon Province" },
  { aliases: ["patnanungan"], fee: 4500, displayName: "Patnanungan, Quezon Province" },
  { aliases: ["perez"], fee: 4500, displayName: "Perez, Quezon Province", requireProvince: true },
  { aliases: ["polillo"], fee: 4500, displayName: "Polillo, Quezon Province" },
  { aliases: ["real"], fee: 4500, displayName: "Real, Quezon Province", requireProvince: true },
  { aliases: ["sampaloc"], fee: 4500, displayName: "Sampaloc, Quezon Province", requireProvince: true },
  { aliases: ["sariaya"], fee: 4500, displayName: "Sariaya, Quezon Province" },
  { aliases: ["gumaca"], fee: 6500, displayName: "Gumaca, Quezon Province" },
  { aliases: ["lopez"], fee: 6500, displayName: "Lopez, Quezon Province", requireProvince: true },
  { aliases: ["lucena"], fee: 6500, displayName: "Lucena, Quezon Province" },
  { aliases: ["mauban"], fee: 6500, displayName: "Mauban, Quezon Province" },
  { aliases: ["mulanay"], fee: 6500, displayName: "Mulanay, Quezon Province" },
  { aliases: ["padre burgos"], fee: 6500, displayName: "Padre Burgos, Quezon Province" },
  { aliases: ["pagbilao"], fee: 6500, displayName: "Pagbilao, Quezon Province" },
  // Whole-province match: city field says "Quezon Province" or similar
  { aliases: ["quezon province", "quezon"], fee: 6500, displayName: "Quezon Province", requireProvince: true },
] as const;

/**
 * Grouped matrix for easy iteration.
 * Each entry pairs a province's normalised key with its city list.
 */
const PROVINCIAL_MATRIX: readonly {
  provinceKey: string;
  entries: readonly FixedRateEntry[];
}[] = [
  { provinceKey: "rizal", entries: RIZAL_ENTRIES },
  { provinceKey: "bulacan", entries: BULACAN_ENTRIES },
  { provinceKey: "laguna", entries: LAGUNA_ENTRIES },
  { provinceKey: "cavite", entries: CAVITE_ENTRIES },
  { provinceKey: "batangas", entries: BATANGAS_ENTRIES },
  { provinceKey: "pampanga", entries: PAMPANGA_ENTRIES },
  { provinceKey: "tarlac", entries: TARLAC_ENTRIES },
  { provinceKey: "quezon province", entries: QUEZON_PROVINCE_ENTRIES },
] as const;

/**
 * Attempts to find a fixed-rate match for the given inputs.
 *
 * Matching strategy:
 * 1. Province-confirmed:  `province` field normalizes to a known province key.
 * 2. Address fallback:    `fullAddress` contains a known province key — used
 *    only for entries where `requireProvince` is NOT set.
 * 3. `requireProvince` entries (ambiguous cities) are ONLY matched when the
 *    `province` field itself confirms the province.
 *
 * Returns a `fixed` DeliveryFeeResult on success, or `null` on no match.
 */
function matchProvincialFee(input: DeliveryFeeInput): DeliveryFeeResult | null {
  const normProvince = input.province ? normalizeLocation(input.province) : null;
  const normCity = input.city ? normalizeLocation(input.city) : null;
  const normMunicipality = input.municipality ? normalizeLocation(input.municipality) : null;
  const normFullAddress = input.fullAddress ? normalizeLocation(input.fullAddress) : null;

  // City to match: prefer explicit city, fall back to municipality
  const cityNorm = normCity ?? normMunicipality;
  if (!cityNorm) return null;

  for (const { provinceKey, entries } of PROVINCIAL_MATRIX) {
    // Is the province field confirmed?
    const provinceFieldConfirmed = normProvince === provinceKey;

    // Does the full address at least mention the province?
    const addressMentionsProvince = normFullAddress?.includes(provinceKey) ?? false;

    // Skip this province entirely if we have no context for it at all
    if (!provinceFieldConfirmed && !addressMentionsProvince) continue;

    for (const entry of entries) {
      // requireProvince entries must have an explicit province field match
      if (entry.requireProvince && !provinceFieldConfirmed) continue;

      const aliasMatch = entry.aliases.find((alias) => cityNorm === alias);
      if (aliasMatch) {
        return {
          status: "fixed",
          fee: entry.fee,
          label: `₱${entry.fee.toLocaleString()} – ${entry.displayName}`,
          matchedLocation: entry.displayName,
        };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculates the delivery fee for a given address input.
 *
 * Resolution order:
 *  1. Metro Manila (NCR)                    → free shipping (₱0)
 *  2. Rizal / Bulacan / Laguna / Cavite     → fixed fee from provincial matrix
 *  3. Everything else                       → "to be quoted"
 */
export function getDeliveryFee(input: DeliveryFeeInput): DeliveryFeeResult {
  const { city, municipality, fullAddress } = input;

  // ------------------------------------------------------------------
  // 1. Metro Manila check (free shipping)
  // ------------------------------------------------------------------
  const candidates = [city, municipality, fullAddress];

  for (const candidate of candidates) {
    const matched = checkCandidate(candidate);
    if (matched !== null) {
      return {
        status: "free",
        fee: 0,
        label: "Free Shipping",
        matchedLocation: matched,
      };
    }
  }

  // ------------------------------------------------------------------
  // 2. Provincial fixed-rate matrix (Rizal, Bulacan, Laguna, Cavite)
  // ------------------------------------------------------------------
  const provincialResult = matchProvincialFee(input);
  if (provincialResult !== null) return provincialResult;

  // ------------------------------------------------------------------
  // 3. Quoted fallback – no match found
  // ------------------------------------------------------------------
  return {
    status: "quoted",
    fee: null,
    label: "To be quoted",
    matchedLocation: null,
  };
}
