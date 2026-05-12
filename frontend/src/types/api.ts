export type LeaningSlice = { name: string; value: number };

export interface SimilarArticle {
  article_id: number;
  title: string;
  source: string | null;
  similarity_score: number;
}

export interface Article {
  id: number;
  title: string;
  source: string | null;
  url: string;
  cleaned_title: string | null;
  cleaned_content: string | null;
  summary: string | null;
  topic: string | null;
  published_at: string | null;
  created_at: string;
  similar_articles?: SimilarArticle[];
}

export interface NarrativeSourceBlock {
  source_name: string;
  political_leaning: string;
  reliability_score: number | null;
  article_count: number;
  dominant_sentiment: string | null;
  sample_framing: string | null;
  summary_excerpt: string | null;
  narrative_angle: string;
}

export interface NarrativeAnalysis {
  cluster_id: number | null;
  cluster_name: string;
  topic: string | null;
  summary: string | null;
  distinct_source_count: number | null;
  leaning_distribution: Record<string, number>;
  sources: NarrativeSourceBlock[];
  narrative_bullets: string[];
  cross_cut_observations: string[];
  error?: string | null;
}

export interface ClusterMember {
  article_id: number;
  title: string;
  source: string | null;
  source_name: string | null;
  topic: string | null;
  summary: string | null;
  political_leaning: string | null;
  sentiment: string | null;
  framing: string | null;
  similarity_to_centroid: number | null;
}

export interface ClusterSummary {
  id: number;
  cluster_name: string;
  topic: string | null;
  created_at: string;
  member_count: number;
}

export interface ClusterDetail extends ClusterSummary {
  members: ClusterMember[];
  narrative_analysis: NarrativeAnalysis | Record<string, unknown>;
}

export interface Source {
  id: number;
  source_name: string;
  source_type: string;
  country: string;
  language: string;
  political_leaning: string;
  leaning_confidence: number | null;
  editorial_notes: string | null;
  ownership_group: string | null;
  last_reviewed_at: string | null;
  active: boolean;
  website_url: string | null;
  rss_url: string | null;
  newsapi_domain: string | null;
}
