import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  const locale = toSupportedLocale(user?.preferredLanguage);

  i18n.locale = locale;

  const [, setRenderKey] = useState(0);

  useEffect(() => {
    setRenderKey((k) => k + 1);
  }, [locale]);

  return {
    t: i18n.t.bind(i18n),
    locale,
  };
}
