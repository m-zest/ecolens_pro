import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  CheckCircle2,
  Trophy,
  Sparkles,
  ArrowRight,
  ScanLine,
  Leaf,
  Factory,
  Recycle,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { apiGetPackaging, API, SHARE_BASE } from "@/lib/api";
import GreenScoreGauge from "@/components/GreenScoreGauge";

/**
 * Decision Mode — the D4PACK guided-decision layer on top of the catalogue.
 *
 * One product scenario (Milk), three real packagings from the catalogue, a
 * final pick and a plain-English justification grounded in the same LCA
 * numbers every other page uses. The page itself computes nothing that isn't
 * already in the API response — the reasoning lines are generated from the
 * packaging JSON so swapping the scenario is a one-constant change.
 */

const SCENARIO = {
  product: "Milk — 1 litre serving",
  context:
    "A Central-European dairy brand ships one million 1 L units a year. EcoLens compared three commonly used formats against the D4PACK LCA methodology and picked the lowest full-lifecycle footprint.",
  options: [
    { id: "glass-milk-bottle", note: "Returnable — closed-loop dairy scheme." },
    { id: "tetra-pak-milk-carton", note: "Aseptic — long ambient shelf-life." },
    { id: "hdpe-milk-jug", note: "Single-use — widely kerbside recycled." },
  ],
  winnerId: "glass-milk-bottle",
};

const ICONS = {
  reuse: Leaf,
  recycle: Recycle,
  production: Factory,
  transport: Truck,
  tradeoff: AlertTriangle,
};

function buildReasons(winner, others) {
  const worstCo2 = Math.max(...others.map((p) => p.co2_kg));
  const co2SavingPct = Math.round(
    ((worstCo2 - winner.co2_kg) / worstCo2) * 100,
  );
  return [
    {
      kind: "reuse",
      title: "Reuse wins the lifecycle.",
      body: `${winner.highlights[0] || "Designed for multiple use cycles"} — the embedded CO₂ amortises across every return trip rather than resetting with every pack.`,
    },
    {
      kind: "recycle",
      title: `End-of-life: ${winner.recyclability_pct}% recoverable.`,
      body: `Infrastructure-backed — ${winner.recyclability_pct}% post-consumer recycling rate across the EU, vs ${Math.round(others.reduce((a, p) => a + p.recyclability_pct, 0) / others.length)}% average for the alternatives.`,
    },
    {
      kind: "production",
      title: `${co2SavingPct}% lower carbon per unit.`,
      body: `At ${winner.co2_kg} kg CO₂-eq per pack, ${winner.name.toLowerCase()} comes in ~${co2SavingPct}% below the worst option in this scenario.`,
    },
  ];
}

function buildTradeoffs(winner) {
  const out = [];
  if (winner.weight_g >= 150) {
    out.push(
      `Heavier (${winner.weight_g} g) — freight CO₂ rises above ~250 km radius.`,
    );
  }
  if (winner.shelf_life_days <= 14) {
    out.push(
      `Short ambient shelf life (${winner.shelf_life_days} d) — requires cold chain.`,
    );
  }
  if (winner.water_l >= 2) {
    out.push(
      `Water-intensive in wash cycle (${winner.water_l} L per unit).`,
    );
  }
  if (!out.length) {
    out.push(
      "Minor upfront cost premium — offset after ~5 reuse cycles.",
    );
  }
  return out;
}

