import { useState, useEffect, useCallback } from "react";
import Constants from "expo-constants";
import { useAuth } from "@/contexts/AuthContext";
import { useCityConfig } from "@/contexts/CityConfigContext";
import i18n from "./index";

const supportedLocales = ["en", "nl", "fr", "de", "es"] as const;
type SupportedLanguage = (typeof supportedLocales)[number];

function toSupportedLocale(lang: string | undefined): SupportedLanguage {
  if (lang && (supportedLocales as readonly string[]).includes(lang)) {
    return lang as SupportedLanguage;
  }
  return "en";
}

export function useTranslation() {
  const { user } = useAuth();
  const { cityConfig } = useCityConfig();
  const locale = toSupportedLocale(user?.preferredLanguage);

  i18n.locale = locale;

  const [, setRenderKey] = useState(0);

  useEffect(() => {
    setRenderKey((k) => k + 1);
  }, [locale]);

  const cityHighlights: Record<string, Record<string, string>> = {
    paris: {
      en: "the French Revolution",
      nl: "de Franse Revolutie",
      fr: "la Révolution française",
      de: "der Französischen Revolution",
      es: "la Revolución Francesa",
    },
    amsterdam: {
      en: "the Golden Age",
      nl: "de Gouden Eeuw",
      fr: "l'Âge d'or",
      de: "dem Goldenen Zeitalter",
      es: "la Edad de Oro",
    },
  };

  const cityThanks: Record<string, string> = {
    paris: "Merci!",
    amsterdam: "Dankjewel!",
  };

  const t = useCallback(
    (key: string, options?: Record<string, any>) => {
      const cityName = cityConfig.localizedNames[locale] || cityConfig.localizedNames.en;
      const appName = cityConfig.topLevelName[locale] || cityConfig.appName;
      const cityId = cityConfig.id || "paris";
      const cityHighlight = cityHighlights[cityId]?.[locale] || cityHighlights.paris[locale] || cityHighlights.paris.en;
      const thanks = cityThanks[cityId] || cityThanks.paris;
      const version = Constants.expoConfig?.version || "1.0.0";
      return i18n.t(key, { city: cityName, appName, cityHighlight, thanks, version, ...options });
    },
    [locale, cityConfig],
  );

  return {
    t,
    locale,
  };
}
