import { Layers, Newspaper, Sparkles, Target, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ClusterInsightCard } from "../components/clusters/ClusterInsightCard";
import { StatCard } from "../components/ui/StatCard";
import { useIntelligenceOverview } from "../hooks/useIntelligenceOverview";
import { IngestionStatusWidget } from "../components/dashboard/IngestionStatusWidget";

function useLastUpdated() {
  const [lastFetch, setLastFetch] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Reset on mount and every 45s (match polling interval)
  useEffect(() => {
    setLastFetch(Date.now());

    const pollTimer = setInterval(() => {
      setLastFetch(Date.now());
    }, 45_000);

    return () => clearInterval(pollTimer);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - lastFetch) / 1000));
    }, 1000);

    return () => clearInterval(tick);
  }, [lastFetch]);

  if (elapsed < 5) return "just now";
  if (elapsed < 60) return `${elapsed}s ago`;

  return `${Math.floor(elapsed / 60)}m ago`;
}

export function DashboardPage() {
  const data = useIntelligenceOverview();
  const lastUpdated = useLastUpdated();

  if (data.loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-subtle border-t-orange-500"></div>

        <p className="text-sm text-text-muted">
          Loading command center…
        </p>
      </div>
    );
  }

  if (data.err) {
    return (
      <div className="glass-panel border-red-500/30 p-8 text-red-300">
        <p className="font-medium">
          Could not reach the Narratrix API.
        </p>

        <p className="mt-2 text-sm text-red-200/80">
          {data.err}
        </p>

        <p className="mt-3 text-xs text-text-muted">
          Ensure FastAPI is running and{" "}
          <code className="text-text-main">
            VITE_API_BASE_URL
          </code>{" "}
          is correct.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <header className="mb-2 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />

            <h1 className="text-xl font-semibold tracking-tight text-text-main">
              Command Center
            </h1>
          </div>

          <p className="mt-0.5 text-sm text-text-muted">
            Real-time narrative intelligence — track breaking stories and cross-outlet framing at a glance.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card px-3 py-1.5 text-[11px] text-text-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />

          <span>
            Live · updated {lastUpdated}
          </span>
        </div>
      </header>

      {/* Executive KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Articles"
          value={(data?.articlesCount ?? 0).toLocaleString()}
          hint="Total ingested"
          icon={Newspaper}
        />

        <StatCard
          title="Active Stories"
          value={(data?.clustersCount ?? 0).toLocaleString()}
          hint="Tracked narratives"
          icon={Sparkles}
        />

        <StatCard
          title="Sources"
          value={(data?.sourcesActive ?? 0).toLocaleString()}
          hint="Monitored outlets"
          icon={Layers}
        />

        <StatCard
          title="Avg Alignment"
          value={
            data?.avgSim != null
              ? `${(data.avgSim * 100).toFixed(0)}%`
              : "—"
          }
          hint="Cross-outlet match"
          icon={Target}
        />
      </div>

      {/* Live Ingestion Status */}
      <IngestionStatusWidget />

      {/* Trending Stories */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-main">
            Trending Stories
          </h2>

          <Link
            to="/clusters"
            className="flex items-center gap-1 text-xs font-medium text-orange-500 transition hover:text-orange-400"
          >
            View all

            <TrendingUp className="h-3.5 w-3.5" />
          </Link>
        </div>

        {(data?.detailSamples ?? []).length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(data?.detailSamples ?? [])
              .slice(0, 6)
              .map((d) => (
                <ClusterInsightCard
                  key={d.id}
                  detail={d}
                />
              ))}
          </div>
        ) : (
          <div className="glass-panel p-8 text-center">
            <Sparkles className="mx-auto mb-2 h-6 w-6 text-text-muted" />

            <p className="text-sm text-text-muted">
              No stories identified yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}