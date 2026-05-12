/**
 * City Registry — single source of truth for all available cities in the app.
 *
 * - `bundled` cities ship with the app install (themes, icons, content all in JS bundle).
 * - `remote` cities are flagged as on-demand: their themes can be fetched from the server
 *   when the user adds them via the Profile screen.
 *
 * Adding a new city:
 *   1. Add an entry here.
 *   2. Add the city to CITY_DEFAULTS in constants/city.ts (or rely on server fetch).
 *   3. If bundled: add themes to constants/themes.ts and assets to /assets/images.
 *   4. Server-side: ensure city record exists in `cities` table (server/seed-cities.ts).
 */

export type CityDeliveryMode = "bundled" | "remote";

export interface CityRegistryEntry {
  id: string;
  /** ISO 3166-1 alpha-2 country code (used for flag emoji rendering) */
  countryCode: string;
  /** How this city's content is delivered: bundled in the app, or fetched on demand */
  delivery: CityDeliveryMode;
  /** If true, this city is pre-activated for new installs. */
  defaultActive: boolean;
}

export const CITY_REGISTRY: CityRegistryEntry[] = [
  {
    id: "amsterdam",
    countryCode: "NL",
    delivery: "bundled",
    defaultActive: true,
  },
  {
    id: "paris",
    countryCode: "FR",
    delivery: "bundled",
    defaultActive: true,
  },
  {
    id: "barcelona",
    countryCode: "ES",
    delivery: "remote",
    defaultActive: false,
  },
  {
    id: "london",
    countryCode: "GB",
    delivery: "remote",
    defaultActive: true,
  },
  {
    id: "berlin",
    countryCode: "DE",
    delivery: "remote",
    defaultActive: false,
  },
  {
    id: "kotor",
    countryCode: "ME",
    delivery: "remote",
    defaultActive: false,
  },
];

export const DEFAULT_CURRENT_CITY_ID = "amsterdam";

export function getRegistryEntry(cityId: string): CityRegistryEntry | undefined {
  return CITY_REGISTRY.find((c) => c.id === cityId);
}

export function getDefaultActiveCityIds(): string[] {
  return CITY_REGISTRY.filter((c) => c.defaultActive).map((c) => c.id);
}

export function isBundledCity(cityId: string): boolean {
  return getRegistryEntry(cityId)?.delivery === "bundled";
}

export function flagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
