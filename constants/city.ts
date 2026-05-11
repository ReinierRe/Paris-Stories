import Constants from "expo-constants";
import { DEFAULT_CURRENT_CITY_ID } from "./cityRegistry";

export interface CityConfig {
  id: string;
  name: string;
  country: string;
  appName: string;
  bundleId: string;
  contactEmail: string;
  privacyPolicyDate: string;

  localizedNames: {
    en: string;
    nl: string;
    fr: string;
    de: string;
    es: string;
  };

  localizedCountry: {
    en: string;
    nl: string;
    fr: string;
    de: string;
    es: string;
  };

  topLevelName: {
    en: string;
    nl: string;
    fr: string;
    de: string;
    es: string;
  };

  userLevels: {
    id: string;
    icon: string;
    minPodcasts: number;
    name: { en: string; nl: string; fr: string; de: string; es: string };
    description: { en: string; nl: string; fr: string; de: string; es: string };
  }[];

  cityHighlights?: {
    en: string;
    nl: string;
    fr: string;
    de: string;
    es: string;
  };
  thankYouWord?: string;
}

const CITY_DEFAULTS: Record<string, CityConfig> = {
  paris: {
    id: "paris",
    name: "Paris",
    country: "France",
    appName: "City Stories",
    bundleId: "nl.greenhome.citystories",
    contactEmail: "vragen@greenhome.nl",
    privacyPolicyDate: "February 20, 2026",
    localizedNames: { en: "Paris", nl: "Parijs", fr: "Paris", de: "Paris", es: "París" },
    localizedCountry: { en: "France", nl: "Frankrijk", fr: "la France", de: "Frankreich", es: "Francia" },
    topLevelName: { en: "City Stories", nl: "City Stories", fr: "City Stories", de: "City Stories", es: "City Stories" },
    cityHighlights: { en: "the French Revolution", nl: "de Franse Revolutie", fr: "la Révolution française", de: "der Französischen Revolution", es: "la Revolución Francesa" },
    thankYouWord: "Merci!",
    userLevels: [
      { id: "traveler", icon: "airplane-outline", minPodcasts: 0, name: { en: "Traveler", nl: "Reiziger", fr: "Voyageur", de: "Reisender", es: "Viajero" }, description: { en: "Just getting started on your Paris journey", nl: "Net begonnen aan je Parijse reis", fr: "Vous commencez tout juste votre voyage parisien", de: "Gerade am Anfang Ihrer Pariser Reise", es: "Acabas de empezar tu viaje por París" } },
      { id: "explorer", icon: "compass-outline", minPodcasts: 5, name: { en: "Explorer", nl: "Ontdekker", fr: "Explorateur", de: "Entdecker", es: "Explorador" }, description: { en: "Discovering the hidden stories of Paris", nl: "De verborgen verhalen van Parijs ontdekken", fr: "À la découverte des histoires cachées de Paris", de: "Die verborgenen Geschichten von Paris entdecken", es: "Descubriendo las historias ocultas de París" } },
      { id: "connoisseur", icon: "wine-outline", minPodcasts: 15, name: { en: "Connoisseur", nl: "Kenner", fr: "Connaisseur", de: "Kenner", es: "Conocedor" }, description: { en: "A true connoisseur of Parisian culture", nl: "Een echte kenner van de Parijse cultuur", fr: "Un vrai connaisseur de la culture parisienne", de: "Ein wahrer Kenner der Pariser Kultur", es: "Un verdadero conocedor de la cultura parisina" } },
      { id: "world-explorer", icon: "earth-outline", minPodcasts: 30, name: { en: "World Explorer", nl: "Wereldreiziger", fr: "Voyageur du Monde", de: "Weltentdecker", es: "Explorador del Mundo" }, description: { en: "A seasoned traveler with cities in your pocket", nl: "Een doorgewinterde reiziger met steden in je broekzak", fr: "Un voyageur aguerri avec les villes en poche", de: "Ein erfahrener Reisender mit Städten in der Tasche", es: "Un viajero experimentado con ciudades en el bolsillo" } },
    ],
  },
  amsterdam: {
    id: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    appName: "City Stories",
    bundleId: "nl.greenhome.citystories",
    contactEmail: "vragen@greenhome.nl",
    privacyPolicyDate: "March 29, 2026",
    localizedNames: { en: "Amsterdam", nl: "Amsterdam", fr: "Amsterdam", de: "Amsterdam", es: "Ámsterdam" },
    localizedCountry: { en: "the Netherlands", nl: "Nederland", fr: "les Pays-Bas", de: "die Niederlande", es: "los Países Bajos" },
    topLevelName: { en: "City Stories", nl: "City Stories", fr: "City Stories", de: "City Stories", es: "City Stories" },
    cityHighlights: { en: "the Golden Age", nl: "de Gouden Eeuw", fr: "l'Âge d'or", de: "dem Goldenen Zeitalter", es: "la Edad de Oro" },
    thankYouWord: "Dankjewel!",
    userLevels: [
      { id: "toerist", icon: "airplane-outline", minPodcasts: 0, name: { en: "Tourist", nl: "Toerist", fr: "Touriste", de: "Tourist", es: "Turista" }, description: { en: "Just getting started on your Amsterdam journey", nl: "Net begonnen aan je Amsterdamse reis", fr: "Vous commencez tout juste votre voyage à Amsterdam", de: "Gerade am Anfang Ihrer Amsterdam-Reise", es: "Acabas de empezar tu viaje por Ámsterdam" } },
      { id: "ontdekker", icon: "compass-outline", minPodcasts: 5, name: { en: "Explorer", nl: "Ontdekker", fr: "Explorateur", de: "Entdecker", es: "Explorador" }, description: { en: "Discovering the hidden stories of Amsterdam", nl: "De verborgen verhalen van Amsterdam ontdekken", fr: "À la découverte des histoires cachées d'Amsterdam", de: "Die verborgenen Geschichten von Amsterdam entdecken", es: "Descubriendo las historias ocultas de Ámsterdam" } },
      { id: "kenner", icon: "wine-outline", minPodcasts: 15, name: { en: "Connoisseur", nl: "Kenner", fr: "Connaisseur", de: "Kenner", es: "Conocedor" }, description: { en: "A true connoisseur of Amsterdam culture", nl: "Een echte kenner van de Amsterdamse cultuur", fr: "Un vrai connaisseur de la culture amsterdamoise", de: "Ein wahrer Kenner der Amsterdamer Kultur", es: "Un verdadero conocedor de la cultura de Ámsterdam" } },
      { id: "world-explorer", icon: "earth-outline", minPodcasts: 30, name: { en: "World Explorer", nl: "Wereldreiziger", fr: "Voyageur du Monde", de: "Weltentdecker", es: "Explorador del Mundo" }, description: { en: "A seasoned traveler with cities in your pocket", nl: "Een doorgewinterde reiziger met steden in je broekzak", fr: "Un voyageur aguerri avec les villes en poche", de: "Ein erfahrener Reisender mit Städten in der Tasche", es: "Un viajero experimentado con ciudades en el bolsillo" } },
    ],
  },
  barcelona: {
    id: "barcelona",
    name: "Barcelona",
    country: "Spain",
    appName: "City Stories",
    bundleId: "nl.greenhome.citystories",
    contactEmail: "vragen@greenhome.nl",
    privacyPolicyDate: "April 20, 2026",
    localizedNames: { en: "Barcelona", nl: "Barcelona", fr: "Barcelone", de: "Barcelona", es: "Barcelona" },
    localizedCountry: { en: "Spain", nl: "Spanje", fr: "l'Espagne", de: "Spanien", es: "España" },
    topLevelName: { en: "City Stories", nl: "City Stories", fr: "City Stories", de: "City Stories", es: "City Stories" },
    cityHighlights: { en: "Gaudí's modernist masterpieces", nl: "Gaudí's modernistische meesterwerken", fr: "les chefs-d'œuvre modernistes de Gaudí", de: "Gaudís modernistischen Meisterwerken", es: "las obras maestras modernistas de Gaudí" },
    thankYouWord: "Gràcies!",
    userLevels: [
      { id: "viajero", icon: "airplane-outline", minPodcasts: 0, name: { en: "Traveler", nl: "Reiziger", fr: "Voyageur", de: "Reisender", es: "Viajero" }, description: { en: "Just getting started on your Barcelona journey", nl: "Net begonnen aan je Barcelona-reis", fr: "Vous commencez tout juste votre voyage à Barcelone", de: "Gerade am Anfang Ihrer Barcelona-Reise", es: "Acabas de empezar tu viaje por Barcelona" } },
      { id: "explorer", icon: "compass-outline", minPodcasts: 5, name: { en: "Explorer", nl: "Ontdekker", fr: "Explorateur", de: "Entdecker", es: "Explorador" }, description: { en: "Discovering the hidden stories of Barcelona", nl: "De verborgen verhalen van Barcelona ontdekken", fr: "À la découverte des histoires cachées de Barcelone", de: "Die verborgenen Geschichten von Barcelona entdecken", es: "Descubriendo las historias ocultas de Barcelona" } },
      { id: "connoisseur", icon: "wine-outline", minPodcasts: 15, name: { en: "Connoisseur", nl: "Kenner", fr: "Connaisseur", de: "Kenner", es: "Conocedor" }, description: { en: "A true connoisseur of Catalan culture", nl: "Een echte kenner van de Catalaanse cultuur", fr: "Un vrai connaisseur de la culture catalane", de: "Ein wahrer Kenner der katalanischen Kultur", es: "Un verdadero conocedor de la cultura catalana" } },
      { id: "world-explorer", icon: "earth-outline", minPodcasts: 30, name: { en: "World Explorer", nl: "Wereldreiziger", fr: "Voyageur du Monde", de: "Weltentdecker", es: "Explorador del Mundo" }, description: { en: "A seasoned traveler with cities in your pocket", nl: "Een doorgewinterde reiziger met steden in je broekzak", fr: "Un voyageur aguerri avec les villes en poche", de: "Ein erfahrener Reisender mit Städten in der Tasche", es: "Un viajero experimentado con ciudades en el bolsillo" } },
    ],
  },
};

