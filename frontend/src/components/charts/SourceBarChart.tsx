import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP_BG, CHART_TOOLTIP_BORDER } from "./chartTheme";

export type SourceBarDatum = { name: string; count: number };

export function SourceBarChart({ data }: { data: SourceBarDatum[] }) {
  const top = [...data].sort((a, b) => b.count - a.count).slice(0, 10);
  if (!top.length) {
    return <p className="py-12 text-center text-sm text-text-muted">No article source data.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={top} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
        <XAxis type="number" stroke={CHART_AXIS} tick={{ fill: CHART_AXIS, fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          stroke={CHART_AXIS}
          tick={{ fill: CHART_AXIS, fontSize: 10 }}
          tickFormatter={(v) => (String(v).length > 14 ? `${String(v).slice(0, 12)}…` : String(v))}
        />
        <Tooltip
          contentStyle={{
            background: CHART_TOOLTIP_BG,
            border: `1px solid ${CHART_TOOLTIP_BORDER}`,
            borderRadius: 8,
            color: "var(--text-main)",
          }}
        />
        <Bar
          dataKey="count"
          name="Articles"
          fill="url(#barOrange)"
          radius={[0, 4, 4, 0]}
          maxBarSize={22}
        />
        <defs>
          <linearGradient id="barOrange" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9a3412" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
