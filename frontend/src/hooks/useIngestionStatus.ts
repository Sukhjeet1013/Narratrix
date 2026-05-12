import { useEffect, useState } from "react";
import { fetchIngestionStatus, type IngestionStatus } from "../api/admin";

/**
 * Polls /admin/ingestion/status every 30 seconds.
 * Returns null while loading (first fetch not yet complete) or on error.
 */
export function useIngestionStatus(pollMs = 30_000) {
  const [status, setStatus] = useState<IngestionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const s = await fetchIngestionStatus();
        if (!cancelled) {
          setStatus(s);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      }
    }

    poll();
    const timer = setInterval(poll, pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pollMs]);

  return { status, error };
}
