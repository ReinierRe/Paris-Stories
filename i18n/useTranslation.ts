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

  const t = useCallback(
    (key: string, options?: Record<string, any>) => {
      const cityName = cityConfig.localizedNames[locale] || cityConfig.localizedNames.en;
      const appName = cityConfig.topLevelName[locale] || cityConfig.appName;
      const cityHighlight = cityConfig.cityHighlights?.[locale] || cityConfig.cityHighlights?.en || "";
      const thanks = cityConfig.thankYouWord || "";
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
