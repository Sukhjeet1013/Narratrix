import type { ClusterDetail } from "../types/api";

export function averageCentroidSimilarity(details: ClusterDetail[]): number | null {
  const scores: number[] = [];
  for (const d of details) {
    for (const m of d.members) {
      if (m.similarity_to_centroid != null && Number.isFinite(m.similarity_to_centroid)) {
        scores.push(m.similarity_to_centroid);
      }
    }
  }
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function groupArticlesByDay(
  dates: (string | null | undefined)[],
  window = 14,
): { day: string; count: number }[] {
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = 0; i < window; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (window - 1 - i));
    const key = d.toISOString().slice(0, 10);
    map.set(key, 0);
  }
  for (const raw of dates) {
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].map(([day, count]) => ({ day, count }));
}
