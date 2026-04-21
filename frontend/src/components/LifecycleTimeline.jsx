/**
 * Lifecycle timeline — vertical editorial steps with CO2 share bar each.
 */
export default function LifecycleTimeline({ stages = [] }) {
  const max = Math.max(...stages.map((s) => s.co2_share), 0.0001);
  return (
    <ol data-testid="lifecycle-timeline" className="relative pl-10">
      <div
        aria-hidden
        className="absolute left-[7px] top-2 bottom-2 border-l border-dashed border-forest/30"
      />
      {stages.map((s, i) => (
        <li key={i} className="relative pb-8 last:pb-0" data-testid={`lifecycle-stage-${i}`}>
          <span
            className="absolute -left-[33px] top-1.5 w-[14px] h-[14px] rounded-full border-2 border-forest bg-cream"
            aria-hidden
          />
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="font-serif text-[19px] text-forest leading-tight">{s.stage}</div>
              <div className="text-forest/65 text-[14px] mt-1 leading-relaxed">{s.note}</div>
            </div>
            <div className="font-mono text-xs text-forest/55 whitespace-nowrap">
              {(s.co2_share * 100).toFixed(0)}% CO₂
            </div>
          </div>
          <div className="mt-3 h-[3px] rounded-full bg-forest/10 overflow-hidden">
            <div
              className="h-full bg-forest transition-all duration-700"
              style={{ width: `${(s.co2_share / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
