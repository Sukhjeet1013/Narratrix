import type { Article } from "../types/api";
import { apiClient } from "./client";

export async function fetchArticles(limit = 5000): Promise<Article[]> {
  const { data } = await apiClient.get<Article[]>("/articles", { params: { limit } });
  return data;
}

export async function fetchArticle(id: number): Promise<Article> {
  const { data } = await apiClient.get<Article>(`/articles/${id}`);
  return data;
}
