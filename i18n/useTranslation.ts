import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import i18n from "./index";
import city from "@/constants/city";

const supportedLocales = ["en", "nl", "fr", "de", "es"] as const;
type SupportedLanguage = (typeof supportedLocales)[number];

function toSupportedLocale(lang: string | undefined): SupportedLanguage {
  if (lang && (supportedLocales as readonly string[]).includes(lang)) {
    return lang as SupportedLanguage;
  }
  return "en";
}

function getCityName(locale: SupportedLanguage): string {
  return city.localizedNames[locale] || city.localizedNames.en;
}

export function useTranslation() {
  const { user } = useAuth();
  const locale = toSupportedLocale(user?.preferredLanguage);

  i18n.locale = locale;

  const [, setRenderKey] = useState(0);

  useEffect(() => {
    setRenderKey((k) => k + 1);
  }, [locale]);

  const t = useCallback(
    (key: string, options?: Record<string, any>) => {
      return i18n.t(key, { city: getCityName(locale), appName: city.topLevelName[locale] || city.appName, ...options });
    },
    [locale],
  );

  return {
    t,
    locale,
  };
}
