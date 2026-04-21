import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Swords, Trophy, Minus, Plus } from "lucide-react";
import { apiListPackagings, apiCompare } from "@/lib/api";
import GreenScoreGauge from "@/components/GreenScoreGauge";

export default function Compare() {
  const [params, setParams] = useSearchParams();
  const [options, setOptions] = useState([]);
  const [a, setA] = useState(params.get("a") || "");
  const [b, setB] = useState(params.get("b") || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiListPackagings().then((all) => {
      setOptions(all);
      if (!a) setA(all[0].id);
      if (!b) setB(all[1].id);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (a && b && a !== b) {
      setLoading(true);
      apiCompare(a, b)
        .then(setResult)
        .finally(() => setLoading(false));
      setParams({ a, b });
    } else {
      setResult(null);
    }
  }, [a, b]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 pt-10 pb-24" data-testid="compare-page">
      <div className="eyebrow">§ Compare</div>
      <h1 className="display-serif text-6xl md:text-7xl text-forest mt-3 leading-[0.95]">
        Two packagings.<br />
        <em className="italic text-terracotta">One honest answer</em>.
      </h1>
      <p className="mt-6 text-forest/70 max-w-xl text-[16px] leading-relaxed">
        Pick any pair from the catalogue. We'll put CO₂, water, recyclability and shelf life side by
        side — and tell you which wins on the GreenScore.
      </p>

      <div className="mt-10 grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
        <Picker value={a} onChange={setA} options={options} label="Packaging A" testIdBase="compare-select-a" />
        <div className="self-center justify-self-center w-14 h-14 rounded-full bg-forest text-cream grid place-items-center">
          <Swords className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <Picker value={b} onChange={setB} options={options} label="Packaging B" testIdBase="compare-select-b" />
      </div>

      {loading && <div className="mt-12 text-forest/60" data-testid="compare-loading">Comparing…</div>}

      {result && a !== b && (
        <div className="mt-14" data-testid="compare-results">
          {/* Winner */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <Trophy className="w-5 h-5 text-terracotta" />
            <div className="font-serif text-forest text-2xl">
              Winner:{" "}
              <span className="italic" data-testid="compare-winner">
                {result.winner === result.a.id ? result.a.name : result.b.name}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <CompareCard p={result.a} isWinner={result.winner === result.a.id} />
            <CompareCard p={result.b} isWinner={result.winner === result.b.id} />
          </div>

          <div className="ed-card mt-8 p-8 md:p-10">
            <div className="eyebrow">Deltas · A minus B</div>
            <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-6 mt-4">
              <Delta label="CO₂" value={result.deltas.co2_kg} unit="kg" lowerBetter />
              <Delta label="Water" value={result.deltas.water_l} unit="L" lowerBetter />
              <Delta label="Energy" value={result.deltas.energy_mj} unit="MJ" lowerBetter />
              <Delta label="Recyclable" value={result.deltas.recyclability_pct} unit="%" />
              <Delta label="Shelf life" value={result.deltas.shelf_life_days} unit="d" />
              <Delta label="GreenScore" value={result.deltas.score_value} unit="" />
            </div>
          </div>
        </div>
      )}

      {a === b && options.length > 0 && (
        <div className="mt-12 text-forest/60" data-testid="compare-same">
          Pick two <em>different</em> packagings to compare.
        </div>
      )}
    </div>
  );
}

function Picker({ value, onChange, options, label, testIdBase }) {
  return (
    <label className="block ed-card p-5">
      <div className="eyebrow">{label}</div>
      <select
        data-testid={testIdBase}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full bg-transparent text-forest font-serif text-2xl leading-tight focus:outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name} — {o.score_grade}
          </option>
        ))}
      </select>
    </label>
  );
}

function CompareCard({ p, isWinner }) {
  return (
    <div
      data-testid={`compare-card-${p.id}`}
      className={`ed-card p-8 relative ${isWinner ? "ring-2 ring-forest" : ""}`}
    >
      {isWinner && (
        <span className="absolute -top-3 left-8 bg-forest text-cream text-[11px] tracking-widest uppercase px-3 py-1 rounded-full">
          Winner
        </span>
      )}
      <div className="flex gap-6 items-start">
        <img src={p.image} alt={p.name} className="w-24 h-24 rounded-2xl object-cover" />
        <div className="flex-1">
          <div className="eyebrow">{p.category}</div>
          <div className="font-serif text-forest text-2xl mt-1 leading-tight">{p.name}</div>
          <div className="text-forest/60 text-[13px] mt-1">{p.material}</div>
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <GreenScoreGauge score={p.score_value} grade={p.score_grade} size={200} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <Kv k="CO₂" v={`${p.co2_kg} kg`} />
        <Kv k="Water" v={`${p.water_l} L`} />
        <Kv k="Energy" v={`${p.energy_mj} MJ`} />
        <Kv k="Recyclable" v={`${p.recyclability_pct}%`} />
        <Kv k="Shelf" v={`${p.shelf_life_days} d`} />
        <Kv k="Weight" v={`${p.weight_g} g`} />
      </div>
    </div>
  );
}

function Kv({ k, v }) {
  return (
    <div className="flex items-center justify-between border-b border-forest/10 pb-1">
      <span className="text-forest/60 text-[12px] uppercase tracking-widest">{k}</span>
      <span className="font-mono text-forest">{v}</span>
    </div>
  );
}

function Delta({ label, value, unit, lowerBetter = false }) {
  const positive = value > 0;
  const negative = value < 0;
  const good = lowerBetter ? negative : positive;
  const bad = lowerBetter ? positive : negative;
  const color = good ? "text-[#2E7D32]" : bad ? "text-terracotta" : "text-forest/60";
  const Icon = value === 0 ? Minus : value > 0 ? Plus : Minus;
  return (
    <div data-testid={`compare-delta-${label.toLowerCase()}`}>
      <div className="eyebrow">{label}</div>
      <div className={`mt-1 font-serif text-2xl flex items-center gap-1 ${color}`}>
        <Icon className="w-4 h-4" />
        {Math.abs(value)}
        {unit && <span className="text-[14px] opacity-70 ml-1">{unit}</span>}
      </div>
    </div>
  );
}