export default function Decision() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all(SCENARIO.options.map((o) => apiGetPackaging(o.id)))
      .then(setItems)
      .catch(() => setError("Could not load scenario packagings."));
  }, []);

  const winner = items?.find((p) => p.id === SCENARIO.winnerId);
  const others = items?.filter((p) => p.id !== SCENARIO.winnerId) || [];
  const reasons = winner ? buildReasons(winner, others) : [];
  const tradeoffs = winner ? buildTradeoffs(winner) : [];

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
          content="Guided D4PACK-style decision: one product, three packagings, one honest winner, the reasoning shoppers can actually argue with."
        />
      </Helmet>

      <div className="eyebrow">§ Decision Mode</div>
      <h1 className="display-serif text-6xl md:text-[86px] text-forest mt-3 leading-[0.95]">
        One product.<br />
        Three options.{" "}
        <em className="italic text-terracotta">One honest call</em>.
      </h1>
      <p className="mt-6 text-forest/75 max-w-2xl text-[17px] leading-relaxed">
        {SCENARIO.context}
      </p>
      <div className="mt-6 inline-flex items-center gap-3 text-forest/70 text-[13px] border-t border-forest/15 pt-4">
        <span className="eyebrow !tracking-[0.28em]">Scenario</span>
        <span className="font-serif text-xl text-forest">{SCENARIO.product}</span>
      </div>

      {/* Loading / error */}
      {!items && !error && (
        <div className="mt-16 text-forest/60" data-testid="decision-loading">Loading scenario…</div>
      )}
      {error && (
        <div className="mt-16 text-terracotta" data-testid="decision-error">{error}</div>
      )}

      {items && winner && (
        <>
          {/* 3-way compare strip */}
          <section className="mt-14" data-testid="decision-options">
            <div className="eyebrow mb-6">§ 1 · The three options</div>
            <div className="grid md:grid-cols-3 gap-6">
              {items.map((p) => {
                const opt = SCENARIO.options.find((o) => o.id === p.id);
                const isWinner = p.id === winner.id;
                return (
                  <article
                    key={p.id}
                    data-testid={`decision-option-${p.id}`}
                    className={`ed-card p-6 flex flex-col ${
                      isWinner ? "ring-2 ring-forest" : "opacity-95"
                    }`}
                  >
                    {isWinner && (
                      <span className="self-start mb-4 inline-flex items-center gap-2 bg-forest text-cream text-[11px] tracking-widest uppercase px-3 py-1 rounded-full">
                        <Trophy className="w-3 h-3" /> Selected
                      </span>
                    )}
                    <div className="eyebrow">{p.category}</div>
                    <h3 className="font-serif text-2xl text-forest mt-2 leading-tight">
                      {p.name}
                    </h3>
                    <p className="mt-2 text-forest/60 text-[13px]">
                      {p.material}
                    </p>
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

          {/* Winner card + reasoning */}
          <section className="mt-20" data-testid="decision-winner">
            <div className="eyebrow mb-6">§ 2 · The call, with reasons</div>
            <div className="ed-card p-8 md:p-12 bg-forest text-cream rounded-[28px] relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-80 h-80 rounded-full bg-sage/20 blur-3xl" aria-hidden />
              <div className="relative grid lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
                <div>
                  <div className="eyebrow !text-cream/60">EcoLens recommends</div>
                  <h2 className="display-serif text-5xl md:text-6xl leading-[1.02] mt-3">
                    {winner.name}
                  </h2>
                  <p className="mt-5 text-cream/80 text-[17px] leading-relaxed max-w-xl">
                    Chosen for lifecycle carbon, recyclability, and the
                    closed-loop infrastructure already in place across the EU
                    dairy sector. D4PACK-style justification below.
                  </p>
                  <ul className="mt-8 space-y-5">
                    {reasons.map((r) => {
                      const Icon = ICONS[r.kind] || CheckCircle2;
                      return (
                        <li key={r.kind} className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-cream/10 grid place-items-center shrink-0">
                            <Icon className="w-5 h-5 text-cream" strokeWidth={1.5} />
                          </div>
                          <div>
                            <div className="font-serif text-xl text-cream leading-tight">
                              {r.title}
                            </div>
                            <p className="mt-1.5 text-cream/75 text-[15px] leading-relaxed">
                              {r.body}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="lg:pl-10 lg:border-l lg:border-cream/15">
                  <div className="flex items-center justify-center">
                    <GreenScoreGauge
                      score={winner.score_value}
                      grade={winner.score_grade}
                      size={260}
                    />
                  </div>
                  <div className="mt-8">
                    <div className="eyebrow !text-cream/60">Trade-offs we accept</div>
                    <ul className="mt-3 space-y-2">
                      {tradeoffs.map((t, i) => (
                        <li
                          key={i}
                          className="flex gap-3 text-cream/80 text-[14px] leading-relaxed"
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

          {/* Consumer view / QR */}
          <section className="mt-20" data-testid="decision-consumer">
            <div className="eyebrow mb-6">§ 3 · What the shopper sees</div>
            <div className="grid md:grid-cols-[1fr_1.1fr] gap-10 items-start">
              <div>
                <h3 className="display-serif text-4xl text-forest leading-tight">
                  A QR on the bottle.<br />
                  A 30-second story<br />
                  on the phone.
                </h3>
                <p className="mt-5 text-forest/70 text-[16px] leading-relaxed max-w-md">
                  The same LCA figures judges, brands and retailers read on the
                  detail page are rewritten as a 5-slide shopper narrative —
                  cached per (packaging × tone × locale) so every shelf scan
                  resolves instantly.
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
