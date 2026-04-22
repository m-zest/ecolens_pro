import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Scale, FileText, Copy, CheckCircle2, Download } from "lucide-react";
import { apiGetPackaging, API, SHARE_BASE } from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";
import GreenScoreGauge from "@/components/GreenScoreGauge";
import ImpactChart from "@/components/ImpactChart";
import LifecycleTimeline from "@/components/LifecycleTimeline";
import StorySlides from "@/components/StorySlides";

export default function PackagingDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const [p, setP] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setP(null);
    apiGetPackaging(id).then(setP);
  }, [id]);

  if (!p) {
    return <div className="max-w-7xl mx-auto px-6 md:px-10 py-24 text-forest/60" data-testid="detail-loading">Loading…</div>;
  }

  const delta = p.baseline_co2_kg - p.co2_kg;
  const deltaPct = Math.round((delta / p.baseline_co2_kg) * 100);

  const copyLink = async () => {
    try {
      const shareUrl = `${SHARE_BASE || window.location.origin}/share/packaging/${p.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  };

  return (
    <div className="pb-24" data-testid="detail-page">
      <Helmet>
        <title>{p.name} — EcoLens</title>
        <meta
          name="description"
          content={`GreenScore ${p.score_grade} (${p.score_value}/100) · ${p.co2_kg} kg CO₂ · ${p.recyclability_pct}% recyclable · ${p.material}.`}
        />
        <meta property="og:title" content={`${p.name} — EcoLens`} />
        <meta
          property="og:description"
          content={`GreenScore ${p.score_grade} (${p.score_value}/100) · ${p.co2_kg} kg CO₂ · ${p.recyclability_pct}% recyclable.`}
        />
        <meta property="og:image" content={`${API}/packagings/${p.id}/card.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${API}/packagings/${p.id}/card.png`} />
      </Helmet>

      {/* Top nav row */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-6 flex items-center justify-between">
        <Link to="/catalog" className="inline-flex items-center gap-2 text-forest/70 text-sm link-underline" data-testid="detail-back">
          <ArrowLeft className="w-4 h-4" /> Back to catalogue
        </Link>
        <div className="flex gap-2">
          <button onClick={copyLink} className="btn-ghost text-sm inline-flex items-center gap-2" data-testid="detail-share">
            {copied ? <><CheckCircle2 className="w-4 h-4" /> {t("cta.copied")}</> : <><Copy className="w-4 h-4" /> {t("cta.share")}</>}
          </button>
          <a
            href={`${API}/packagings/${p.id}/card.png`}
            download={`ecolens-${p.id}.png`}
            className="btn-ghost text-sm inline-flex items-center gap-2"
            data-testid="detail-download-card"
          >
            <Download className="w-4 h-4" /> {t("cta.download_card")}
          </a>
          <Link to={`/compare?a=${p.id}`} className="btn-primary text-sm inline-flex items-center gap-2" data-testid="detail-compare-cta">
            <Scale className="w-4 h-4" /> {t("cta.compare")}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 mt-8">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16">
          <div>
            <div className="eyebrow">{p.category} · {p.format}</div>
            <h1 className="display-serif text-[56px] md:text-[84px] text-forest mt-3 leading-[0.95]" data-testid="detail-name">
              {p.name}
            </h1>
            <div className="mt-6 flex flex-wrap gap-2" data-testid="detail-highlights">
              {p.highlights.map((h, i) => (
                <span key={i} className="bg-sage/25 text-forest text-[12px] px-3 py-1.5 rounded-full font-medium">
                  {h}
                </span>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <Stat label="CO₂" value={`${p.co2_kg} kg`} sub={`${deltaPct >= 0 ? "-" : "+"}${Math.abs(deltaPct)}% vs avg`} />
              <Stat label="Water" value={`${p.water_l} L`} />
              <Stat label="Energy" value={`${p.energy_mj} MJ`} />
              <Stat label="Recyclable" value={`${p.recyclability_pct}%`} />
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 bg-ochre/30 rounded-[26px] rotate-[2deg] -z-10" aria-hidden />
            <img
              src={p.image}
              alt={p.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'><rect width='4' height='3' fill='%23EAE5D9'/><text x='2' y='1.7' font-family='serif' font-size='0.45' text-anchor='middle' fill='%231A362D' font-style='italic'>EcoLens</text></svg>`;
              }}
              className={`w-full h-[460px] md:h-[540px] rounded-[22px] shadow-[0_30px_80px_rgba(26,54,45,0.18)] ${
                p.image?.startsWith("/")
                  ? "object-contain bg-cream p-4"
                  : "object-cover"
              }`}
              data-testid="detail-image"
            />
          </div>
        </div>
      </section>

      {/* GreenScore + impact */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 mt-24 grid lg:grid-cols-2 gap-10">
        <div className="ed-card p-10 flex flex-col items-center text-center">
          <div className="eyebrow">GreenScore</div>
          <div className="mt-4">
            <GreenScoreGauge score={p.score_value} grade={p.score_grade} size={300} />
          </div>
          <p className="mt-4 text-forest/70 max-w-sm">
            Synthesised from CO₂ intensity, recyclability, material profile and transport. A = best, E = worst.
          </p>
        </div>
        <div className="ed-card p-10">
          <div className="eyebrow">Impact breakdown</div>
          <h3 className="display-serif text-3xl text-forest mt-2">Where the footprint lives</h3>
          <div className="mt-6">
            <ImpactChart packaging={p} />
          </div>
          <p className="mt-5 text-forest/65 text-[14px]">
            Cradle-to-grave — modelled on {p.material.toLowerCase()} at {p.weight_g} g, against a
            reference of {p.baseline_co2_kg} kg CO₂ for the same food category.
          </p>
        </div>
      </section>

      {/* Lifecycle */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 mt-20 grid lg:grid-cols-[1fr_1.2fr] gap-12">
        <div>
          <div className="eyebrow">Lifecycle</div>
          <h2 className="display-serif text-5xl text-forest mt-4 leading-[1.02]">
            From raw material<br />to <em className="italic text-terracotta">end of life</em>.
          </h2>
          <p className="mt-5 text-forest/70 text-[16px] leading-relaxed max-w-md">
            Each stage's share of the CO₂ footprint is estimated using EU PEF defaults. Expand the
            raw technical report below for the underlying numbers.
          </p>
          <button
            onClick={() => setShowRaw((v) => !v)}
            data-testid="detail-raw-toggle"
            className="mt-6 inline-flex items-center gap-2 text-forest link-underline text-[14px]"
          >
            <FileText className="w-4 h-4" /> {showRaw ? "Hide" : "Show"} raw technical report
          </button>
          {showRaw && (
            <pre
              data-testid="detail-raw"
              className="mt-5 bg-forest text-cream p-5 rounded-xl text-[12px] font-mono overflow-auto max-h-80"
            >
              {JSON.stringify(p, null, 2)}
            </pre>
          )}
        </div>
        <div className="ed-card p-8 md:p-10">
          <LifecycleTimeline stages={p.lifecycle} />
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 mt-20">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-6">
          <div>
            <div className="eyebrow">Narrative</div>
            <h2 className="display-serif text-5xl text-forest mt-3 leading-[1.02]">
              The 30-second story.
            </h2>
          </div>
        </div>
        <StorySlides packagingId={p.id} />
      </section>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="font-serif text-forest text-3xl mt-1 leading-none">{value}</div>
      {sub && <div className="text-forest/55 text-[12px] mt-1 font-mono">{sub}</div>}
    </div>
  );
}
