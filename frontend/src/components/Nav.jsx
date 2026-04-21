import { Link, NavLink } from "react-router-dom";
import { Leaf } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import LangSwitcher from "@/components/LangSwitcher";

export default function Nav() {
  const { t } = useI18n();
  const linkBase = "text-sm text-forest/80 hover:text-forest transition-colors";
  const linkActive = "text-forest font-medium";

  return (
    <header
      data-testid="main-nav"
      className="sticky top-0 z-40 border-b border-forest/10 backdrop-blur-md bg-cream/75"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
          <div className="relative w-8 h-8 rounded-full bg-forest text-cream grid place-items-center">
            <Leaf className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="flex items-baseline gap-[1px]">
            <span className="display-serif text-[22px] text-forest">Eco</span>
            <span className="display-serif italic text-[22px] text-terracotta">Lens</span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/catalog" data-testid="nav-catalog" className={({ isActive }) => `${linkBase} link-underline ${isActive ? linkActive : ""}`}>
            {t("nav.catalogue")}
          </NavLink>
          <NavLink to="/compare" data-testid="nav-compare" className={({ isActive }) => `${linkBase} link-underline ${isActive ? linkActive : ""}`}>
            {t("nav.compare")}
          </NavLink>
          <NavLink to="/submit" data-testid="nav-submit" className={({ isActive }) => `${linkBase} link-underline ${isActive ? linkActive : ""}`}>
            {t("nav.submit")}
          </NavLink>
          <NavLink to="/gallery" data-testid="nav-gallery" className={({ isActive }) => `${linkBase} link-underline ${isActive ? linkActive : ""}`}>
            Gallery
          </NavLink>
          <NavLink to="/about" data-testid="nav-about" className={({ isActive }) => `${linkBase} link-underline ${isActive ? linkActive : ""}`}>
            {t("nav.method")}
          </NavLink>
        </nav>
        <div className="flex items-center gap-5">
          <LangSwitcher />
          <Link to="/catalog" className="btn-primary text-sm hidden sm:inline-flex" data-testid="nav-cta">
            {t("cta.explore_data")}
          </Link>
        </div>
      </div>
    </header>
  );
}
