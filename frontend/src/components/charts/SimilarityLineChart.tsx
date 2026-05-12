import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP_BG, CHART_TOOLTIP_BORDER } from "./chartTheme";

export type LineDatum = { label: string; similarity: number };

/** Cross-outlet narrative alignment trend across stories. */
export function SimilarityLineChart({ data }: { data: LineDatum[] }) {
  if (data.length < 2) {
    return (
      <p className="py-12 text-center text-sm text-text-muted">
        Need more story samples to plot alignment trend.
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
        <XAxis
          dataKey="label"
          stroke={CHART_AXIS}
          tick={{ fill: CHART_AXIS, fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 1]}
          stroke={CHART_AXIS}
          tick={{ fill: CHART_AXIS, fontSize: 10 }}
          tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`}
        />
        <Tooltip
          contentStyle={{
            background: CHART_TOOLTIP_BG,
            border: `1px solid ${CHART_TOOLTIP_BORDER}`,
            borderRadius: 8,
            color: "var(--text-main)",
          }}
          formatter={(value) =>
            typeof value === "number" ? [value.toFixed(3), "Avg alignment"] : [String(value), ""]
          }
        />
        <Line
          type="monotone"
          dataKey="similarity"
          stroke="#38bdf8"
          strokeWidth={2}
          dot={{ r: 2, fill: "#38bdf8" }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
