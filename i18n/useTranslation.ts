import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import i18n from "./index";

export function useTranslation() {
  const { user } = useAuth();
  const locale = user?.preferredLanguage || "en";

  useMemo(() => {
    i18n.locale = locale;
  }, [locale]);

  return {
    t: i18n.t.bind(i18n),
    locale,
  };
}

export function getLocalizedField(
  item: Record<string, any>,
  field: string,
  language: string,
): string {
  const suffixMap: Record<string, string> = {
    en: "",
    nl: "Nl",
    fr: "Fr",
    de: "De",
    es: "Es",
  };
  const suffix = suffixMap[language] || "";
  const localizedKey = suffix ? `${field}${suffix}` : field;
  return item[localizedKey] || item[field] || "";
}
