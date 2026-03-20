import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import i18n from "./index";
import type { Theme, Topic, Angle, UserLevel } from "@/constants/themes";

type SupportedLanguage = "en" | "nl" | "fr" | "de" | "es";

const suffixMap: Record<SupportedLanguage, string> = {
  en: "",
  nl: "Nl",
  fr: "Fr",
  de: "De",
  es: "Es",
};

type LocalizableItem = Theme | Topic | Angle | UserLevel | { name: string; nameNl?: string; nameFr?: string; nameDe?: string; nameEs?: string; description?: string; descriptionNl?: string; descriptionFr?: string; descriptionDe?: string; descriptionEs?: string };

export function useTranslation() {
  const { user } = useAuth();
  const locale = (user?.preferredLanguage || "en") as SupportedLanguage;

  useEffect(() => {
    i18n.locale = locale;
  }, [locale]);

  return {
    t: i18n.t.bind(i18n),
    locale,
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
