import axios from "axios";

function resolveBaseUrl(): string {
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env && env.length > 0) {
    return env.replace(/\/$/, "");
  }
  return "http://127.0.0.1:8000";
}

export const apiClient = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 120_000,
  headers: {
    Accept: "application/json",
  },
});
