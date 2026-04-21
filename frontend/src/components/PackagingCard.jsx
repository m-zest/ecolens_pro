import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const GRADE_COLOR = {
  A: "bg-score-a/10 text-[#2E7D32] border-[#2E7D32]/30",
  B: "bg-score-b/20 text-[#4a7a22] border-[#7CB342]/40",
  C: "bg-score-c/25 text-[#9a7d0c] border-[#C9A52E]/40",
  D: "bg-score-d/20 text-[#B86414] border-[#FB8C00]/40",
  E: "bg-score-e/15 text-[#B2291D] border-[#D32F2F]/40",
};

export default function PackagingCard({ p, featured = false }) {
  return (
    <Link
      to={`/packaging/${p.id}`}
      data-testid={`packaging-card-${p.id}`}
      className={`ed-card group block overflow-hidden ${
        featured ? "md:col-span-2 md:row-span-2" : ""
      }`}
    >
      <div className={`relative overflow-hidden ${featured ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className={`score-chip w-10 h-10 rounded-full border ${GRADE_COLOR[p.score_grade]} bg-cream/90 backdrop-blur`}>
            <span className="text-[20px]">{p.score_grade}</span>
          </span>
          <span className="text-[11px] uppercase tracking-[0.2em] bg-cream/90 backdrop-blur text-forest px-3 py-1 rounded-full border border-forest/10">
            {p.category}
          </span>
        </div>
        <ArrowUpRight className="absolute top-4 right-4 w-8 h-8 p-1.5 rounded-full bg-cream/90 text-forest backdrop-blur opacity-0 group-hover:opacity-100 group-hover:rotate-0 -rotate-45 transition-all duration-500" />
      </div>
      <div className="p-6">
        <div className="eyebrow text-forest/60">{p.material}</div>
        <h3 className={`font-serif text-forest leading-tight mt-2 ${featured ? "text-3xl" : "text-xl"}`}>
          {p.name}
        </h3>
        <div className="mt-4 flex items-center justify-between text-[13px]">
          <div className="flex gap-4">
            <div>
              <div className="text-forest/55 text-[11px] uppercase tracking-widest">CO₂</div>
              <div className="font-mono text-forest mt-0.5">{p.co2_kg} kg</div>
            </div>
            <div>
              <div className="text-forest/55 text-[11px] uppercase tracking-widest">Recycled</div>
              <div className="font-mono text-forest mt-0.5">{p.recyclability_pct}%</div>
            </div>
            <div>
              <div className="text-forest/55 text-[11px] uppercase tracking-widest">Shelf</div>
              <div className="font-mono text-forest mt-0.5">{p.shelf_life_days}d</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
