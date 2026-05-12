import { useIngestionStatus } from "../../hooks/useIngestionStatus";
import { triggerIngestionNow } from "../../api/admin";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

function formatAgo(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function IngestionStatusWidget() {
  const { status, error } = useIngestionStatus(30_000);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);

  async function handleManualRun() {
    setTriggering(true);
    setTriggerMsg(null);
    try {
      const res = await triggerIngestionNow();
      setTriggerMsg(res.message);
    } catch {
      setTriggerMsg("Failed to trigger — backend may be offline.");
    } finally {
      setTriggering(false);
      setTimeout(() => setTriggerMsg(null), 4000);
    }
  }

  // Backend offline or never polled yet
  if (error || !status) {
    return (
      <div className="glass-panel p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-zinc-500" />
          <span className="text-xs text-text-muted font-medium">Ingestion Offline</span>
        </div>
        <span className="text-[10px] text-text-muted">Backend unreachable</span>
      </div>
    );
  }

  const isRunning = status.currently_running;
  const isHealthy = status.scheduler_started && !error;

  return (
    <div className="glass-panel p-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isRunning ? "bg-amber-400 animate-pulse" : isHealthy ? "bg-green-500 animate-pulse" : "bg-zinc-500"}`} />
          <span className="text-xs font-semibold text-text-main uppercase tracking-wider">
            {isRunning ? "Ingesting…" : isHealthy ? "Live Ingestion" : "Scheduler Offline"}
          </span>
        </div>
        <button
          onClick={handleManualRun}
          disabled={triggering || isRunning}
          className="flex items-center gap-1 text-[10px] text-text-muted hover:text-orange-500 transition disabled:opacity-40"
          title="Trigger ingestion now"
        >
          <RefreshCw className={`h-3 w-3 ${triggering ? "animate-spin" : ""}`} />
          Run now
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">Last run</p>
          <p className="text-sm font-semibold tabular-nums text-text-main">
            {formatAgo(status.last_run_seconds_ago)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">New articles</p>
          <p className="text-sm font-semibold tabular-nums text-text-main">
            {status.last_run_inserted > 0 ? `+${status.last_run_inserted}` : status.total_runs > 0 ? "0" : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">Total fetched</p>
          <p className="text-sm font-semibold tabular-nums text-text-main">
            {status.total_inserted.toLocaleString()}
          </p>
        </div>
      </div>

      {triggerMsg && (
        <p className="mt-2 text-[10px] text-orange-500">{triggerMsg}</p>
      )}
    </div>
  );
}
