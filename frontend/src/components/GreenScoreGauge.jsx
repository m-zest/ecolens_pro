import { useEffect, useState } from "react";

const GRADE_COLORS = {
  A: "#2E7D32",
  B: "#7CB342",
  C: "#FDD835",
  D: "#FB8C00",
  E: "#D32F2F",
};

/**
 * Animated half-donut Green Score gauge. Pure SVG (no Recharts) for a custom
 * editorial look with a tick ring, not a generic chart.
 *
 * props:
 *   score  : 0-100
 *   grade  : A | B | C | D | E
 *   size   : px (default 260)
 *   label  : text under number
 */
export default function GreenScoreGauge({ score = 0, grade = "C", size = 260, label = "GreenScore" }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 1200);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimated(eased * score);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const w = size;
  const h = size * 0.62;
  const cx = w / 2;
  const cy = h * 0.95;
  const r = w * 0.42;
  const strokeW = w * 0.08;

  // Half-circle arc (180 → 0 degrees)
  const startAngle = Math.PI; // left
  const endAngle = 0; // right
  const valueAngle = startAngle - (animated / 100) * Math.PI;

  const polar = (angle, radius) => ({
    x: cx + Math.cos(angle) * radius,
    y: cy - Math.sin(angle) * radius,
  });

  const arcPath = (a1, a2, radius) => {
    const p1 = polar(a1, radius);
    const p2 = polar(a2, radius);
    const largeArc = 0;
    const sweep = a1 > a2 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${p2.x} ${p2.y}`;
  };

  // Tick marks around the arc
  const ticks = Array.from({ length: 41 }, (_, i) => {
    const a = startAngle - (i / 40) * Math.PI;
    const inner = polar(a, r + strokeW / 2 + 6);
    const outer = polar(a, r + strokeW / 2 + (i % 5 === 0 ? 14 : 9));
    return { inner, outer, major: i % 5 === 0, i };
  });

  const color = GRADE_COLORS[grade] || GRADE_COLORS.C;

  return (
    <div className="flex flex-col items-center" data-testid="green-score-gauge">
      <svg width={w} height={h + 30} viewBox={`0 0 ${w} ${h + 30}`}>
        {/* background arc */}
        <path
          d={arcPath(startAngle, endAngle, r)}
          fill="none"
          stroke="rgba(26,54,45,0.08)"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* value arc */}
        <path
          d={arcPath(startAngle, valueAngle, r)}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          style={{ transition: "stroke 0.3s ease" }}
        />
        {/* tick ring */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.inner.x}
            y1={t.inner.y}
            x2={t.outer.x}
            y2={t.outer.y}
            stroke="rgba(26,54,45,0.35)"
            strokeWidth={t.major ? 1.3 : 0.8}
          />
        ))}
        {/* endpoint dots */}
        <circle cx={polar(startAngle, r).x} cy={polar(startAngle, r).y} r={3.5} fill="#1A362D" />
        <circle cx={polar(endAngle, r).x} cy={polar(endAngle, r).y} r={3.5} fill="#1A362D" />
      </svg>
      <div className="-mt-[110px] flex flex-col items-center" style={{ marginTop: `-${h * 0.55}px` }}>
        <div
          className="score-chip"
          data-testid="gauge-grade"
          style={{ color, fontSize: w * 0.32, letterSpacing: "-0.03em" }}
        >
          {grade}
        </div>
        <div
          data-testid="gauge-score-value"
          className="font-mono text-forest/70 mt-1"
          style={{ fontSize: w * 0.06 }}
        >
          {Math.round(animated)}<span className="opacity-50">/100</span>
        </div>
        <div className="eyebrow mt-2">{label}</div>
      </div>
    </div>
  );
}
