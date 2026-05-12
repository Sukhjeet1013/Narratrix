import { Layers, Newspaper, Sparkles, Target } from "lucide-react";
import { ClusterInsightCard } from "../clusters/ClusterInsightCard";
import { ClusterTimelineChart } from "../charts/ClusterTimelineChart";
import { PoliticalLeaningPie } from "../charts/PoliticalLeaningPie";
import { SimilarityLineChart } from "../charts/SimilarityLineChart";
import { SourceBarChart } from "../charts/SourceBarChart";
import { StatCard } from "../ui/StatCard";
import type { IntelligenceOverview } from "../../hooks/useIntelligenceOverview";

export function DashboardMain({
  data,
  showRecent = true,
}: {
  data: IntelligenceOverview;
  showRecent?: boolean;
}) {
  if (data.loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-subtle border-t-orange-500"></div>
        <p className="text-sm text-text-muted">Loading intelligence layer…</p>
      </div>
    );
  }
  if (data.err) {
    return (
      <div className="glass-panel border-red-500/30 p-8 text-red-300">
        <p className="font-medium">Could not reach the Narratrix API.</p>
        <p className="mt-2 text-sm text-red-200/80">{data.err}</p>
        <p className="mt-3 text-xs text-text-muted">
          Ensure FastAPI is running and <code className="text-text-main">VITE_API_BASE_URL</code> is correct.
        </p>
      </div>
    );
  }

  if (!showRecent) {
    // ANALYTICS VIEW
    return (
      <div className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="glass-panel p-5">
            <h2 className="text-sm font-semibold text-text-main">Political Leaning Distribution</h2>
            <p className="mb-4 text-xs text-text-muted">Metadata for comparative source analysis.</p>
            <PoliticalLeaningPie data={data.leaningPie} />
          </section>
          <section className="glass-panel p-5">
            <h2 className="text-sm font-semibold text-text-main">Source Activity Comparison</h2>
            <p className="mb-4 text-xs text-text-muted">Top outlets by ingested article volume.</p>
            <SourceBarChart data={data.sourceBarsState} />
          </section>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="glass-panel p-5">
            <h2 className="text-sm font-semibold text-text-main">Story Alignment Distribution</h2>
            <p className="mb-4 text-xs text-text-muted">Average narrative match per story over time.</p>
            <SimilarityLineChart data={data.similarityLine} />
          </section>
          <section className="glass-panel p-5">
            <h2 className="text-sm font-semibold text-text-main">Cluster Growth Trends</h2>
            <p className="mb-4 text-xs text-text-muted">Stories identified per day.</p>
            <ClusterTimelineChart data={data.clusterTimeline} />
          </section>
        </div>
      </div>
    );
  }

  // DASHBOARD VIEW
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total articles"
          value={data.articlesCount.toLocaleString()}
          hint="Ingested + deduplicated"
          icon={Newspaper}
        />
        <StatCard title="Active stories" value={data.clustersCount} hint="Grouped news events" icon={Sparkles} />
        <StatCard title="Active sources" value={data.sourcesActive} hint="From source registry" icon={Layers} />
        <StatCard
          title="Avg story match"
          value={data.avgSim != null ? `${(data.avgSim * 100).toFixed(0)}%` : "—"}
          hint="Across recent stories"
          icon={Target}
        />
      </div>

      <div className="space-y-6">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-main">Trending Stories</h2>
              <p className="text-sm text-text-muted">Major narratives identified across multiple sources.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.detailSamples.slice(0, 6).map((d) => (
              <ClusterInsightCard key={d.id} detail={d} />
            ))}
          </div>
          {data.detailSamples.length === 0 ? (
            <p className="text-sm text-text-muted">No stories identified yet. Check data ingestion.</p>
          ) : null}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="glass-panel p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-text-main mb-1">Quick Source Overview</h2>
            <p className="text-xs text-text-muted mb-4">Ingested volume by political leaning.</p>
            <div className="flex-1 min-h-[200px]">
               <PoliticalLeaningPie data={data.leaningPie} />
            </div>
          </div>
          <div className="glass-panel p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-text-main mb-1">Recent Activity</h2>
            <p className="text-xs text-text-muted mb-4">Volume of grouped news events over time.</p>
            <div className="flex-1 min-h-[200px]">
               <ClusterTimelineChart data={data.clusterTimeline} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
