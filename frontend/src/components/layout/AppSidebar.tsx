import {
  Activity,
  LayoutDashboard,
  Newspaper,
  Settings,
  Sparkles,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/clusters", label: "Stories", icon: Sparkles, end: false },
  { to: "/sources", label: "Sources", icon: Newspaper, end: false },
  { to: "/analytics", label: "Analytics", icon: Activity, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border-subtle bg-bg-card backdrop-blur-md">
      <div className="px-4 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">Navigate</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-2 pb-6">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-orange-500/15 text-orange-500 ring-1 ring-orange-500/25"
                    : "sidebar-navitem text-text-muted hover:bg-bg-base hover:text-text-main",
                ].join(" ")
              }
          >
            <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border-subtle p-4">
        <p className="text-xs leading-relaxed text-text-muted">
          AI-powered cross-source narrative mapping — compare how outlets frame the same events.
        </p>
      </div>
    </aside>
  );
}
