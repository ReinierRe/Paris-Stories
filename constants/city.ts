import Constants from "expo-constants";

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
}

const extra = Constants.expoConfig?.extra ?? {};

let _cityConfig: CityConfig | null = null;
let _fetchPromise: Promise<CityConfig> | null = null;

const DEFAULT_CITY: CityConfig = {
  id: extra.cityId || "paris",
  name: extra.cityId ? (extra.cityId.charAt(0).toUpperCase() + extra.cityId.slice(1)) : "Paris",
  country: "France",
  appName: Constants.expoConfig?.name || "Paris Stories",
  bundleId: Constants.expoConfig?.ios?.bundleIdentifier || "app.replit.parisstories",
  contactEmail: "vragen@greenhome.nl",
  privacyPolicyDate: "February 20, 2026",
  localizedNames: { en: "Paris", nl: "Parijs", fr: "Paris", de: "Paris", es: "París" },
  localizedCountry: { en: "France", nl: "Frankrijk", fr: "la France", de: "Frankreich", es: "Francia" },
  topLevelName: { en: "Paris Stories", nl: "Paris Stories", fr: "Paris Stories", de: "Paris Stories", es: "Paris Stories" },
  userLevels: [
    {
      id: "traveler",
      icon: "airplane-outline",
      minPodcasts: 0,
      name: { en: "Traveler", nl: "Reiziger", fr: "Voyageur", de: "Reisender", es: "Viajero" },
      description: { en: "Just getting started", nl: "Net begonnen", fr: "Vous commencez", de: "Gerade am Anfang", es: "Acabas de empezar" },
    },
    {
      id: "explorer",
      icon: "compass-outline",
      minPodcasts: 5,
      name: { en: "Explorer", nl: "Ontdekker", fr: "Explorateur", de: "Entdecker", es: "Explorador" },
      description: { en: "Discovering hidden stories", nl: "Verborgen verhalen ontdekken", fr: "Découvrir les histoires cachées", de: "Verborgene Geschichten entdecken", es: "Descubriendo historias ocultas" },
    },
    {
      id: "connoisseur",
      icon: "wine-outline",
      minPodcasts: 15,
      name: { en: "Connoisseur", nl: "Kenner", fr: "Connaisseur", de: "Kenner", es: "Conocedor" },
      description: { en: "A true connoisseur", nl: "Een echte kenner", fr: "Un vrai connaisseur", de: "Ein wahrer Kenner", es: "Un verdadero conocedor" },
    },
    {
      id: "local",
      icon: "star-outline",
      minPodcasts: 30,
      name: { en: "Local", nl: "Local", fr: "Local", de: "Einheimischer", es: "Local" },
      description: { en: "You know the city like a true local", nl: "Je kent de stad als een echte local", fr: "Vous connaissez la ville comme un vrai local", de: "Sie kennen die Stadt wie ein Einheimischer", es: "Conoces la ciudad como un verdadero local" },
    },
  ],
};

export async function fetchCityConfig(): Promise<CityConfig> {
  if (_cityConfig) return _cityConfig;
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    try {
      const { getApiUrl, getCityHeaders } = await import("@/lib/query-client");
      const baseUrl = getApiUrl();
      const headers = getCityHeaders();
      const response = await fetch(`${baseUrl}/api/city/config`, { headers });
      if (response.ok) {
        const data = await response.json();
        _cityConfig = data as CityConfig;
        return _cityConfig;
      }
    } catch (err) {
      console.warn("Failed to fetch city config, using defaults:", err);
    }
    _cityConfig = DEFAULT_CITY;
    return _cityConfig;
  })();

  return _fetchPromise;
}

export function getCityConfigSync(): CityConfig {
  return _cityConfig || DEFAULT_CITY;
}

export function setCityConfig(config: CityConfig): void {
  _cityConfig = config;
}

const city = DEFAULT_CITY;
export default city;
