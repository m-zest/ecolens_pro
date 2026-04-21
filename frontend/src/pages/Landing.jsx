import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Layers3, LineChart, ScanLine, Leaf } from "lucide-react";
import { apiListPackagings, apiStats } from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";
import PackagingCard from "@/components/PackagingCard";

export default function Landing() {
  const { t } = useI18n();
  const [featured, setFeatured] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiListPackagings().then((all) => {
      const best = [...all].sort((a, b) => b.score_value - a.score_value);
      setFeatured([best[0], best[best.length - 1], best[1], best[2]]);
    });
    apiStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div data-testid="landing-page">
      {/* Hero */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-14 pb-28">
          <div className="flex items-center gap-3 mb-8 animate-fade-up">
            <span className="w-10 h-[1px] bg-forest/50" />
            <span className="eyebrow">{t("hero.issue")}</span>
          </div>
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-end">
            <div className="animate-fade-up">
              <h1 className="display-serif text-[54px] sm:text-[78px] lg:text-[96px] text-forest">
                {t("hero.title_a")}<br />
                {t("hero.title_b")}<br />
                {t("hero.title_c")}{" "}
                <em className="italic text-terracotta">
                  {t("hero.title_d")}
                </em>.
              </h1>
              <p className="mt-8 text-forest/75 text-lg leading-relaxed max-w-xl">
                {t("hero.subtitle")}
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link to="/catalog" className="btn-primary inline-flex items-center gap-2" data-testid="hero-cta-explore">
                  {t("cta.open_catalogue")} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/submit" className="btn-ghost inline-flex items-center gap-2" data-testid="hero-cta-submit">
                  {t("cta.score_packaging")}
                </Link>
              </div>
            </div>
            <div className="relative animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <div className="absolute -inset-4 bg-sage/40 rounded-[28px] -z-10 rotate-[-2deg]" />
              <img
                src="https://images.pexels.com/photos/12725398/pexels-photo-12725398.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1080"
                alt="Editorial packaging hero"
                className="rounded-[24px] w-full h-[520px] object-cover shadow-[0_30px_80px_rgba(26,54,45,0.18)]"
              />
              <div className="absolute bottom-5 left-5 right-5 bg-cream/95 backdrop-blur border border-forest/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="eyebrow">Cover · Kraft paper wrap</div>
                  <div className="font-serif text-forest text-xl mt-1">+84 GreenScore</div>
                </div>
                <div className="score-chip w-12 h-12 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] text-2xl border border-[#2E7D32]/30">A</div>
              </div>
            </div>
          </div>
        </div>

        {/* dotted rule + marquee */}
        <div className="border-y border-forest/10 bg-cream-dark/40">
          <div className="max-w-full overflow-hidden py-5">
            <div className="marquee-track">
              {[...Array(2)].map((_, k) => (
                <div className="flex gap-16 shrink-0" key={k}>
                  {[
                    "Ecoinvent v3.9",
                    "EU PEF",
                    "D4PACK",
                    "FSC",
                    "ISO 14040",
                    "EN 13432",
                    "EPR",
                    "DRS",
                    "MRF",
                    "cradle-to-grave",
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="display-serif text-forest/90 text-2xl italic">{t}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-forest/30" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats editorial row */}
      {stats && (
        <section className="max-w-7xl mx-auto px-6 md:px-10 py-24">
          <div className="eyebrow">§ 1 · {t("stats.title")}</div>
          <div className="grid md:grid-cols-4 gap-10 mt-6 border-t border-forest/15 pt-10">
            <StatBlock value={stats.packaging_count} label={t("stats.count")} />
            <StatBlock value={stats.categories} label={t("stats.categories")} />
            <StatBlock value={stats.avg_co2_kg.toFixed(2) + " kg"} label={t("stats.avg_co2")} />
            <StatBlock value={stats.avg_recyclability_pct.toFixed(0) + "%"} label={t("stats.avg_rec")} />
          </div>
        </section>
      )}

      {/* Featured bento */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="eyebrow">§ 2 · In this issue</div>
            <h2 className="display-serif text-5xl md:text-6xl text-forest mt-4">
              Four packagings,<br />
              <em className="italic text-terracotta">four stories</em>.
            </h2>
          </div>
          <Link to="/catalog" className="hidden md:inline-flex items-center gap-2 link-underline text-forest" data-testid="featured-view-all">
            {t("cta.view_all")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6 auto-rows-[minmax(0,_1fr)]">
          {featured.filter(Boolean).map((p, i) => (
            <PackagingCard key={p.id} p={p} featured={i === 0} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-24 border-t border-forest/10">
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-12">
          <div>
            <div className="eyebrow">§ 3 · Method</div>
            <h2 className="display-serif text-5xl text-forest mt-4">
              From spreadsheet<br />
              to <em className="italic text-terracotta">shopper</em>.
            </h2>
            <p className="mt-6 text-forest/75 text-[17px] leading-relaxed max-w-md">
              EcoLens sits on top of the D4PACK Early Guidance Tool (EGeT). We take structured LCA
              outputs — CO₂, water, energy, recyclability, shelf-life — and turn them into a
              visual score, a five-slide story, and an honest comparison.
            </p>
          </div>
          <ol className="grid gap-5">
            {[
              {
                n: "01",
                title: "Scan or search",
                body: "Open the catalogue or submit your own packaging. Values are drawn from public LCA datasets.",
                icon: ScanLine,
              },
              {
                n: "02",
                title: "See the score",
                body: "An A-to-E GreenScore synthesises CO₂, recyclability, material intensity and transport.",
                icon: LineChart,
              },
              {
                n: "03",
                title: "Read the story",
                body: "Claude Sonnet 4.5 writes a 5-slide narrative grounded in your specific numbers — trade-offs named.",
                icon: Sparkles,
              },
              {
                n: "04",
                title: "Compare & decide",
                body: "Put two packagings head-to-head. The deltas are the point.",
                icon: Layers3,
              },
            ].map((s) => (
              <li key={s.n} className="flex gap-6 items-start pb-5 border-b border-forest/10 last:border-none">
                <div className="font-mono text-forest/50 text-sm pt-1 w-10">{s.n}</div>
                <div className="w-11 h-11 rounded-full bg-forest/8 grid place-items-center shrink-0">
                  <s.icon className="w-5 h-5 text-forest" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="font-serif text-forest text-2xl leading-tight">{s.title}</div>
                  <p className="mt-2 text-forest/70 text-[15px] leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-20">
        <div className="bg-forest text-cream rounded-[28px] p-10 md:p-16 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-80 h-80 rounded-full bg-sage/20 blur-3xl" aria-hidden />
          <div className="absolute right-20 bottom-10 opacity-80 animate-slow-spin" aria-hidden>
            <Leaf className="w-16 h-16 text-sage/80" strokeWidth={1} />
          </div>
          <div className="relative max-w-2xl">
            <div className="eyebrow !text-cream/60">§ 4 · For brands</div>
            <h2 className="display-serif text-5xl md:text-6xl mt-4 leading-[1.02]">
              Are <em className="italic">your</em> packaging claims<br />actually true?
            </h2>
            <p className="mt-6 text-cream/80 text-[17px] leading-relaxed max-w-xl">
              Paste your packaging specs and get an instant EcoLens report. Plausible LCA, honest
              grade, shareable narrative — ready for the shelf.
            </p>
            <Link to="/submit" className="mt-8 inline-flex items-center gap-2 px-7 py-4 rounded-full bg-cream text-forest font-medium hover:bg-white transition-all" data-testid="cta-submit-own">
              Score your packaging <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatBlock({ value, label }) {
  return (
    <div>
      <div className="display-serif text-forest text-5xl md:text-6xl leading-none">{value}</div>
      <div className="mt-3 text-forest/65 text-[13px] leading-snug max-w-[200px]">{label}</div>
    </div>
  );
}
