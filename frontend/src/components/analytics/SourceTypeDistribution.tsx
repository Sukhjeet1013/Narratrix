import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_TOOLTIP_BG, CHART_TOOLTIP_BORDER } from "../charts/chartTheme";
import type { Source } from "../../types/api";

interface SourceTypeSlice {
  name: string;
  value: number;
}

interface SourceTypeDistributionProps {
  sources: Source[];
}

function getSourceTypeCategory(type: string | null): string {
  const t = (type || "").toLowerCase();
  if (t.includes("tv") || t.includes("broadcast")) return "TV/Broadcast";
  if (t.includes("newspaper") || t.includes("broadsheet")) return "Newspaper";
  if (t.includes("wire")) return "Wire Service";
  if (t.includes("digital") || t.includes("online")) return "Digital";
  if (t.includes("magazine")) return "Magazine";
  return "Other";
}

export function SourceTypeDistribution({ sources }: SourceTypeDistributionProps) {
  const data: SourceTypeSlice[] = (() => {
    const map = new Map<string, number>();
    
    for (const source of sources) {
      if (!source.active) continue;
      const category = getSourceTypeCategory(source.source_type);
      map.set(category, (map.get(category) || 0) + 1);
    }

    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-text-muted">No source type data available.</p>
      </div>
    );
  }

  const colors = ["#ea580c", "#38bdf8", "#22c55e", "#a855f7", "#eab308", "#71717a"];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          stroke="rgba(24,24,27,0.9)"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: CHART_TOOLTIP_BG,
            border: `1px solid ${CHART_TOOLTIP_BORDER}`,
            borderRadius: 8,
            color: "var(--text-main)",
          }}
        />
        <Legend
          verticalAlign="bottom"
          formatter={(value) => <span className="text-text-main text-sm">{value}</span>}
          wrapperStyle={{ paddingTop: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}