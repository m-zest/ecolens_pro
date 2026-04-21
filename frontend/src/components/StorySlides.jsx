import { useState } from "react";
import {
  Leaf,
  Factory,
  Truck,
  Recycle,
  Sprout,
  Droplet,
  Zap,
  Clock,
  Shield,
  Coins,
  TriangleAlert,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { apiGenerateStory } from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";

const ICONS = {
  leaf: Leaf,
  factory: Factory,
  truck: Truck,
  recycle: Recycle,
  compost: Sprout,
  drop: Droplet,
  bolt: Zap,
  clock: Clock,
  shield: Shield,
  coin: Coins,
  warning: TriangleAlert,
  sprout: Sprout,
};

export default function StorySlides({ packagingId, initialTone = "editorial" }) {
  const { locale } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [slides, setSlides] = useState(null);
  const [tone, setTone] = useState(initialTone);
  const [i, setI] = useState(0);

  const run = async (nextTone = tone) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGenerateStory(packagingId, nextTone, locale);
      setSlides(data.slides);
      setTone(nextTone);
      setI(0);
    } catch (e) {
      setError("Couldn't generate the story right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  if (!slides) {
    return (
      <div
        data-testid="story-slides-idle"
        className="ed-card p-8 md:p-10 relative overflow-hidden"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-forest/8 grid place-items-center shrink-0">
            <Sparkles className="w-5 h-5 text-forest" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="eyebrow">Narrative mode</div>
            <h3 className="display-serif text-3xl md:text-4xl text-forest mt-2 leading-[1.05]">
              Let EcoLens <em className="text-terracotta not-italic italic">tell the story</em>.
            </h3>
            <p className="text-forest/70 mt-3 max-w-xl text-[15px] leading-relaxed">
              A 5-slide narrative drawn live from the LCA figures above. Honest trade-offs included —
              no greenwashing.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["editorial", "playful", "technical"].map((t) => (
                <button
                  key={t}
                  onClick={() => run(t)}
                  data-testid={`story-generate-${t}`}
                  disabled={loading}
                  className={`px-4 py-2 rounded-full text-sm border transition-all ${
                    tone === t
                      ? "bg-forest text-cream border-forest"
                      : "border-forest/25 text-forest hover:bg-forest/5"
                  } disabled:opacity-60`}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {loading && (
              <div
                data-testid="story-loading"
                className="mt-5 flex items-center gap-2 text-forest/70 text-sm"
              >
                <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
                Writing your narrative…
              </div>
            )}
            {error && <div className="mt-4 text-terracotta text-sm" data-testid="story-error">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  const slide = slides[i];
  const Icon = ICONS[slide.icon_hint] || Leaf;

  return (
    <div data-testid="story-slides" className="ed-card overflow-hidden">
      <div className="grid md:grid-cols-[auto_1fr] gap-0">
        <div className="bg-forest text-cream p-10 md:w-[260px] flex flex-col justify-between">
          <div>
            <div className="text-cream/60 text-xs tracking-[0.24em] uppercase">Slide {i + 1} / {slides.length}</div>
            <div className="mt-8 w-14 h-14 rounded-full bg-cream/10 grid place-items-center">
              <Icon className="w-6 h-6" strokeWidth={1.5} />
            </div>
          </div>
          <div className="eyebrow !text-cream/50 mt-10">Tone · {tone}</div>
        </div>
        <div className="p-8 md:p-10 flex flex-col justify-between min-h-[280px]">
          <div>
            <h4
              data-testid="story-slide-title"
              className="display-serif text-3xl md:text-[34px] text-forest leading-[1.08]"
            >
              {slide.title}
            </h4>
            <p
              data-testid="story-slide-body"
              className="mt-4 text-forest/80 text-[16px] leading-relaxed max-w-[52ch]"
            >
              {slide.body}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setI(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  data-testid={`story-dot-${idx}`}
                  className={`h-[3px] rounded-full transition-all ${
                    idx === i ? "w-7 bg-forest" : "w-3 bg-forest/25 hover:bg-forest/50"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setI((v) => (v - 1 + slides.length) % slides.length)}
                className="w-10 h-10 rounded-full border border-forest/25 grid place-items-center hover:bg-forest/5"
                data-testid="story-prev"
                aria-label="Previous slide"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setI((v) => (v + 1) % slides.length)}
                className="w-10 h-10 rounded-full bg-forest text-cream grid place-items-center hover:bg-forest/90"
                data-testid="story-next"
                aria-label="Next slide"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
