import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="glass-panel group relative overflow-hidden p-4 transition-all duration-200 hover:border-orange-500/30 hover:shadow-md">
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-orange-500/5 blur-xl transition group-hover:bg-orange-500/10" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{title}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-text-main tabular-nums">{value}</p>
          {hint ? <p className="mt-0.5 text-[10px] text-text-muted">{hint}</p> : null}
        </div>
        <div className="rounded-md border border-border-subtle bg-bg-card/50 p-2 text-orange-500">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}