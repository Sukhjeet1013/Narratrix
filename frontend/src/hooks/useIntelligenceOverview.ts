import { useEffect, useMemo, useState } from "react";
import { fetchArticles } from "../api/articles";
import { fetchClusterDetailsBatched, fetchClusters } from "../api/clusters";
import { fetchSources } from "../api/sources";
import type { LeaningSlice } from "../types/api";
import type { SourceBarDatum } from "../components/charts/SourceBarChart";
import type { ClusterDetail, Source } from "../types/api";
import { averageCentroidSimilarity } from "../utils/stats";

export interface IntelligenceOverview {
  loading: boolean;
  err: string | null;
  articlesCount: number;
  clustersCount: number;
  sourcesActive: number;
  sources: Source[];
  detailSamples: ClusterDetail[];
  sourceBarsState: SourceBarDatum[];
  clusterTimeline: { day: string; clusters: number }[];
  leaningPie: LeaningSlice[];
  avgSim: number | null;
  similarityLine: { label: string; similarity: number }[];
}

export function useIntelligenceOverview(): IntelligenceOverview {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [articlesCount, setArticlesCount] = useState(0);
  const [clustersCount, setClustersCount] = useState(0);
  const [sourcesActive, setSourcesActive] = useState(0);
  const [sources, setSources] = useState<Source[]>([]);
  const [detailSamples, setDetailSamples] = useState<ClusterDetail[]>([]);
  const [sourceBarsState, setSourceBarsState] = useState<SourceBarDatum[]>([]);
  const [clusterTimeline, setClusterTimeline] = useState<{ day: string; clusters: number }[]>([]);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    async function load() {
      try {
        const [articles, clusters, srcs] = await Promise.all([
          fetchArticles(8000),
          fetchClusters(),
          fetchSources(),
        ]);
        if (cancelled) return;
        setArticlesCount(articles.length);
        setClustersCount(clusters.length);
        setSources(srcs);
        setSourcesActive(srcs.filter((s) => s.active).length);

        const srcMap = new Map<string, number>();
        for (const a of articles) {
          const k = a.source || "Unknown";
          srcMap.set(k, (srcMap.get(k) || 0) + 1);
        }
        setSourceBarsState(
          [...srcMap.entries()]
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count),
        );

        const sortedIds = [...clusters].sort((a, b) => b.id - a.id).slice(0, 14).map((c) => c.id);
        const details = await fetchClusterDetailsBatched(sortedIds);
        if (cancelled) return;
        setDetailSamples(details.filter((d): d is ClusterDetail => d != null));

        const dayMap = new Map<string, number>();
        for (const c of clusters) {
          const day = c.created_at.slice(0, 10);
          dayMap.set(day, (dayMap.get(day) || 0) + 1);
        }
        const timeline = [...dayMap.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-14)
          .map(([day, clustersN]) => ({ day, clusters: clustersN }));
        setClusterTimeline(timeline);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // Poll every 45 seconds for fresh data
    pollTimer = setInterval(load, 45_000);

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, []);

  const leaningPie = useMemo((): LeaningSlice[] => {
    const m = new Map<string, number>();
    for (const s of sources) {
      const k = s.political_leaning || "unknown";
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [sources]);

  const avgSim = averageCentroidSimilarity(detailSamples);

  const similarityLine = useMemo(() => {
    return detailSamples.slice(0, 16).map((d, i) => {
      const mems = d.members.filter((m) => m.similarity_to_centroid != null);
      const sim =
        mems.length > 0
          ? mems.reduce((a, m) => a + (m.similarity_to_centroid || 0), 0) / mems.length
          : 0;
      return { label: `${i + 1}`, similarity: sim };
    });
  }, [detailSamples]);

  return {
    loading,
    err,
    articlesCount,
    clustersCount,
    sourcesActive,
    sources,
    detailSamples,
    sourceBarsState,
    clusterTimeline,
    leaningPie,
    avgSim,
    similarityLine,
  };
}
