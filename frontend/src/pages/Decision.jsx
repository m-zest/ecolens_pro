import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  CheckCircle2,
  Trophy,
  Sparkles,
  ArrowRight,
  ScanLine,
  AlertTriangle,
  ShieldAlert,
  Lock,
  Clock,
  XCircle,
} from "lucide-react";
import { apiGetPackaging, API, SHARE_BASE } from "@/lib/api";
import GreenScoreGauge from "@/components/GreenScoreGauge";

/**
 * Decision Mode — the D4PACK-in-the-loop layer.
 *
 * Strong story (not "we picked the highest score"):
 *   1. D4PACK recommended the most sustainable option on paper.
 *   2. That option fails a hard real-world constraint (vacuum barrier).
 *   3. We override D4PACK and pick a worse-on-paper but feasible option.
 *   4. We name the trade-offs honestly.
 *
 * All three packagings resolve to real catalogue entries so the LCA
 * numbers on the cards stay consistent with the rest of the app.
 */

const SCENARIO = {
  product: "Fresh-cut potatoes under vacuum",
  persona:
    "Traditional SME producer · limited R&D capacity · cost-sensitive · regional distribution",
  source: "D4PACK Early Guidance Tool · survey run 22 Apr 2026",
  context:
    "A mid-size Central-European producer wants a packaging recommendation for vacuum-sealed fresh-cut potatoes. Sustainability matters — but the packaging has to hold a vacuum or the product spoils in three days. This is what happens when the technical tool's top pick doesn't survive contact with reality.",
  d4pack: {
    recommendedId: "kraft-paper-wrap",
    label: "D4PACK TOP RECOMMENDATION",
    reason:
      "Paper pouch wins on cradle-to-grave impact, recyclability and EU end-of-life infrastructure. On sustainability metrics alone, it's the right answer.",
  },
  options: [
    {
      id: "kraft-paper-wrap",
      role: "d4pack_pick",
      note: "D4PACK's top pick on sustainability metrics — but it cannot hold a vacuum.",
    },
    {
      id: "stand-up-pouch",
      role: "our_pick",
      note: "Multi-layer barrier. The only option that actually keeps the product edible for two weeks.",
    },
    {
      id: "bioplastic-pla-tray",
      role: "also_considered",
      note: "Compostable, visually premium. Barrier properties still marginal for vacuum — not a reliable solution.",
    },
  ],
  selectedId: "stand-up-pouch",
  overrideReasoning: [
    {
      icon: "lock",
      title: "Paper cannot maintain a vacuum.",
      body:
        "Fresh-cut potatoes oxidise within hours without a vacuum seal. Paper — by design — is air-permeable. The D4PACK winner fails the most basic functional test for this product.",
    },
    {
      icon: "clock",
      title: "Barrier film buys 14 days of shelf life.",
      body:
        "The multi-layer laminate keeps oxygen out and moisture stable. Shelf life goes from ~3 days (paper) to 14+ days (laminate) — four times less in-store waste.",
    },
    {
      icon: "warning",
      title: "Food waste outweighs packaging waste.",
      body:
        "One kilogram of wasted potatoes carries ~2.9 kg CO₂-eq. Ten grams more packaging to save that kilo from the bin is the right trade, every time.",
    },
  ],
  tradeoffs: [
    "Lower recyclability (~5 % vs paper's 85 %) — multi-layer laminate isn't kerbside recyclable in most EU MRFs.",
    "Higher material complexity — PET + Al + PE layers mean the value chain is harder to decarbonise upstream.",
    "Slight per-unit cost premium vs kraft paper — offset by the drop in spoilage write-offs.",
  ],
};

const REASON_ICON = {
  lock: Lock,
  clock: Clock,
  warning: AlertTriangle,
  shield: ShieldAlert,
  override: XCircle,
};

