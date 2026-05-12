import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { fetchSources } from "../api/sources";
import { AppSidebar } from "../components/layout/AppSidebar";
import { TopNavbar } from "../components/layout/TopNavbar";

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sourceCount, setSourceCount] = useState<number | null>(null);

  useEffect(() => {
    let ok = true;
    fetchSources()
      .then((rows) => {
        if (ok) setSourceCount(rows.filter((s) => s.active).length);
      })
      .catch(() => {
        if (ok) setSourceCount(null);
      });
    return () => {
      ok = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-56 transform transition-transform duration-300 md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AppSidebar onNavigate={() => setMobileOpen(false)} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar
          onMenuClick={() => setMobileOpen(true)}
          sourceCount={sourceCount}
        />
        <main className="min-h-[calc(100vh-3.5rem)] flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
