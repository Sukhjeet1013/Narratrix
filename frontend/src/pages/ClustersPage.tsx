import { useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { fetchClusterDetailsBatched, fetchClusters } from "../api/clusters";
import { ClusterInsightCard } from "../components/clusters/ClusterInsightCard";
import type { ClusterDetail, ClusterSummary } from "../types/api";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const LEANINGS = [
  "all",
  "left",
  "center-left",
  "center",
  "center-right",
  "right",
  "mixed",
  "unknown",
] as const;

export function ClustersPage() {
  const [searchParams] = useSearchParams();
  const qParam = searchParams.get("q") || "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [list, setList] = useState<ClusterSummary[]>([]);
  const [details, setDetails] = useState<(ClusterDetail | null)[]>([]);

  const [searchInput, setSearchInput] = useState(qParam);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const [topicFilter, setTopicFilter] = useState("");
  const [leaningFilter, setLeaningFilter] = useState<(typeof LEANINGS)[number]>("all");
  const [sourceFilter, setSourceFilter] = useState("");

  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function load() {
      try {
        const clusters = await fetchClusters();
        if (cancelled) return;
        setList(clusters);
        const ids = clusters.map((c) => c.id);
        const d = await fetchClusterDetailsBatched(ids);
        if (cancelled) return;
        setDetails(d);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    timer = setInterval(load, 45_000);

    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, []);

  const merged = useMemo(() => {
    const out: { summary: ClusterSummary; detail: ClusterDetail | null }[] = [];
    for (let i = 0; i < list.length; i++) {
      out.push({ summary: list[i]!, detail: details[i] ?? null });
    }
    return out;
  }, [list, details]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const topic = topicFilter.trim().toLowerCase();
    const src = sourceFilter.trim().toLowerCase();
    return merged.filter(({ summary, detail }) => {
      const hay = `${summary.cluster_name} ${summary.topic ?? ""}`.toLowerCase();
      if (q && !hay.includes(q)) {
        if (!detail?.members.some((m) => m.title.toLowerCase().includes(q))) return false;
      }
      if (topic && !(summary.topic || "").toLowerCase().includes(topic)) return false;
      if (src) {
        const hasSource = detail?.members.some((m) =>
          (m.source_name || m.source || "").toLowerCase().includes(src),
        );
        if (!hasSource) return false;
      }
      if (leaningFilter !== "all" && detail) {
        const has = detail.members.some(
          (m) => (m.political_leaning || "").toLowerCase() === leaningFilter,
        );
        if (!has) return false;
      }
      return true;
    });
  }, [merged, debouncedSearch, topicFilter, sourceFilter, leaningFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-subtle border-t-orange-500"></div>
        <p className="text-sm text-text-muted">Loading stories…</p>
      </div>
    );
  }
  if (err) {
    return <div className="glass-panel border-red-500/30 p-8 text-red-300">{err}</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-text-main">Stories</h1>
        <p className="mt-1 text-sm text-text-muted">
          Cross-source event groupings. Instantly search by headline, topic, or involved outlet.
        </p>
      </header>

      <div className="glass-panel p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-bg-card pl-10 pr-4 py-2.5 text-sm text-text-main focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition outline-none"
              placeholder="Search stories, outlets, or topics..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
              <Filter className="h-3.5 w-3.5" />
            </div>
            <input
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="rounded-lg border border-border-subtle bg-bg-card px-3 py-1.5 text-xs text-text-main w-32"
              placeholder="Topic..."
            />
            <input
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-lg border border-border-subtle bg-bg-card px-3 py-1.5 text-xs text-text-main w-32"
              placeholder="Source..."
            />
            <select
              value={leaningFilter}
              onChange={(e) => setLeaningFilter(e.target.value as (typeof LEANINGS)[number])}
              className="rounded-lg border border-border-subtle bg-bg-card px-3 py-1.5 text-xs text-text-main"
            >
              {LEANINGS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-text-muted">
          {filtered.length} of {merged.length} stories
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(({ detail }) =>
          detail ? (
            <ClusterInsightCard key={detail.id} detail={detail} />
          ) : null,
        )}
      </div>
      {filtered.length === 0 ? (
        <div className="glass-panel p-16 text-center">
          <p className="text-text-muted text-lg">No stories match your search criteria.</p>
          <button 
            onClick={() => { setSearchInput(''); setTopicFilter(''); setSourceFilter(''); setLeaningFilter('all'); }}
            className="mt-4 text-orange-500 hover:underline text-sm font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
