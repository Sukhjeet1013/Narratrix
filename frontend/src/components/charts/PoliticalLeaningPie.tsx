import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { LeaningSlice } from "../../types/api";
import { leaningPieColor } from "../../utils/leaning";
import { CHART_TOOLTIP_BG, CHART_TOOLTIP_BORDER } from "./chartTheme";

export function PoliticalLeaningPie({ data }: { data: LeaningSlice[] }) {
  if (!data.length) {
    return <p className="py-12 text-center text-sm text-text-muted">No leaning metadata yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={88}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          stroke="rgba(24,24,27,0.9)"
          strokeWidth={2}
        >
          {data.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={leaningPieColor(entry.name)} />
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
