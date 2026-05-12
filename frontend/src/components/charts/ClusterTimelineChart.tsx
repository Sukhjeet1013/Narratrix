import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP_BG, CHART_TOOLTIP_BORDER } from "./chartTheme";

export type TimelineDatum = { day: string; clusters: number };

export function ClusterTimelineChart({ data }: { data: TimelineDatum[] }) {
  if (data.length < 2) {
    return <p className="py-12 text-center text-sm text-text-muted">Insufficient data to plot trend.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="areaClusters" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ea580c" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#ea580c" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
        <XAxis
          dataKey="day"
          stroke={CHART_AXIS}
          tick={{ fill: CHART_AXIS, fontSize: 10 }}
          tickFormatter={(v) => String(v).slice(5)}
        />
        <YAxis
          allowDecimals={false}
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
        />
        <Area
          type="stepAfter"
          dataKey="clusters"
          name="Stories"
          stroke="#ea580c"
          fill="url(#areaClusters)"
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
