import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import i18n from "./index";
import type { Theme, Topic, Angle, UserLevel } from "@/constants/themes";
import type { PodcastLength } from "@/constants/themes";

type SupportedLanguage = "en" | "nl" | "fr" | "de" | "es";

const suffixMap: Record<SupportedLanguage, string> = {
  en: "",
  nl: "Nl",
  fr: "Fr",
  de: "De",
  es: "Es",
};

type LocalizableItem = Theme | Topic | Angle | UserLevel | PodcastLength;

export function useTranslation() {
  const { user } = useAuth();
  const preferredLocale = (user?.preferredLanguage || "en") as SupportedLanguage;

  i18n.locale = preferredLocale;

  const [, setRenderKey] = useState(0);

  useEffect(() => {
    setRenderKey((k) => k + 1);
  }, [preferredLocale]);

  return {
    t: i18n.t.bind(i18n),
    locale: preferredLocale,
  };
}

export function getLocalizedField(
  item: LocalizableItem,
  field: "name" | "description",
  language: string,
): string {
  const lang = (language in suffixMap ? language : "en") as SupportedLanguage;
  const suffix = suffixMap[lang];
  const localizedKey = suffix ? `${field}${suffix}` : field;
  return (item as Record<string, string>)[localizedKey] || (item as Record<string, string>)[field] || "";
}
