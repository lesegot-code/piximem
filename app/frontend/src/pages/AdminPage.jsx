// Student Number: u25143230
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { admin } from "../api.js";
import ReportsPanel from "../components/admin/ReportsPanel.jsx";
import UsersPanel from "../components/admin/UsersPanel.jsx";
import { PostsPanel, AlbumsPanel } from "../components/admin/ContentPanels.jsx";
import { ReasonsPanel, VerificationsPanel } from "../components/admin/SettingsPanels.jsx";

const TABS = [
  { id: "reports", label: "Reported posts", count: "reported" },
  { id: "verifications", label: "Verification", count: "pending" },
  { id: "users", label: "Users", count: "users" },
  { id: "posts", label: "Posts", count: "posts" },
  { id: "albums", label: "Albums", count: "albums" },
  { id: "reasons", label: "Report reasons" },
];

export default function AdminPage()
{
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "reports";
  const [stats, setStats] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() =>
  {
    let cancelled = false;
    admin.overview().then((s) => { if(!cancelled) setStats(s); }).catch(() => {});
    return() => { cancelled = true; };
  }, [version]);

  //counts at the top update after any change
  const onChange = () => setVersion((v) => v + 1);

  return(
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl text-ink">Moderation</h1>
        <p className="text-sm text-muted">Review reports, manage accounts and keep Pixel Memory friendly.</p>
      </header>

      <div className="flex border-b border-border overflow-x-auto" role="tablist">
        {TABS.map((t) =>(
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams(t.id === "reports" ? {} : { tab: t.id }, { replace: true })}
            className={`tab ${tab === t.id ? "tab-active" : ""}`}
          >
            {t.label}
            {t.count && stats && (
              <span className={`ml-1.5 text-xs rounded-full px-1.5 ${
                (t.id === "reports" || t.id === "verifications") && stats[t.count] ? "bg-pixamber text-pixnavy" : "text-muted"
              }`}>
                {stats[t.count]}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "reports" && <ReportsPanel onChange={onChange} />}
      {tab === "verifications" && <VerificationsPanel onChange={onChange} />}
      {tab === "users" && stats && <UsersPanel rules={stats.rules} onChange={onChange} />}
      {tab === "posts" && <PostsPanel onChange={onChange} />}
      {tab === "albums" && <AlbumsPanel onChange={onChange} />}
      {tab === "reasons" && <ReasonsPanel />}
    </div>
  );
}