export default function Decision() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all(SCENARIO.options.map((o) => apiGetPackaging(o.id)))
      .then(setItems)
      .catch(() => setError("Could not load scenario packagings."));
  }, []);

  const winner = items?.find((p) => p.id === SCENARIO.selectedId);
  const d4packPick = items?.find((p) => p.id === SCENARIO.d4pack.recommendedId);

  const shareUrl = winner
    ? `${SHARE_BASE || (typeof window !== "undefined" ? window.location.origin : "")}/share/packaging/${winner.id}`
    : "";
  const cardUrl = winner ? `${API}/packagings/${winner.id}/card.png` : "";

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 pt-10 pb-24" data-testid="decision-page">
      <Helmet>
        <title>Decision Mode — EcoLens</title>
        <meta
          name="description"
          content="When D4PACK's most sustainable recommendation doesn't survive reality — how EcoLens overrides the tool and names the trade-offs honestly."
        />
      </Helmet>

      {/* Source / provenance block */}
      <div className="eyebrow">§ 0 · Source</div>
      <p className="mt-2 text-forest/75 text-[14px] font-mono">
        {SCENARIO.source}
      </p>

      <div className="mt-6 eyebrow">§ Decision Mode</div>
      <h1 className="display-serif text-5xl md:text-[82px] text-forest mt-3 leading-[0.95]">
        When the greenest option<br />
        <em className="italic text-terracotta">doesn't survive reality</em>.
      </h1>
      <p className="mt-6 text-forest/80 max-w-2xl text-[17px] leading-relaxed">
        {SCENARIO.context}
      </p>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="border-t border-forest/15 pt-4">
          <div className="eyebrow !tracking-[0.28em]">Product</div>
          <div className="font-serif text-xl text-forest mt-1">{SCENARIO.product}</div>
        </div>
        <div className="border-t border-forest/15 pt-4">
          <div className="eyebrow !tracking-[0.28em]">Persona</div>
          <div className="font-serif text-[17px] text-forest/85 mt-1 leading-snug">{SCENARIO.persona}</div>
        </div>
      </div>

      {/* Loading / error */}
      {!items && !error && (
        <div className="mt-16 text-forest/60" data-testid="decision-loading">Loading scenario…</div>
      )}
      {error && (
        <div className="mt-16 text-terracotta" data-testid="decision-error">{error}</div>
      )}

      {items && winner && d4packPick && (
        <>
          {/* 1 — What D4PACK suggested */}
          <section className="mt-20" data-testid="decision-d4pack-suggestion">
            <div className="eyebrow mb-6">§ 1 · What D4PACK suggested</div>
            <div className="ed-card p-8 md:p-10 grid md:grid-cols-[auto_1fr] gap-8 items-center border-l-4 border-sage">
              <div className="flex items-center justify-center">
                <GreenScoreGauge
                  score={d4packPick.score_value}
                  grade={d4packPick.score_grade}
                  size={160}
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-sage/25 text-forest text-[11px] tracking-widest uppercase px-3 py-1 rounded-full">
                  <Trophy className="w-3 h-3" /> {SCENARIO.d4pack.label}
                </div>
                <h2 className="display-serif text-4xl text-forest mt-3 leading-tight">
                  {d4packPick.name}
                </h2>
                <p className="mt-2 text-forest/60 text-[14px]">{d4packPick.material}</p>
                <p className="mt-4 text-forest/80 text-[16px] leading-relaxed max-w-2xl">
                  {SCENARIO.d4pack.reason}
                </p>
              </div>
            </div>
          </section>

          {/* 2 — Why it doesn't work */}
          <section className="mt-20" data-testid="decision-why-fails">
            <div className="eyebrow mb-6">§ 2 · Why it doesn't work</div>
            <div
              className="p-8 md:p-12 rounded-[28px] relative overflow-hidden shadow-[0_20px_60px_rgba(194,89,52,0.18)] border border-terracotta/30"
              style={{ background: "#C25934", color: "#F4F1EA" }}
            >
              <div className="absolute -right-10 -top-10 w-80 h-80 rounded-full bg-cream/10 blur-3xl" aria-hidden />
              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-cream/15 text-cream text-[11px] tracking-widest uppercase px-3 py-1 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> Tool recommendation overridden
                </div>
                <h2 className="display-serif text-4xl md:text-5xl leading-[1.02] mt-4">
                  Paper can't keep a vacuum.
                </h2>
                <p className="mt-5 text-cream/90 text-[17px] leading-relaxed max-w-2xl">
                  The sustainability score says one thing. The product says another.
                  Fresh-cut potatoes oxidise in hours without an airtight seal —
                  D4PACK's top pick fails the first functional test for this SKU.
                </p>
                <ul className="mt-8 space-y-5">
                  {SCENARIO.overrideReasoning.map((r, i) => {
                    const Icon = REASON_ICON[r.icon] || XCircle;
                    return (
                      <li key={i} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-cream/15 grid place-items-center shrink-0">
                          <Icon className="w-5 h-5 text-cream" strokeWidth={1.5} />
                        </div>
                        <div>
                          <div className="font-serif text-xl text-cream leading-tight">{r.title}</div>
                          <p className="mt-1.5 text-cream/85 text-[15px] leading-relaxed max-w-2xl">
                            {r.body}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>

          {/* 3 — The three options side-by-side */}
          <section className="mt-20" data-testid="decision-options">
            <div className="eyebrow mb-6">§ 3 · The options we weighed</div>
            <div className="grid md:grid-cols-3 gap-6">
              {items.map((p) => {
                const opt = SCENARIO.options.find((o) => o.id === p.id);
                const role = opt?.role;
                const isWinner = role === "our_pick";
                const isD4pack = role === "d4pack_pick";
                return (
                  <article
                    key={p.id}
                    data-testid={`decision-option-${p.id}`}
                    className={`ed-card p-6 flex flex-col ${
                      isWinner ? "ring-2 ring-forest" : isD4pack ? "ring-1 ring-sage" : "opacity-95"
                    }`}
                  >
                    {isWinner && (
                      <span className="self-start mb-4 inline-flex items-center gap-2 bg-forest text-cream text-[11px] tracking-widest uppercase px-3 py-1 rounded-full">
                        <Trophy className="w-3 h-3" /> Our pick
                      </span>
                    )}
                    {isD4pack && (
                      <span className="self-start mb-4 inline-flex items-center gap-2 bg-sage/30 text-forest text-[11px] tracking-widest uppercase px-3 py-1 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> D4PACK's pick · rejected
                      </span>
                    )}
                    {!isWinner && !isD4pack && (
                      <span className="self-start mb-4 inline-flex items-center gap-2 bg-ochre/20 text-forest text-[11px] tracking-widest uppercase px-3 py-1 rounded-full">
                        Also considered
                      </span>
                    )}
                    <div className="eyebrow">{p.category}</div>
                    <h3 className="font-serif text-2xl text-forest mt-2 leading-tight">
                      {p.name}
                    </h3>
                    <p className="mt-2 text-forest/60 text-[13px]">{p.material}</p>
                    <div className="mt-4 flex items-center gap-4">
                      <GreenScoreGauge
                        score={p.score_value}
                        grade={p.score_grade}
                        size={110}
                      />
                      <dl className="flex-1 text-[13px]">
                        <div className="flex justify-between border-b border-forest/10 py-1">
                          <dt className="text-forest/55 text-[11px] uppercase tracking-widest">CO₂</dt>
                          <dd className="font-mono text-forest">{p.co2_kg} kg</dd>
                        </div>
                        <div className="flex justify-between border-b border-forest/10 py-1">
                          <dt className="text-forest/55 text-[11px] uppercase tracking-widest">Recycled</dt>
                          <dd className="font-mono text-forest">{p.recyclability_pct}%</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-forest/55 text-[11px] uppercase tracking-widest">Shelf</dt>
                          <dd className="font-mono text-forest">{p.shelf_life_days}d</dd>
                        </div>
                      </dl>
                    </div>
                    <p className="mt-4 text-forest/70 text-[13px] leading-relaxed border-t border-forest/10 pt-3">
                      {opt?.note}
                    </p>
                    <Link
                      to={`/packaging/${p.id}`}
                      className="mt-4 inline-flex items-center gap-2 link-underline text-forest text-[13px]"
                      data-testid={`decision-detail-${p.id}`}
                    >
                      Full lifecycle <ArrowRight className="w-3 h-3" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>

          {/* 4 — Our decision */}
          <section className="mt-20" data-testid="decision-winner">
            <div className="eyebrow mb-6">§ 4 · Our decision</div>
            <div
              className="p-8 md:p-12 rounded-[28px] relative overflow-hidden shadow-[0_20px_60px_rgba(26,54,45,0.18)] border border-forest/20"
              style={{ background: "#1A362D", color: "#F4F1EA" }}
            >
              <div className="absolute -right-10 -top-10 w-80 h-80 rounded-full bg-sage/20 blur-3xl" aria-hidden />
              <div className="relative grid lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
                <div>
                  <div className="eyebrow !text-cream/60">EcoLens selects</div>
                  <h2 className="display-serif text-5xl md:text-6xl leading-[1.02] mt-3">
                    {winner.name}
                  </h2>
                  <p className="mt-5 text-cream/85 text-[17px] leading-relaxed max-w-xl">
                    The less-sustainable option on paper, the only viable one in
                    practice. The barrier properties are the whole point — without
                    them the product spoils and the entire LCA argument collapses.
                  </p>
                </div>
                <div className="lg:pl-10 lg:border-l lg:border-cream/15">
                  <div className="flex items-center justify-center">
                    <GreenScoreGauge
                      score={winner.score_value}
                      grade={winner.score_grade}
                      size={240}
                    />
                  </div>
                  <div className="mt-8">
                    <div className="eyebrow !text-cream/60">Trade-offs we accept</div>
                    <ul className="mt-3 space-y-2">
                      {SCENARIO.tradeoffs.map((t, i) => (
                        <li
                          key={i}
                          className="flex gap-3 text-cream/85 text-[14px] leading-relaxed"
                        >
                          <AlertTriangle className="w-4 h-4 text-ochre shrink-0 mt-0.5" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5 — Consumer view */}
          <section className="mt-20" data-testid="decision-consumer">
            <div className="eyebrow mb-6">§ 5 · What the shopper sees</div>
            <div className="grid md:grid-cols-[1fr_1.1fr] gap-10 items-start">
              <div>
                <h3 className="display-serif text-4xl text-forest leading-tight">
                  A QR on the pack.<br />
                  An honest 30-second<br />
                  story on the phone.
                </h3>
                <p className="mt-5 text-forest/75 text-[16px] leading-relaxed max-w-md">
                  Not "this packaging is green." The actual trade-off, named out
                  loud — so shoppers stop rewarding shallow claims and brands
                  stop hiding behind them.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to={`/packaging/${winner.id}`}
                    className="btn-primary inline-flex items-center gap-2"
                    data-testid="decision-see-story"
                  >
                    <Sparkles className="w-4 h-4" /> See the AI story
                  </Link>
                  <a
                    href={cardUrl}
                    download={`ecolens-${winner.id}.png`}
                    className="btn-ghost inline-flex items-center gap-2"
                    data-testid="decision-download-card"
                  >
                    <ScanLine className="w-4 h-4" /> Download shelf card
                  </a>
                </div>
                <p className="mt-6 text-forest/55 text-[12px] font-mono break-all">
                  {shareUrl}
                </p>
              </div>
              <div className="relative">
                <div className="absolute -inset-3 bg-sage/30 rounded-[26px] rotate-[-1.5deg] -z-10" aria-hidden />
                <img
                  src={cardUrl}
                  alt={`${winner.name} EcoLens share card`}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 630'><rect width='1200' height='630' fill='%23EAE5D9'/><text x='600' y='330' font-family='serif' font-size='80' text-anchor='middle' fill='%231A362D' font-style='italic'>EcoLens</text></svg>`;
                  }}
                  className="w-full aspect-[1200/630] object-cover rounded-[22px] shadow-[0_30px_80px_rgba(26,54,45,0.18)]"
                />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
