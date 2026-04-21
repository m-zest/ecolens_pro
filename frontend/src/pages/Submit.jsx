import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Download } from "lucide-react";
import { apiSubmit, API } from "@/lib/api";
import GreenScoreGauge from "@/components/GreenScoreGauge";

const MATERIALS = [
  "Glass",
  "PET",
  "Recycled PET",
  "PP (Polypropylene)",
  "HDPE",
  "Aluminium",
  "Recycled Aluminium",
  "Tinplate Steel",
  "Kraft Paper",
  "Cardboard",
  "PLA (Bioplastic)",
  "Sugarcane Bagasse",
  "Bamboo Fibre",
  "EPS (Polystyrene Foam)",
  "Multi-layer laminate pouch",
];
const CATEGORIES = ["Dairy", "Beverages", "Produce", "Meat & Fish", "Snacks", "Bakery & Deli", "Pantry", "Food Service"];

const EMPTY = {
  name: "",
  category: CATEGORIES[0],
  material: MATERIALS[0],
  format: "",
  weight_g: 10,
  recycled_content_pct: 0,
  recyclable: true,
  compostable: false,
  transport_km: 500,
  shelf_life_days: 30,
  contact_email: "",
  is_public: false,
};

export default function Submit() {
  const [form, setForm] = useState(EMPTY);
  const [step, setStep] = useState(1);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const steps = ["Product", "Material", "Logistics", "Review"];

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiSubmit({
        ...form,
        contact_email: form.contact_email || undefined,
      });
      setReport(data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Submission failed. Check your values.");
    } finally {
      setLoading(false);
    }
  };

  if (report) {
    return <Report report={report} onReset={() => { setReport(null); setForm(EMPTY); setStep(1); }} />;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 pb-24" data-testid="submit-page">
      <div className="eyebrow">§ Submit</div>
      <h1 className="display-serif text-6xl md:text-7xl text-forest mt-3 leading-[0.95]">
        Your packaging.<br />
        <em className="italic text-terracotta">Your receipt.</em>
      </h1>
      <p className="mt-5 text-forest/70 max-w-xl text-[16px] leading-relaxed">
        Four quick steps. We'll model the footprint with EU PEF defaults and hand you a shareable
        GreenScore.
      </p>

      {/* Stepper */}
      <div className="mt-10 flex items-center gap-3" data-testid="submit-stepper">
        {steps.map((s, i) => {
          const idx = i + 1;
          const done = step > idx;
          const active = step === idx;
          return (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div
                className={`w-9 h-9 rounded-full grid place-items-center text-[13px] font-medium border ${
                  done
                    ? "bg-forest text-cream border-forest"
                    : active
                    ? "bg-cream text-forest border-forest"
                    : "border-forest/25 text-forest/40"
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : idx}
              </div>
              <div className={`text-[13px] ${active || done ? "text-forest" : "text-forest/40"}`}>{s}</div>
              {i < steps.length - 1 && <div className="flex-1 h-[1px] bg-forest/15" />}
            </div>
          );
        })}
      </div>

      <div className="ed-card p-8 md:p-10 mt-8">
        {step === 1 && (
          <div className="space-y-6" data-testid="submit-step-1">
            <Field label="Product name" testId="submit-name">
              <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Organic Oat Milk 1L" data-testid="submit-name-input" />
            </Field>
            <div className="grid md:grid-cols-2 gap-6">
              <Field label="Food category">
                <select value={form.category} onChange={(e) => update("category", e.target.value)} data-testid="submit-category">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Format">
                <input value={form.format} onChange={(e) => update("format", e.target.value)} placeholder="e.g. 1L aseptic carton" data-testid="submit-format" />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6" data-testid="submit-step-2">
            <Field label="Primary material">
              <select value={form.material} onChange={(e) => update("material", e.target.value)} data-testid="submit-material">
                {MATERIALS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <div className="grid md:grid-cols-2 gap-6">
              <Field label="Empty packaging weight (g)">
                <input type="number" min={0.1} step={0.1} value={form.weight_g} onChange={(e) => update("weight_g", parseFloat(e.target.value) || 0)} data-testid="submit-weight" />
              </Field>
              <Field label={`Recycled content: ${form.recycled_content_pct}%`}>
                <input type="range" min={0} max={100} step={5} value={form.recycled_content_pct} onChange={(e) => update("recycled_content_pct", parseInt(e.target.value))} data-testid="submit-recycled" />
              </Field>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Toggle label="Recyclable kerbside (EU)" value={form.recyclable} onChange={(v) => update("recyclable", v)} testId="submit-recyclable" />
              <Toggle label="Industrially compostable" value={form.compostable} onChange={(v) => update("compostable", v)} testId="submit-compostable" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6" data-testid="submit-step-3">
            <Field label="Distance from factory to shelf (km)">
              <input type="number" min={0} value={form.transport_km} onChange={(e) => update("transport_km", parseFloat(e.target.value) || 0)} data-testid="submit-transport" />
            </Field>
            <Field label="Shelf life enabled (days)">
              <input type="number" min={0} value={form.shelf_life_days} onChange={(e) => update("shelf_life_days", parseInt(e.target.value) || 0)} data-testid="submit-shelf" />
            </Field>
            <Field label="Email for the report (optional)">
              <input type="email" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} placeholder="you@brand.co" data-testid="submit-email" />
            </Field>
            <Toggle
              label="Publish to the community gallery (visible to everyone)"
              value={form.is_public}
              onChange={(v) => update("is_public", v)}
              testId="submit-is-public"
            />
          </div>
        )}

        {step === 4 && (
          <div data-testid="submit-step-4">
            <div className="eyebrow">Review</div>
            <dl className="mt-4 grid sm:grid-cols-2 gap-x-10 gap-y-3">
              {[
                ["Name", form.name || "—"],
                ["Category", form.category],
                ["Format", form.format || "—"],
                ["Material", form.material],
                ["Weight", `${form.weight_g} g`],
                ["Recycled content", `${form.recycled_content_pct}%`],
                ["Recyclable", form.recyclable ? "Yes" : "No"],
                ["Compostable", form.compostable ? "Yes" : "No"],
                ["Transport", `${form.transport_km} km`],
                ["Shelf life", `${form.shelf_life_days} d`],
                ["Public", form.is_public ? "Yes — will appear in the gallery" : "No — private"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-forest/10 pb-1">
                  <dt className="text-forest/55 text-[12px] uppercase tracking-widest">{k}</dt>
                  <dd className="text-forest font-mono text-[14px]">{v}</dd>
                </div>
              ))}
            </dl>
            {error && <div className="mt-4 text-terracotta text-sm" data-testid="submit-error">{error}</div>}
          </div>
        )}

        <div className="mt-8 flex justify-between items-center">
          <button
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="text-forest/70 text-sm link-underline disabled:opacity-30"
            data-testid="submit-prev"
          >
            ← Back
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="btn-primary inline-flex items-center gap-2"
              data-testid="submit-next"
              disabled={step === 1 && !form.name}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={loading}
              className="btn-primary inline-flex items-center gap-2"
              data-testid="submit-generate"
            >
              {loading ? "Scoring…" : "Generate EcoLens report"} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-forest/50 text-xs max-w-xl">
        Values are modelled against Ecoinvent-style defaults. Not a substitute for a formal LCA or
        regulatory Eco-score.
      </p>
    </div>
  );
}

function Field({ label, testId, children }) {
  return (
    <label className="block" data-testid={testId}>
      <div className="eyebrow mb-2">{label}</div>
      <div className="[&>input]:w-full [&>input]:bg-transparent [&>input]:border-b [&>input]:border-forest/20 [&>input]:py-2 [&>input]:font-serif [&>input]:text-xl [&>input]:text-forest [&>input]:focus:outline-none [&>input]:focus:border-forest
        [&>select]:w-full [&>select]:bg-transparent [&>select]:border-b [&>select]:border-forest/20 [&>select]:py-2 [&>select]:font-serif [&>select]:text-xl [&>select]:text-forest [&>select]:focus:outline-none [&>select]:cursor-pointer">
        {children}
      </div>
    </label>
  );
}

function Toggle({ label, value, onChange, testId }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      data-testid={testId}
      className={`flex items-center justify-between w-full px-5 py-4 rounded-full border transition-all ${
        value ? "bg-forest text-cream border-forest" : "border-forest/25 text-forest hover:bg-forest/5"
      }`}
    >
      <span className="text-[14px] font-medium">{label}</span>
      <span className={`w-10 h-5 rounded-full relative transition-all ${value ? "bg-cream/30" : "bg-forest/15"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-cream transition-all ${value ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function Report({ report, onReset }) {
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 pb-24" data-testid="submit-report">
      <div className="eyebrow">§ Your report</div>
      <h1 className="display-serif text-6xl text-forest mt-3 leading-[0.95]">
        {report.input.name || "Your packaging"}, <em className="italic text-terracotta">graded</em>.
      </h1>
      <div className="mt-10 grid md:grid-cols-[auto_1fr] gap-10 items-start">
        <div className="ed-card p-8 md:p-10 flex flex-col items-center min-w-[320px]">
          <GreenScoreGauge score={report.score_value} grade={report.score_grade} size={280} />
        </div>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Metric k="CO₂ per unit" v={`${report.co2_kg} kg`} />
            <Metric k="Water" v={`${report.water_l} L`} />
            <Metric k="Energy" v={`${report.energy_mj} MJ`} />
            <Metric k="Recyclable" v={`${report.recyclability_pct}%`} />
          </div>
          <div className="ed-card p-6">
            <div className="eyebrow">Why this grade</div>
            <ul className="mt-3 space-y-2">
              {report.reasoning.map((r, i) => (
                <li key={i} className="flex gap-3 text-forest/85 text-[15px]">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-terracotta shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-3 pt-2 flex-wrap">
            <button onClick={onReset} className="btn-ghost" data-testid="report-reset">Score another</button>
            <a
              href={`${API}/submissions/${report.id}/card.png`}
              download={`ecolens-report-${report.id}.png`}
              className="btn-ghost inline-flex items-center gap-2"
              data-testid="report-download-card"
            >
              <Download className="w-4 h-4" /> Download card
            </a>
            <Link to="/catalog" className="btn-primary inline-flex items-center gap-2" data-testid="report-explore">
              Explore catalogue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-10 text-forest/50 text-xs">
        Report ID: <span className="font-mono">{report.id}</span>
      </div>
    </div>
  );
}

function Metric({ k, v }) {
  return (
    <div className="ed-card p-5">
      <div className="eyebrow">{k}</div>
      <div className="font-serif text-forest text-3xl mt-1">{v}</div>
    </div>
  );
}
