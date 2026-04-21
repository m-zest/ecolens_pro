import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

/**
 * Editorial impact breakdown. Each row is normalised to % of its baseline so
 * the visual lengths are comparable even when the raw units differ
 * (CO₂ ~0.1 kg vs Water ~1 L vs Recyclability ~95%).
 */
export default function ImpactChart({ packaging }) {
  const rows = [
    { name: "CO₂", raw: packaging.co2_kg, unit: "kg", baseline: packaging.baseline_co2_kg, color: "#1A362D", lowerBetter: true },
    { name: "Water", raw: packaging.water_l, unit: "L", baseline: Math.max(packaging.water_l * 1.4, 1), color: "#294B3F", lowerBetter: true },
    { name: "Energy", raw: packaging.energy_mj, unit: "MJ", baseline: Math.max(packaging.energy_mj * 1.4, 1), color: "#A5B49F", lowerBetter: true },
    { name: "Recycled", raw: packaging.recyclability_pct, unit: "%", baseline: 100, color: "#C25934", lowerBetter: false },
  ];

  const data = rows.map((r) => ({
    name: r.name,
    pct: Math.min(100, Math.round((r.raw / r.baseline) * 100)),
    label: `${r.raw}${r.unit}`,
    color: r.color,
    lowerBetter: r.lowerBetter,
  }));

  return (
    <div data-testid="impact-chart" className="w-full" style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 70, top: 10, bottom: 10 }}>
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            width={110}
            tick={{ fill: "#1A362D", fontFamily: "Outfit", fontSize: 13 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(26,54,45,0.05)" }}
            formatter={(value, _name, item) => [item.payload.label, item.payload.name]}
          />
          <Bar dataKey="pct" radius={[0, 8, 8, 0]} barSize={22} background={{ fill: "rgba(26,54,45,0.06)", radius: 8 }}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
            <LabelList
              dataKey="label"
              position="right"
              fill="#1A362D"
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
