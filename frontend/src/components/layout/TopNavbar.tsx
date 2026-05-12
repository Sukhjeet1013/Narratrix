import { Menu, Moon, Newspaper, Search, Sun } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

export function TopNavbar({
  onMenuClick,
  sourceCount,
}: {
  onMenuClick?: () => void;
  sourceCount: number | null;
}) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState("");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/clusters?q=${encodeURIComponent(q)}`);
    else navigate("/clusters");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-base/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <button
          type="button"
          className="rounded-lg p-2 text-text-muted md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-600 to-amber-700 text-sm font-bold text-white shadow-lg shadow-orange-900/30">
            N
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold tracking-tight text-text-main">
              Narratrix
            </p>
            <p className="max-w-[200px] text-[10px] font-medium leading-snug text-text-muted">
              AI-Powered Political Narrative Intelligence
            </p>
          </div>
        </Link>

        <form onSubmit={onSearch} className="mx-auto flex max-w-xl flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stories, topics, headlines…"
              className="w-full rounded-lg border border-border-subtle bg-bg-card py-2 pl-9 pr-3 text-sm text-text-main placeholder:text-text-muted focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
            />
          </div>
          <button
            type="submit"
            className="hidden rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-orange-500 sm:block"
          >
            Search
          </button>
        </form>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-lg border border-border-subtle px-2.5 py-1.5 text-xs text-text-muted lg:flex">
            <Newspaper className="h-3.5 w-3.5" />
            <span>Sources</span>
            <span className="font-semibold text-orange-400 tabular-nums">
              {sourceCount != null ? sourceCount : "—"}
            </span>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg border border-border-subtle p-2 text-text-muted transition hover:bg-bg-card hover:text-text-main"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
