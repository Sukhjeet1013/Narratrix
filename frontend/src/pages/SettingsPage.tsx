import { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { Server, Moon, Sun, Globe, RefreshCcw, Cpu, CheckCircle, XCircle } from "lucide-react";
import { useIngestionStatus } from "../hooks/useIngestionStatus";

function formatLastRun(secondsAgo: number | null): string {
  if (secondsAgo === null) return "Never";
  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
  return `${Math.floor(secondsAgo / 3600)}h ago`;
}

export function SettingsPage() {
  const base = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000 (default)";
  const [health, setHealth] = useState<string>("Checking...");
  const [dbStatus, setDbStatus] = useState<string>("Checking...");
  const { status: ingestionStatus } = useIngestionStatus(60_000);
  
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Check initial health
    apiClient.get<{ status?: string }>("/health")
      .then(() => { setHealth("Online"); setDbStatus("Connected"); })
      .catch(() => { setHealth("Offline"); setDbStatus("Disconnected"); });
      
    // Check theme
    if (document.documentElement.classList.contains("light")) {
      setTheme("light");
    }
  }, []);

  const toggleTheme = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const handleAction = async (action: string, endpoint: string) => {
    setLoadingAction(action);
    setToast(null);
    try {
      const { data } = await apiClient.post<{
        success?: boolean;
        message?: string;
        articles_added?: number;
        clusters_updated?: number;
      }>(endpoint);

      let msg = data.message || "Action completed.";
      if ((data.articles_added ?? 0) > 0) msg += ` (+${data.articles_added} articles)`;
      if ((data.clusters_updated ?? 0) > 0) msg += ` · ${data.clusters_updated} stories updated`;

      setToast({ msg, type: data.success === false ? "error" : "success" });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        (e instanceof Error ? e.message : "Action failed");
      setToast({ msg, type: "error" });
    } finally {
      setLoadingAction(null);
      setTimeout(() => setToast(null), 6000);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <header>
        <h1 className="text-2xl font-semibold text-text-main">Platform Settings</h1>
        <p className="mt-1 text-sm text-text-muted">Manage deployment, ingestion, and interface preferences.</p>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg ${toast.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. System Status */}
        <section className="glass-panel p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text-main mb-4">
            <Server className="h-4 w-4 text-orange-500" />
            System Status
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border-subtle pb-3">
              <span className="text-sm text-text-muted">Backend API</span>
              <span className={`text-sm font-medium ${health === 'Online' ? 'text-green-400' : 'text-text-muted'}`}>{health}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border-subtle pb-3">
              <span className="text-sm text-text-muted">Database Connection</span>
              <span className={`text-sm font-medium ${dbStatus === 'Connected' ? 'text-green-400' : 'text-text-muted'}`}>{dbStatus}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">Last Ingestion Run</span>
              <span className="text-sm font-medium text-text-main">
                {ingestionStatus
                  ? formatLastRun(ingestionStatus.last_run_seconds_ago)
                  : "—"}
              </span>
            </div>
          </div>
        </section>

        {/* 4. Data Controls */}
        <section className="glass-panel p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text-main mb-4">
            <RefreshCcw className="h-4 w-4 text-orange-500" />
            Data Controls
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => handleAction('articles', '/admin/refresh-articles')}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-between rounded-lg border border-border-subtle bg-bg-card px-4 py-2.5 text-sm font-medium text-text-main transition hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            >
              Fetch Latest Articles
              {loadingAction === 'articles' && <span className="h-4 w-4 animate-spin rounded-full border-2 border-border-subtle border-t-orange-500" />}
            </button>
            <button
              onClick={() => handleAction('clusters', '/admin/rebuild-clusters')}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-between rounded-lg border border-border-subtle bg-bg-card px-4 py-2.5 text-sm font-medium text-text-main transition hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            >
              Regenerate Stories
              {loadingAction === 'clusters' && <span className="h-4 w-4 animate-spin rounded-full border-2 border-border-subtle border-t-orange-500" />}
            </button>
            <button
              onClick={() => handleAction('analytics', '/admin/refresh-analytics')}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-between rounded-lg border border-border-subtle bg-bg-card px-4 py-2.5 text-sm font-medium text-text-main transition hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            >
              Rebuild Analytics
              {loadingAction === 'analytics' && <span className="h-4 w-4 animate-spin rounded-full border-2 border-border-subtle border-t-orange-500" />}
            </button>
          </div>
        </section>

        {/* 2. Appearance */}
        <section className="glass-panel p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text-main mb-4">
            <Sun className="h-4 w-4 text-orange-500" />
            Appearance
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => toggleTheme("dark")}
              className={`flex flex-col items-center gap-2 rounded-xl border ${theme === 'dark' ? 'border-orange-500 bg-orange-500/10' : 'border-border-subtle bg-bg-card'} p-4 transition`}
            >
              <Moon className={`h-6 w-6 ${theme === 'dark' ? 'text-orange-500' : 'text-text-muted'}`} />
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-orange-500' : 'text-text-muted'}`}>Dark</span>
            </button>
            <button 
              onClick={() => toggleTheme("light")}
              className={`flex flex-col items-center gap-2 rounded-xl border ${theme === 'light' ? 'border-orange-500 bg-orange-500/10' : 'border-border-subtle bg-bg-card'} p-4 transition`}
            >
              <Sun className={`h-6 w-6 ${theme === 'light' ? 'text-orange-500' : 'text-text-muted'}`} />
              <span className={`text-sm font-medium ${theme === 'light' ? 'text-orange-500' : 'text-text-muted'}`}>Light</span>
            </button>
          </div>
        </section>

        {/* 3. Language */}
        <section className="glass-panel p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text-main mb-4">
            <Globe className="h-4 w-4 text-orange-500" />
            Language (Preview)
          </h2>
          <div className="space-y-2">
            {['English (Default)', 'Hindi', 'Punjabi', 'Tamil'].map((lang, i) => (
              <div key={lang} className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2">
                <span className="text-sm text-text-main">{lang}</span>
                {i === 0 ? <span className="h-2 w-2 rounded-full bg-green-500" /> : <span className="text-[10px] uppercase text-text-muted">Coming soon</span>}
              </div>
            ))}
          </div>
        </section>

        {/* 5. Platform Info */}
        <section className="glass-panel p-6 md:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text-main mb-4">
            <Cpu className="h-4 w-4 text-orange-500" />
            Platform & Deployment Info
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted">API Endpoint</p>
                <p className="mt-1 font-mono text-xs text-orange-300 break-all">{base}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted">Embedding Model</p>
                <p className="mt-1 text-sm text-text-main">all-MiniLM-L6-v2 (Sentence-Transformers)</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted">Story Grouping Engine</p>
                <p className="mt-1 text-sm text-text-main">Agglomerative Hierarchical (Cosine, Avg Linkage)</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted">Environment</p>
                <p className="mt-1 text-sm text-text-main">Production Ready</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted">Frontend Build</p>
                <p className="mt-1 text-sm text-text-main">Vite optimized (Static)</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted">App Version</p>
                <p className="mt-1 text-sm text-text-main">v1.0.0-rc1</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
