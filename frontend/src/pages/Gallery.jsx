import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Users, Sparkles } from "lucide-react";
import { apiListPublicSubmissions, API } from "@/lib/api";

const GRADE_COLOR = {
  A: "bg-score-a/10 text-[#2E7D32] border-[#2E7D32]/30",
  B: "bg-score-b/20 text-[#4a7a22] border-[#7CB342]/40",
  C: "bg-score-c/25 text-[#9a7d0c] border-[#C9A52E]/40",
  D: "bg-score-d/20 text-[#B86414] border-[#FB8C00]/40",
  E: "bg-score-e/15 text-[#B2291D] border-[#D32F2F]/40",
};

const REL = (iso) => {
  const now = new Date();
  const d = new Date(iso);
  const diff = (now - d) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

export default function Gallery() {
  const [items, setItems] = useState(null);
  const [cat, setCat] = useState("All");

  useEffect(() => {
    apiListPublicSubmissions(48).then(setItems).catch(() => setItems([]));
  }, []);

  const categories = items ? ["All", ...Array.from(new Set(items.map((i) => i.category)))] : ["All"];
  const filtered = items ? (cat === "All" ? items : items.filter((i) => i.category === cat)) : [];

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 pt-10 pb-24" data-testid="gallery-page">
      <Helmet>
        <title>Community Gallery — EcoLens</title>
        <meta
          name="description"
          content="Packagings submitted by the EcoLens community — real brands, real numbers, real GreenScores."
        />
      </Helmet>

      <div className="eyebrow">§ Gallery</div>
      <h1 className="display-serif text-6xl md:text-7xl text-forest mt-3 leading-[0.95]">
        Packagings,<br />
        by <em className="italic text-terracotta">the community</em>.
      </h1>
      <p className="mt-5 text-forest/70 max-w-xl text-[16px] leading-relaxed">
        Every report here was submitted by a brand, a designer, or a curious shopper. Numbers are
        modelled with the EcoLens estimator — same methodology as the catalogue, different authors.
      </p>

      {/* Filters */}
      <div className="mt-10 flex items-center justify-between gap-6 flex-wrap border-t border-forest/10 pt-6">
        <div className="flex flex-wrap gap-2" data-testid="gallery-filters">
          {categories.map((c) => (
            <button
              key={c}
              data-testid={`gallery-cat-${c.toLowerCase().replace(/\s/g, "-")}`}
              onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-full text-[13px] border transition-all ${
                cat === c
                  ? "bg-forest text-cream border-forest"
                  : "border-forest/20 text-forest hover:bg-forest/5"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <Link to="/submit" className="btn-primary text-sm inline-flex items-center gap-2" data-testid="gallery-cta-submit">
          <Sparkles className="w-4 h-4" /> Add yours
        </Link>
      </div>

      {/* Content */}
      {items === null && (
        <div className="mt-16 text-forest/60" data-testid="gallery-loading">Loading gallery…</div>
      )}

      {items && filtered.length === 0 && (
        <div
          className="mt-16 ed-card p-16 text-center"
          data-testid="gallery-empty"
        >
          <div className="w-14 h-14 rounded-full bg-sage/30 grid place-items-center mx-auto">
            <Users className="w-6 h-6 text-forest" strokeWidth={1.5} />
          </div>
          <h3 className="display-serif text-4xl text-forest mt-6 leading-tight">
            The gallery is empty — <em className="italic text-terracotta">for now</em>.
          </h3>
          <p className="mt-4 text-forest/70 max-w-md mx-auto">
            Be the first to submit a packaging and tick <em>"Publish to the community gallery"</em>
            {" "}on the last step. Your report will appear here.
          </p>
          <Link to="/submit" className="btn-primary mt-8 inline-flex items-center gap-2" data-testid="gallery-empty-cta">
            Score your packaging <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="gallery-grid">
          {filtered.map((s) => (
            <article key={s.id} className="ed-card overflow-hidden" data-testid={`gallery-card-${s.id}`}>
              <div className="relative">
                <img
                  src={`${API}/submissions/${s.id}/card.png`}
                  alt={`${s.name} EcoLens card`}
                  loading="lazy"
                  className="w-full aspect-[1200/630] object-cover bg-cream-dark"
                />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className={`score-chip w-9 h-9 rounded-full border ${GRADE_COLOR[s.score_grade]} bg-cream/90 backdrop-blur text-[18px]`}>
                    {s.score_grade}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.2em] bg-cream/90 backdrop-blur text-forest px-3 py-1 rounded-full border border-forest/10">
                    {s.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="eyebrow text-forest/60">{s.material}</div>
                <h3 className="font-serif text-xl text-forest leading-tight mt-2">{s.name}</h3>
                <div className="mt-4 flex items-center justify-between text-[13px]">
                  <div className="flex gap-5">
                    <div>
                      <div className="text-forest/55 text-[11px] uppercase tracking-widest">CO₂</div>
                      <div className="font-mono text-forest mt-0.5">{s.co2_kg} kg</div>
                    </div>
                    <div>
                      <div className="text-forest/55 text-[11px] uppercase tracking-widest">Recycled</div>
                      <div className="font-mono text-forest mt-0.5">{s.recyclability_pct}%</div>
                    </div>
                  </div>
                  <div className="text-forest/50 text-[11px] font-mono">{REL(s.created_at)}</div>
                </div>
                {s.reasoning?.[0] && (
                  <p className="mt-4 text-forest/70 text-[14px] leading-relaxed border-t border-forest/10 pt-3">
                    {s.reasoning[0]}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
