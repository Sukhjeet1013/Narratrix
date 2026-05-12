import type { ClusterDetail, ClusterSummary } from "../types/api";
import { apiClient } from "./client";

export async function fetchClusters(): Promise<ClusterSummary[]> {
  const { data } = await apiClient.get<ClusterSummary[]>("/clusters");
  return data;
}

export async function fetchCluster(id: number): Promise<ClusterDetail> {
  const { data } = await apiClient.get<ClusterDetail>(`/clusters/${id}`);
  return data;
}

export async function fetchClusterDetailsBatched(ids: number[]): Promise<(ClusterDetail | null)[]> {
  return Promise.all(
    ids.map(async (id) => {
      try {
        return await fetchCluster(id);
      } catch {
        return null;
      }
    }),
  );
}
