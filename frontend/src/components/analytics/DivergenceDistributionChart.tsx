import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP_BG, CHART_TOOLTIP_BORDER } from "../charts/chartTheme";
import type { ClusterDetail } from "../../types/api";

interface DivergenceData {
  name: string;
  count: number;
}

interface DivergenceDistributionChartProps {
  clusters: ClusterDetail[];
}

export function DivergenceDistributionChart({ clusters }: DivergenceDistributionChartProps) {
  const data: DivergenceData[] = (() => {
    let highAgreement = 0;    // >85% alignment — outlets closely aligned
    let partialAgreement = 0; // 65–85% — some framing variation
    let mixedFraming = 0;     // <65% — notable framing divergence
    let noData = 0;

    for (const cluster of clusters) {
      const members = cluster.members.filter(m => m.similarity_to_centroid != null);
      if (members.length === 0) { noData++; continue; }
      const avgSim = members.reduce((acc, m) => acc + (m.similarity_to_centroid || 0), 0) / members.length;
      if (avgSim >= 0.85) highAgreement++;
      else if (avgSim >= 0.65) partialAgreement++;
      else mixedFraming++;
    }

    // Only include categories that have data
    return [
      { name: "High Agreement", count: highAgreement },
      { name: "Partial Agreement", count: partialAgreement },
      { name: "Mixed Framing", count: mixedFraming },
    ].filter(d => d.count > 0);
  })();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-text-muted">Insufficient comparative data for framing analysis.</p>
      </div>
    );
  }

  // If only 1 category, show a note that data is homogeneous
  const singleCategory = data.length === 1;

  const colors: Record<string, string> = {
    "High Agreement": "#22c55e",
    "Partial Agreement": "#eab308",
    "Mixed Framing": "#ef4444",
  };

  return (
    <div className="h-full flex flex-col">
      {singleCategory && (
        <p className="text-[10px] text-text-muted mb-2 px-1">
          All sampled stories show <span className="text-text-main font-medium">{data[0].name}</span> — {data[0].count} stories analyzed.
        </p>
      )}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
            <XAxis type="number" stroke={CHART_AXIS} tick={{ fill: CHART_AXIS, fontSize: 10 }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              stroke={CHART_AXIS}
              tick={{ fill: CHART_AXIS, fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                background: CHART_TOOLTIP_BG,
                border: `1px solid ${CHART_TOOLTIP_BORDER}`,
                borderRadius: 8,
                color: "var(--text-main)",
              }}
              formatter={(value) => [value, "Stories"]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={32} label={{ position: "right", fill: CHART_AXIS, fontSize: 10 }}>
              {data.map((entry, i) => (
                <Cell key={i} fill={colors[entry.name] || "#71717a"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}