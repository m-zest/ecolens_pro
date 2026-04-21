"""
Lightweight i18n for EcoLens. Covers four locales used in the D4PACK region:
  en — English (default)
  it — Italian
  de — German
  pl — Polish

Translations are intentionally scoped to a handful of high-impact UI strings and
to the AI-narrative locale instruction. Raw LCA numbers and packaging names stay
in English (industry convention) so data remains comparable across locales.
"""
from __future__ import annotations

SUPPORTED = ["en", "it", "de", "pl"]
DEFAULT = "en"

LANG_NAMES = {
    "en": "English",
    "it": "Italian",
    "de": "German",
    "pl": "Polish",
}


def narrative_locale_line(locale: str) -> str:
    if locale not in SUPPORTED or locale == DEFAULT:
        return ""
    lang = LANG_NAMES.get(locale, "English")
    return f"- Write all titles and bodies in {lang}. Keep numeric values, units, and chemical notation unchanged."


# UI strings surfaced to the frontend (see /api/i18n).
UI = {
    "en": {
        "hero.issue": "Issue № 01 · Packaging, honestly",
        "hero.title_a": "The carton",
        "hero.title_b": "in your hand",
        "hero.title_c": "has a",
        "hero.title_d": "footprint",
        "hero.subtitle": "EcoLens turns dense life-cycle data from the D4PACK programme into a 30-second narrative — the CO₂, the water, the shelf life, the trade-offs. No greenwash, no shouting, just the numbers, told well.",
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
    },
    "it": {
        "hero.issue": "Numero № 01 · Imballaggi, onestamente",
        "hero.title_a": "Il cartone",
        "hero.title_b": "che hai in mano",
        "hero.title_c": "ha un'",
        "hero.title_d": "impronta",
        "hero.subtitle": "EcoLens trasforma i densi dati del ciclo di vita del programma D4PACK in una narrazione di 30 secondi — CO₂, acqua, durata in frigo, compromessi. Nessun greenwashing, solo numeri, raccontati bene.",
        "cta.open_catalogue": "Apri il catalogo",
        "cta.score_packaging": "Valuta il tuo imballaggio",
        "cta.explore_data": "Esplora i dati",
        "cta.view_all": "Vedi tutto",
        "cta.compare": "Confronta",
        "cta.share": "Condividi",
        "cta.copied": "Copiato",
        "cta.download_card": "Scarica scheda",
        "nav.catalogue": "Catalogo",
        "nav.compare": "Confronta",
        "nav.submit": "Invia",
        "nav.method": "Metodo",
        "stats.title": "In sintesi",
        "stats.count": "Imballaggi catalogati",
        "stats.categories": "Categorie alimentari",
        "stats.avg_co2": "CO₂ media per unità",
        "stats.avg_rec": "Riciclabilità media (UE)",
    },
    "de": {
        "hero.issue": "Ausgabe № 01 · Verpackung, ehrlich",
        "hero.title_a": "Der Karton",
        "hero.title_b": "in deiner Hand",
        "hero.title_c": "hat einen",
        "hero.title_d": "Fußabdruck",
        "hero.subtitle": "EcoLens verwandelt dichte Lebenszyklus-Daten aus dem D4PACK-Programm in eine 30-Sekunden-Geschichte — CO₂, Wasser, Haltbarkeit, Kompromisse. Kein Greenwashing, nur Zahlen, gut erzählt.",
        "cta.open_catalogue": "Katalog öffnen",
        "cta.score_packaging": "Verpackung bewerten",
        "cta.explore_data": "Daten erkunden",
        "cta.view_all": "Alle ansehen",
        "cta.compare": "Vergleichen",
        "cta.share": "Teilen",
        "cta.copied": "Kopiert",
        "cta.download_card": "Karte herunterladen",
        "nav.catalogue": "Katalog",
        "nav.compare": "Vergleich",
        "nav.submit": "Einreichen",
        "nav.method": "Methode",
        "stats.title": "Auf einen Blick",
        "stats.count": "Katalogisierte Verpackungen",
        "stats.categories": "Lebensmittel-Kategorien",
        "stats.avg_co2": "Ø CO₂ pro Einheit",
        "stats.avg_rec": "Ø Recyclingfähigkeit (EU)",
    },
    "pl": {
        "hero.issue": "Numer № 01 · Opakowania, uczciwie",
        "hero.title_a": "Karton",
        "hero.title_b": "w twojej dłoni",
        "hero.title_c": "ma swój",
        "hero.title_d": "ślad",
        "hero.subtitle": "EcoLens zamienia gęste dane LCA z programu D4PACK w 30-sekundową opowieść — CO₂, woda, trwałość, kompromisy. Bez greenwashingu, tylko liczby, opowiedziane dobrze.",
        "cta.open_catalogue": "Otwórz katalog",
        "cta.score_packaging": "Oceń swoje opakowanie",
        "cta.explore_data": "Zobacz dane",
        "cta.view_all": "Zobacz wszystkie",
        "cta.compare": "Porównaj",
        "cta.share": "Udostępnij",
        "cta.copied": "Skopiowano",
        "cta.download_card": "Pobierz kartę",
        "nav.catalogue": "Katalog",
        "nav.compare": "Porównanie",
        "nav.submit": "Zgłoś",
        "nav.method": "Metoda",
        "stats.title": "W skrócie",
        "stats.count": "Skatalogowane opakowania",
        "stats.categories": "Kategorie żywności",
        "stats.avg_co2": "Średnie CO₂ na jednostkę",
        "stats.avg_rec": "Średnia recyklowalność (UE)",
    },
}


def get_ui(locale: str) -> dict:
    return UI.get(locale, UI[DEFAULT])
