import { Activity, TrendingUp, BarChart3, Layers, Target, PieChart } from "lucide-react";
import { PoliticalLeaningPie } from "../components/charts/PoliticalLeaningPie";
import { SimilarityLineChart } from "../components/charts/SimilarityLineChart";
import { SourceBarChart } from "../components/charts/SourceBarChart";
import { SourceConfidenceIntelligence } from "../components/analytics/SourceConfidenceIntelligence";
import { CoverageDiversityChart } from "../components/analytics/CoverageDiversityChart";
import { DivergenceDistributionChart } from "../components/analytics/DivergenceDistributionChart";
import { SourceTypeDistribution } from "../components/analytics/SourceTypeDistribution";
import { useIntelligenceOverview } from "../hooks/useIntelligenceOverview";

export function AnalyticsPage() {
  const data = useIntelligenceOverview();

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
      </div>
    );
  }

  // Build case-insensitive article count map keyed by lowercase source name
  const articleCounts = new Map<string, number>();
  for (const bar of data.sourceBarsState) {
    articleCounts.set(bar.name.toLowerCase().trim(), bar.count);
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" />
          <h1 className="text-xl font-semibold tracking-tight text-text-main">
            Intelligence Analytics
          </h1>
        </div>
        <p className="max-w-3xl text-sm text-text-muted">
          Deep narrative analysis — framing patterns, source behavior, and cross-outlet intelligence comparison.
        </p>
      </header>

      {/* Section: Editorial Landscape */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">Editorial Landscape</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-panel p-4">
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-semibold text-text-main">
                  Political Leaning Distribution
                </h3>
              </div>
            </div>
            <div className="h-44">
              <PoliticalLeaningPie data={data.leaningPie} />
            </div>
          </div>

          <div className="glass-panel p-4">
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-500" />
                <h3 className="text-sm font-semibold text-text-main">
                  Source Type Distribution
                </h3>
              </div>
            </div>
            <div className="h-44">
              <SourceTypeDistribution sources={data.sources} />
            </div>
          </div>
        </div>
      </section>

      {/* Section: Narrative Patterns */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">Narrative Patterns</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-panel p-4">
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-orange-500" />
                <h3 className="text-sm font-semibold text-text-main">
                  Coverage Diversity Analysis
                </h3>
              </div>
              <p className="text-[10px] text-text-muted mt-0.5">How many outlets cover each story</p>
            </div>
            <div className="h-44">
              <CoverageDiversityChart clusters={data.detailSamples} />
            </div>
          </div>

          <div className="glass-panel p-4">
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-semibold text-text-main">
                  Narrative Framing Agreement
                </h3>
              </div>
              <p className="text-[10px] text-text-muted mt-0.5">How consistently outlets frame each story</p>
            </div>
            <div className="h-44">
              <DivergenceDistributionChart clusters={data.detailSamples} />
            </div>
          </div>
        </div>
      </section>

      {/* Section: Source Activity */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">Source Activity</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-panel p-4">
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-500" />
                <h3 className="text-sm font-semibold text-text-main">
                  Source Activity Comparison
                </h3>
              </div>
              <p className="text-[10px] text-text-muted mt-0.5">Article volume per outlet</p>
            </div>
            <div className="h-44">
              <SourceBarChart data={data.sourceBarsState} />
            </div>
          </div>

          <div className="glass-panel p-4">
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-semibold text-text-main">
                  Story Alignment Distribution
                </h3>
              </div>
              <p className="text-[10px] text-text-muted mt-0.5">Cross-outlet narrative agreement per story</p>
            </div>
            <div className="h-44">
              <SimilarityLineChart data={data.similarityLine} />
            </div>
          </div>
        </div>
      </section>

      {/* Section: Source Intelligence Profiles */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">Source Intelligence</h2>
        <div className="glass-panel p-4">
          <SourceConfidenceIntelligence
            sources={data.sources}
            articleCounts={articleCounts}
          />
        </div>
      </section>
    </div>
  );
}