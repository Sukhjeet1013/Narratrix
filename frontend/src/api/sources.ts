import type { Source } from "../types/api";
import { apiClient } from "./client";

export async function fetchSources(): Promise<Source[]> {
  const { data } = await apiClient.get<Source[]>("/sources");
  return data;
}
