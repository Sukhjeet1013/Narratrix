import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP_BG, CHART_TOOLTIP_BORDER } from "../charts/chartTheme";
import type { ClusterDetail } from "../../types/api";

interface CoverageDiversityData {
  name: string;
  count: number;
  percentage: number;
}

interface CoverageDiversityChartProps {
  clusters: ClusterDetail[];
}

export function CoverageDiversityChart({ clusters }: CoverageDiversityChartProps) {
  const data: CoverageDiversityData[] = (() => {
    let twoOutlets = 0;
    let threeToFive = 0;
    let sixPlus = 0;
    let singleSource = 0;

    for (const cluster of (clusters ?? [])) {
      const sourceSet = new Set<string>();
      for (const member of (cluster.members ?? [])) {
        const source = member.source_name || member.source;
        if (source) sourceSet.add(source);
      }
      const count = sourceSet.size;
      if (count <= 1) singleSource++;
      else if (count <= 2) twoOutlets++;
      else if (count <= 5) threeToFive++;
      else sixPlus++;
    }

    const total = (clusters ?? []).length || 1;
    return [
      { name: "Single Source", count: singleSource, percentage: Math.round((singleSource / total) * 100) },
      { name: "2 Outlets", count: twoOutlets, percentage: Math.round((twoOutlets / total) * 100) },
      { name: "3–5 Outlets", count: threeToFive, percentage: Math.round((threeToFive / total) * 100) },
      { name: "6+ Outlets", count: sixPlus, percentage: Math.round((sixPlus / total) * 100) },
    ].filter(d => d.count > 0);
  })();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-text-muted">Insufficient data for coverage diversity analysis.</p>
      </div>
    );
  }

  const colors: Record<string, string> = {
    "Single Source": "#71717a",
    "2 Outlets": "#38bdf8",
    "3–5 Outlets": "#fb923c",
    "6+ Outlets": "#ea580c",
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
        <XAxis type="number" stroke={CHART_AXIS} tick={{ fill: CHART_AXIS, fontSize: 10 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={80}
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
          formatter={(value, name) => {
            if (name === "count") return [value, "Stories"];
            if (name === "percentage") return [`${value}%`, "Share"];
            return value;
          }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {data.map((entry, i) => (
            <Cell key={i} fill={colors[entry.name] || "#71717a"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}