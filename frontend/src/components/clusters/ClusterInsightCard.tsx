import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { ClusterDetail } from "../../types/api";
import { LeaningPill } from "../ui/LeaningPill";
import { formatPercentage, getAlignmentLabel } from "../../utils/formatting";
function distinctLeanings(detail: ClusterDetail): string[] {
  const set = new Set<string>();
  for (const m of detail.members) {
    if (m.political_leaning) set.add(m.political_leaning);
  }
  return [...set].sort();
}

function distinctSources(detail: ClusterDetail): string[] {
  const set = new Set<string>();
  for (const m of detail.members) {
    const n = m.source_name || m.source;
    if (n) set.add(n);
  }
  return [...set].slice(0, 6);
}

export function ClusterInsightCard({ detail }: { detail: ClusterDetail }) {
  const sources = distinctSources(detail);
  const leanings = distinctLeanings(detail);
  const narrative =
    detail.narrative_analysis &&
    typeof detail.narrative_analysis === "object" &&
    "error" in detail.narrative_analysis === false
      ? detail.narrative_analysis
      : null;

  let bullets =
    narrative && "narrative_bullets" in narrative && Array.isArray(narrative.narrative_bullets)
      ? narrative.narrative_bullets.slice(0, 3)
      : [];
      
  if (bullets.length === 0 && detail.members.length > 0) {
    const summary = detail.members[0].summary;
    if (summary) {
      bullets = summary.split(". ").slice(0, 2).map(s => s + (s.endsWith(".") ? "" : "."));
    }
  }

  const withSim = detail.members.filter((m) => m.similarity_to_centroid != null);
  const avgSim =
    withSim.length > 0
      ? withSim.reduce((acc, m) => acc + (m.similarity_to_centroid ?? 0), 0) / withSim.length
      : null;

  const matchDisplay = formatPercentage(avgSim);
  const alignmentLabel = getAlignmentLabel(avgSim);

  // Improved generic name detection
  const isGeneric = (n?: string | null) => {
    if (!n || n.trim().length === 0) return true;
    const trimmed = n.trim().toLowerCase();
    const genericPatterns = [
      /^cluster\s*\d*$/i,
      /^politics$/i,
      /^topic$/i,
      /^news$/i,
      /^govt/i,
      /^article/i,
      /^story/i,
      /^breaking/i,
      /^headline/i,
      /^uncategorized/i,
    ];
    return genericPatterns.some(pattern => pattern.test(trimmed));
  };
  
  // Extract meaningful title from article
  const extractArticleTitle = (title: string): string => {
    return title
      .split(" - ")[0]
      .split(" | ")[0]
      .split(" :: ")[0]
      .split("—")[0]
      .trim();
  };
  
  let topic = detail.cluster_name;
  if (isGeneric(topic)) topic = detail.topic || "";
  if (isGeneric(topic) && detail.members.length > 0) {
    topic = extractArticleTitle(detail.members[0].title);
  }
  if (isGeneric(topic) && detail.members.length > 1) {
    const titleWords = detail.members
      .slice(0, 5)
      .map(m => extractArticleTitle(m.title).split(/\s+/))
      .flat()
      .filter(w => w.length > 3);
    
    const wordCount = new Map<string, number>();
    for (const word of titleWords) {
      const lower = word.toLowerCase().replace(/[^a-z0-9]/gi, "");
      if (lower.length > 3) {
        wordCount.set(lower, (wordCount.get(lower) || 0) + 1);
      }
    }
    
    const commonWords = [...wordCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
    
    if (commonWords.length >= 2) {
      topic = commonWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  }
  if (!topic || isGeneric(topic)) topic = "Major News Event";

  return (
    <div className="glass-panel flex flex-col p-4 transition hover:border-orange-500/25">
      {/* Title */}
      <h3 className="text-base font-semibold leading-tight text-text-main line-clamp-2 min-h-[2.5rem]" title={topic}>
        {topic}
      </h3>

      {/* Sources and political mix */}
      <div className="mt-3 space-y-2">
        {sources.length > 0 && (
          <p className="text-xs font-medium text-text-muted line-clamp-1">
            {sources.join(" · ")}
          </p>
        )}
        {leanings.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {leanings.map((l) => (
              <LeaningPill key={l} leaning={l} />
            ))}
          </div>
        )}
      </div>

      {bullets.length > 0 && (
        <p className="mt-3 text-xs text-text-muted leading-relaxed line-clamp-2">
          {bullets[0]}
        </p>
      )}

      <div className="flex-1" />

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between pt-3 border-t border-border-subtle">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-sky-400">{matchDisplay}</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{alignmentLabel}</span>
        </div>
        <Link
          to={`/clusters/${detail.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 active:bg-orange-700"
        >
          Analysis
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}