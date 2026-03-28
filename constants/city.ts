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
  name: Constants.expoConfig?.name?.replace(" Stories", "") || "Paris",
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
      description: {
        en: "Just getting started on your Paris journey",
        nl: "Net begonnen aan je Parijse reis",
        fr: "Vous commencez tout juste votre voyage parisien",
        de: "Gerade am Anfang Ihrer Pariser Reise",
        es: "Acabas de empezar tu viaje por París",
      },
    },
    {
      id: "explorer",
      icon: "compass-outline",
      minPodcasts: 5,
      name: { en: "Explorer", nl: "Ontdekker", fr: "Explorateur", de: "Entdecker", es: "Explorador" },
      description: {
        en: "Discovering the hidden stories of Paris",
        nl: "De verborgen verhalen van Parijs ontdekken",
        fr: "À la découverte des histoires cachées de Paris",
        de: "Die verborgenen Geschichten von Paris entdecken",
        es: "Descubriendo las historias ocultas de París",
      },
    },
    {
      id: "connoisseur",
      icon: "wine-outline",
      minPodcasts: 15,
      name: { en: "Connoisseur", nl: "Kenner", fr: "Connaisseur", de: "Kenner", es: "Conocedor" },
      description: {
        en: "A true connoisseur of Parisian culture",
        nl: "Een echte kenner van de Parijse cultuur",
        fr: "Un vrai connaisseur de la culture parisienne",
        de: "Ein wahrer Kenner der Pariser Kultur",
        es: "Un verdadero conocedor de la cultura parisina",
      },
    },
    {
      id: "parisien",
      icon: "star-outline",
      minPodcasts: 30,
      name: { en: "Parisien", nl: "Parisien", fr: "Parisien", de: "Parisien", es: "Parisien" },
      description: {
        en: "You know Paris like a true local",
        nl: "Je kent Parijs als een echte local",
        fr: "Vous connaissez Paris comme un vrai local",
        de: "Sie kennen Paris wie ein wahrer Einheimischer",
        es: "Conoces París como un verdadero local",
      },
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
