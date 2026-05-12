import { useEffect, useMemo, useState } from "react";
import { fetchSources } from "../api/sources";
import { fetchArticles } from "../api/articles";
import { LeaningPill } from "../components/ui/LeaningPill";
import type { Article, Source } from "../types/api";
import { Search, Newspaper } from "lucide-react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

function getFramingTendency(leaning: string | null): string {
  const l = (leaning || "").toLowerCase();
  if (l === "left") return "Progressive framing";
  if (l === "center-left") return "Center-left perspective";
  if (l === "right") return "Conservative framing";
  if (l === "center-right") return "Center-right perspective";
  if (l === "center") return "Centrist perspective";
  return "Mixed perspective";
}

export function SourcesPage() {
  const [rows, setRows] = useState<Source[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const debounced = useDebouncedValue(q, 250);

  useEffect(() => {
    let ok = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function load() {
      try {
        const [srcs, arts] = await Promise.all([fetchSources(), fetchArticles(8000)]);
        if (ok) { setRows(srcs); setArticles(arts); }
      } catch (e) {
        if (ok) setErr(e instanceof Error ? e.message : "Failed");
      } finally {
        if (ok) setLoading(false);
      }
    }

    load();
    timer = setInterval(load, 45_000);
    return () => { ok = false; if (timer) clearInterval(timer); };
  }, []);

  // Build case-insensitive article count map
  const articleCountMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of articles) {
      const k = (a.source || "").toLowerCase().trim();
      if (k) m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }, [articles]);

  function getArticleCount(sourceName: string): number {
    return articleCountMap.get(sourceName.toLowerCase().trim()) ?? 0;
  }

  // Show ALL active sources — never filter by article count
  const activeSources = useMemo(() => rows.filter(r => r.active), [rows]);

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase();
    if (!s) return activeSources;
    return activeSources.filter(
      (r) =>
        r.source_name.toLowerCase().includes(s) ||
        (r.political_leaning || "").toLowerCase().includes(s) ||
        (r.country || "").toLowerCase().includes(s),
    );
  }, [activeSources, debounced]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-subtle border-t-orange-500"></div>
        <p className="text-sm text-text-muted">Loading source intelligence…</p>
      </div>
    );
  }
  if (err) {
    return <div className="glass-panel p-8 text-red-400">{err}</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <header>
        <h1 className="text-2xl font-semibold text-text-main">Media Sources</h1>
        <p className="mt-1 text-sm text-text-muted">
          Editorial profiles and coverage patterns for monitored outlets.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search outlets, ideologies, or countries…"
            className="w-full rounded-lg border border-border-subtle bg-bg-card pl-10 pr-4 py-2.5 text-sm text-text-main placeholder:text-text-muted focus:border-orange-500 focus:outline-none transition"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted bg-bg-card px-4 py-2 rounded-lg border border-border-subtle shrink-0">
          <span className="font-semibold text-text-main">{filtered.length}</span> sources
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center text-text-muted">
          No sources match your search.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const articleCount = getArticleCount(r.source_name);
            const framingTendency = getFramingTendency(r.political_leaning);

            return (
              <div key={r.id} className="glass-panel flex flex-col p-4 transition-all duration-200 hover:border-orange-500/30 hover:shadow-md">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-base text-text-main leading-tight">{r.source_name}</h3>
                  <LeaningPill leaning={r.political_leaning} />
                </div>

                <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-3">
                  {r.source_type || 'News Outlet'} · {r.country || 'Global'}
                </p>

                <div className="mt-auto pt-3 border-t border-border-subtle flex items-center gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Newspaper className="h-3.5 w-3.5 shrink-0" />
                    {articleCount > 0 ? `${articleCount.toLocaleString()} articles` : "No data"}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${r.active ? 'bg-green-500' : 'bg-zinc-400'}`} />
                    {framingTendency}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}