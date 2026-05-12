import { apiClient } from "./client";

export interface IngestionStatus {
  scheduler_started: boolean;
  currently_running: boolean;
  last_run_at: string | null;
  last_run_seconds_ago: number | null;
  last_run_inserted: number;
  last_run_skipped: number;
  last_run_sources_ok: number;
  last_run_sources_failed: number;
  last_cluster_rebuild_at: string | null;
  total_runs: number;
  total_inserted: number;
}

export async function fetchIngestionStatus(): Promise<IngestionStatus> {
  const { data } = await apiClient.get<IngestionStatus>("/admin/ingestion/status");
  return data;
}

export async function triggerIngestionNow(): Promise<{ status: string; message: string }> {
  const { data } = await apiClient.post("/admin/ingestion/run");
  return data;
}
