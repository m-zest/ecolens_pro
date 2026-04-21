import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { API } from "@/lib/api";

/**
 * Minimal i18n context. UI strings are fetched from the backend and cached in
 * localStorage. Missing keys fall back to English baked into the default map.
 */

export const LOCALES = [
  { code: "en", label: "English" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
  { code: "pl", label: "Polski" },
];

// English baseline — safe fallback if the backend is unreachable on first load.
export const DEFAULT_STRINGS = {
  "hero.issue": "Issue № 01 · Packaging, honestly",
  "hero.title_a": "The carton",
  "hero.title_b": "in your hand",
  "hero.title_c": "has a",
  "hero.title_d": "footprint",
  "hero.subtitle":
    "EcoLens turns dense life-cycle data from the D4PACK programme into a 30-second narrative — the CO₂, the water, the shelf life, the trade-offs. No greenwash, no shouting, just the numbers, told well.",
  "cta.open_catalogue": "Open the catalogue",
  "cta.score_packaging": "Score your packaging",
  "cta.explore_data": "Explore data",
  "cta.view_all": "View all",
  "cta.compare": "Compare",
  "cta.share": "Share",
  "cta.copied": "Copied",
  "cta.download_card": "Download card",
  "nav.catalogue": "Catalogue",
  "nav.compare": "Compare",
  "nav.submit": "Submit",
  "nav.method": "Method",
  "stats.title": "At a glance",
  "stats.count": "Packagings catalogued",
  "stats.categories": "Food categories",
  "stats.avg_co2": "Avg CO₂ per unit",
  "stats.avg_rec": "Avg recyclability (EU)",
};

const I18nCtx = createContext({
  locale: "en",
  setLocale: () => {},
  t: (k) => DEFAULT_STRINGS[k] || k,
});

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => localStorage.getItem("ecolens.locale") || "en");
  const [strings, setStrings] = useState(DEFAULT_STRINGS);

  useEffect(() => {
    localStorage.setItem("ecolens.locale", locale);
    if (locale === "en") {
      setStrings(DEFAULT_STRINGS);
      return;
    }
    let alive = true;
    fetch(`${API}/i18n/${locale}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive && d?.strings) setStrings({ ...DEFAULT_STRINGS, ...d.strings });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [locale]);

  const t = useCallback((key) => strings[key] || DEFAULT_STRINGS[key] || key, [strings]);
  const setLocale = useCallback((l) => setLocaleState(l), []);

  return <I18nCtx.Provider value={{ locale, setLocale, t }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return useContext(I18nCtx);
}