/**
 * Per-city in-memory cache for server-fetched configs (overrides defaults).
 * Populated lazily by fetchCityConfig().
 */
const _serverConfigCache: Map<string, CityConfig> = new Map();
const _fetchPromises: Map<string, Promise<CityConfig>> = new Map();

/**
 * Module-level pointer to the currently focused city. Mutated by
 * CityConfigContext when the user switches cities. Used by sync helpers
 * (getCityConfigSync, getThemes, etc.) that can't easily reach the context.
 */
let _activeCityId: string = DEFAULT_CURRENT_CITY_ID;

/**
 * Set by CityConfigContext when the user switches the current city.
 */
export function setActiveCityIdInModule(cityId: string): void {
  _activeCityId = cityId;
}

export function getActiveCityIdInModule(): string {
  return _activeCityId;
}

/**
 * Returns the bundled default config for a city, or null if unknown.
 */
export function getBundledCityConfig(cityId: string): CityConfig | null {
  return CITY_DEFAULTS[cityId] ?? null;
}

/**
 * Returns the best-known config for a city, sync.
 * Prefers server-fetched cache, falls back to bundled defaults.
 *
 * If `cityId` is omitted, uses the current active city (set by context).
 * This preserves backwards-compat for legacy callers.
 */
export function getCityConfigSync(cityId?: string): CityConfig {
  const id = cityId ?? _activeCityId;
  return (
    _serverConfigCache.get(id) ??
    CITY_DEFAULTS[id] ??
    CITY_DEFAULTS[DEFAULT_CURRENT_CITY_ID]
  );
}

