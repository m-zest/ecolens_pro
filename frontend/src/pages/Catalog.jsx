import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { apiListPackagings, apiGetCategories } from "@/lib/api";
import PackagingCard from "@/components/PackagingCard";

export default function Catalog() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("best");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetCategories().then(setCats);
  }, []);

  useEffect(() => {
    setLoading(true);
    apiListPackagings({ category: cat === "All" ? undefined : cat, q: q || undefined })
      .then(setItems)
      .finally(() => setLoading(false));
  }, [cat, q]);

  const sorted = useMemo(() => {
    const arr = [...items];
    if (sort === "best") arr.sort((a, b) => b.score_value - a.score_value);
    if (sort === "worst") arr.sort((a, b) => a.score_value - b.score_value);
    if (sort === "co2") arr.sort((a, b) => a.co2_kg - b.co2_kg);
    return arr;
  }, [items, sort]);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 pt-10 pb-24" data-testid="catalog-page">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="eyebrow">§ Catalogue</div>
          <h1 className="display-serif text-6xl md:text-7xl text-forest mt-3 leading-[0.95]">
            Twenty-five packagings,<br />
            graded <em className="italic text-terracotta">honestly</em>.
          </h1>
          <p className="mt-5 text-forest/70 max-w-xl text-[16px] leading-relaxed">
            Filter by category, search a material, sort by GreenScore. Tap any card to read the full
            lifecycle story.
          </p>
        </div>
        <div className="relative w-full md:w-80" data-testid="catalog-search-wrap">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/50" />
          <input
            data-testid="catalog-search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search material or name…"
            className="w-full bg-white border border-forest/15 rounded-full pl-11 pr-4 py-3 text-[15px] focus:outline-none focus:border-forest"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mt-10 flex items-center justify-between gap-6 flex-wrap border-t border-forest/10 pt-6">
        <div className="flex flex-wrap gap-2" data-testid="catalog-categories">
          {["All", ...cats].map((c) => (
            <button
              key={c}
              data-testid={`catalog-cat-${c.toLowerCase().replace(/\s/g, "-")}`}
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
        <div className="flex items-center gap-2" data-testid="catalog-sort">
          <span className="eyebrow">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-white border border-forest/15 rounded-full px-4 py-2 text-[13px] text-forest font-medium cursor-pointer"
            data-testid="catalog-sort-select"
          >
            <option value="best">Best first</option>
            <option value="worst">Worst first</option>
            <option value="co2">Lowest CO₂</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="mt-16 text-forest/60" data-testid="catalog-loading">Loading catalogue…</div>
      ) : sorted.length === 0 ? (
        <div className="mt-16 text-forest/60" data-testid="catalog-empty">No packagings match your filters.</div>
      ) : (
        <div className="mt-10 grid md:grid-cols-3 gap-6" data-testid="catalog-grid">
          {sorted.map((p) => (
            <PackagingCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
