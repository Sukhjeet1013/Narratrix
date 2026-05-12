import { ArrowLeft, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchCluster } from "../api/clusters";
import { LeaningPill } from "../components/ui/LeaningPill";
import { formatPercentage } from "../utils/formatting";
import type { ClusterDetail, NarrativeAnalysis } from "../types/api";

function isNarrative(val: unknown): val is NarrativeAnalysis {
  return (
    typeof val === "object" &&
    val != null &&
    ("narrative_bullets" in val || "sources" in val)
  );
}

export function ClusterDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<ClusterDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let ok = true;
    setLoading(true);
    setErr(null);
    fetchCluster(Number(id))
      .then((d) => {
        if (ok) setData(d);
      })
      .catch((e) => {
        if (ok) setErr(e instanceof Error ? e.message : "Failed to load cluster");
      })
      .finally(() => {
        if (ok) setLoading(false);
      });
    return () => {
      ok = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-subtle border-t-orange-500"></div>
        <p className="text-sm text-text-muted">Loading story intelligence…</p>
      </div>
    );
  }
  if (err || !data) {
    return (
      <div className="glass-panel p-8 text-red-300">
        {err || "Not found"}{" "}
        <Link to="/clusters" className="text-orange-400 underline">
          Back
        </Link>
      </div>
    );
  }

  const narrativeRaw = data.narrative_analysis;
  const narrative = isNarrative(narrativeRaw) ? narrativeRaw : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          to="/clusters"
          className="inline-flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-main transition hover:border-border-subtle"
        >
          <ArrowLeft className="h-4 w-4" />
          Stories
        </Link>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Sparkles className="h-4 w-4 text-orange-500" />
          <span>Narrative analysis</span>
        </div>
      </div>

      <header className="glass-panel p-6">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-orange-500">
            Story #{data.id}
          </p>
          <span className="rounded-full bg-bg-card px-2 py-0.5 text-[9px] font-bold text-text-main">
            {data.member_count} SOURCES
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-main">
          {(() => {
            const isGeneric = (n?: string | null) => !n || /^(cluster|politics|topic|news)/i.test(n.trim());
            let t = data.cluster_name;
            if (isGeneric(t)) t = narrative?.topic || data.topic || "";
            if (isGeneric(t) && data.members.length > 0) t = data.members[0].title.split(" - ")[0].split(" | ")[0].trim();
            if (!t || isGeneric(t)) t = "Major News Event";
            return t;
          })()}
        </h1>
        {narrative?.cross_cut_observations?.length ? (
          <div className="mt-5 border-t border-border-subtle pt-5">
            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">Event Summary</p>
            <ul className="space-y-2 text-sm text-text-main">
              {narrative.cross_cut_observations.map((c, i) => (
                <li key={i}>• {c}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </header>

      <section className="mt-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text-main">Media Perspective Comparison</h2>
          <p className="text-sm text-text-muted mt-1">How different outlets are framing the same event — note the emphasis, tone, and angle differences.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {data.members.map((m) => {
            const s = narrative?.sources?.find(src => src.source_name === m.source_name || src.source_name === m.source);
            const narrativeFocus = s?.narrative_angle || m.framing || 'Straight factual reporting';
            
            return (
              <div
                key={m.article_id}
                className="glass-panel flex flex-col p-5 transition-all duration-200 hover:border-orange-500/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-lg text-text-main leading-tight">{m.source_name || m.source || "Unknown"}</h3>
                  <LeaningPill leaning={m.political_leaning} />
                </div>
                
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm font-semibold text-sky-500 tabular-nums">{formatPercentage(m.similarity_to_centroid)}</span>
                  <span className="text-xs text-text-muted">narrative alignment</span>
                </div>

                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1">
                    <span className="text-orange-500">▸</span> This outlet's angle
                  </p>
                  <p className="text-sm text-text-main leading-relaxed">
                    {narrativeFocus}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-border-subtle flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1.5">Article</p>
                  <Link to={`/articles/${m.article_id}`} className="text-xs font-semibold text-orange-500 hover:text-orange-400 hover:underline line-clamp-2 mb-2 block">
                    {m.title}
                  </Link>
                  {m.summary && (
                    <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                      {m.summary}
                    </p>
                  )}
                </div>

                {m.sentiment ? (
                  <div className="mt-4 pt-4 border-t border-border-subtle">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-card px-2.5 py-1 text-[10px] font-medium text-text-muted border border-border-subtle">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        m.sentiment.toLowerCase().includes('positive') ? 'bg-green-500' :
                        m.sentiment.toLowerCase().includes('negative') ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      {m.sentiment}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {narrative?.narrative_bullets?.length ? (
        <section className="glass-panel p-6">
          <h2 className="text-lg font-semibold text-text-main">Related coverage</h2>
          <ul className="mt-4 space-y-3 text-sm text-text-main">
            {narrative.narrative_bullets.map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-orange-500">▸</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {narrative?.error ? (
        <p className="text-sm text-amber-400">Analysis note: {narrative.error}</p>
      ) : null}
    </div>
  );
}
