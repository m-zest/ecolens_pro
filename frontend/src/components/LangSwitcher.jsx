import { Globe } from "lucide-react";
import { LOCALES, useI18n } from "@/i18n/I18nContext";

export default function LangSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex items-center gap-1.5" data-testid="lang-switcher">
      <Globe className="w-3.5 h-3.5 text-forest/60" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        aria-label="Language"
        data-testid="lang-select"
        className="bg-transparent text-forest/80 text-[12px] font-medium uppercase tracking-[0.15em] cursor-pointer focus:outline-none"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.code.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