/**
 * Fetches the city config from the server, caching the result.
 * Falls back to bundled defaults if the network call fails.
 */
export async function fetchCityConfig(cityId: string): Promise<CityConfig> {
  if (_serverConfigCache.has(cityId)) {
    return _serverConfigCache.get(cityId)!;
  }
  const existing = _fetchPromises.get(cityId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const { getApiUrl } = await import("@/lib/query-client");
      const baseUrl = getApiUrl();
      const headers = { "X-City-Id": cityId };
      const response = await fetch(`${baseUrl}/api/city/config`, { headers });
      if (response.ok) {
        const data = (await response.json()) as CityConfig;
        _serverConfigCache.set(cityId, data);
        return data;
      }
    } catch (err) {
      console.warn(`Failed to fetch city config for ${cityId}, using defaults:`, err);
    }
    const fallback = CITY_DEFAULTS[cityId] ?? CITY_DEFAULTS[DEFAULT_CURRENT_CITY_ID];
    _serverConfigCache.set(cityId, fallback);
    return fallback;
  })();

  _fetchPromises.set(cityId, promise);
  return promise;
}

/**
 * Manually set a city config (used when context loads multi-city state).
 */
export function setCityConfigCache(cityId: string, config: CityConfig): void {
  _serverConfigCache.set(cityId, config);
}

/**
 * Returns the list of all cities for which we have bundled defaults.
 */

/**
 * Get the city's name in the user's preferred language. Safe for any locale —
 * falls back to English then to the canonical name.
 */
export function getLocalizedCityName(config: CityConfig, locale: string): string {
  const supported = ["en", "nl", "fr", "de", "es"] as const;
  const lang = (supported as readonly string[]).includes(locale)
    ? (locale as "en" | "nl" | "fr" | "de" | "es")
    : "en";
  return config.localizedNames[lang] ?? config.name;
}

export function getAllBundledCityConfigs(): CityConfig[] {
  return Object.values(CITY_DEFAULTS);
}

// --- Backwards-compat default export ---

const extra = Constants.expoConfig?.extra ?? {};
const _legacyCityId = extra.cityId || DEFAULT_CURRENT_CITY_ID;
const _legacyDefault: CityConfig = CITY_DEFAULTS[_legacyCityId] || CITY_DEFAULTS[DEFAULT_CURRENT_CITY_ID];

/**
 * @deprecated Single-city default. New code should use getCityConfigSync(cityId).
 */
const city = _legacyDefault;
export default city;
