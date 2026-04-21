import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 pb-24" data-testid="about-page">
      <div className="eyebrow">§ Method</div>
      <h1 className="display-serif text-6xl md:text-[88px] text-forest mt-3 leading-[0.95]">
        Numbers you can<br />
        <em className="italic text-terracotta">argue with</em>.
      </h1>

      <div className="grid md:grid-cols-[1fr_2fr] gap-10 mt-16">
        <div className="sticky top-24 self-start eyebrow">01 · Provenance</div>
        <div className="prose-like">
          <p className="text-forest/80 text-[18px] leading-relaxed">
            EcoLens is the consumer layer on top of the D4PACK{" "}
            <em>Early Guidance Tool</em> — an EU-funded decision-support system for sustainable
            food packaging. Our values sit within the range of public Ecoinvent v3.9 LCI data and
            EU Product Environmental Footprint (PEF) guidance.
          </p>
          <p className="text-forest/80 text-[18px] leading-relaxed mt-4">
            This build ships with 25 reference packagings used across the Central European food
            sector. Add your own via <Link to="/submit" className="link-underline">Submit</Link> and
            we'll model it on the fly.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_2fr] gap-10 mt-16 border-t border-forest/10 pt-16">
        <div className="sticky top-24 self-start eyebrow">02 · How the score is built</div>
        <div>
          <p className="text-forest/80 text-[18px] leading-relaxed">
            The GreenScore is a 0-100 synthesis with these weights:
          </p>
          <ul className="mt-6 space-y-3 text-forest/85 text-[16px]">
            {[
              ["CO₂ intensity", "45%", "Inverse of cradle-to-grave emissions per pack."],
              ["Recyclability", "30%", "Post-consumer EU recovery rate for the material."],
              ["Recycled content", "15%", "Share of secondary material in the pack."],
              ["Base material fit", "10%", "Penalty for hard-to-sort formats."],
              ["Compostable bonus", "+15", "Industrially compostable end-of-life."],
              ["Transport penalty", "up to −25", "Long-haul logistics overhead."],
            ].map(([k, w, note]) => (
              <li key={k} className="flex items-start justify-between gap-6 border-b border-forest/10 pb-3">
                <div className="flex-1">
                  <div className="font-serif text-2xl text-forest">{k}</div>
                  <div className="text-forest/65 text-[14px] mt-1">{note}</div>
                </div>
                <div className="font-mono text-forest text-[14px] shrink-0">{w}</div>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-forest/70 text-[15px]">
            Grades map as: <span className="font-mono">A ≥ 80 · B ≥ 65 · C ≥ 50 · D ≥ 35 · E {"<"} 35</span>.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_2fr] gap-10 mt-16 border-t border-forest/10 pt-16">
        <div className="sticky top-24 self-start eyebrow">03 · The narrative layer</div>
        <div>
          <p className="text-forest/80 text-[18px] leading-relaxed">
            Each story mode uses Anthropic's <em>Claude Sonnet 4.5</em>, strictly prompted to reference
            the packaging's concrete numbers, name real trade-offs, and avoid greenwashing language.
            The output is always JSON with five slides — no free-form text, no filler.
          </p>
          <p className="text-forest/80 text-[18px] leading-relaxed mt-4">
            We cache generated narratives per packaging + tone so judges, shoppers and brands see a
            consistent story.
          </p>
        </div>
      </div>

      <div className="mt-20 bg-forest text-cream rounded-[28px] p-10 md:p-14">
        <div className="eyebrow !text-cream/60">Next</div>
        <h3 className="display-serif text-4xl md:text-5xl mt-3 leading-[1.05]">
          Put the score on your shelf.
        </h3>
        <p className="mt-4 text-cream/80 max-w-xl text-[16px]">
          Score your packaging in under a minute. Get a shareable EcoLens report — ready to link from
          a QR code, a spec sheet, or a pitch deck.
        </p>
        <Link to="/submit" className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-cream text-forest font-medium hover:bg-white" data-testid="about-submit-cta">
          Submit packaging <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
