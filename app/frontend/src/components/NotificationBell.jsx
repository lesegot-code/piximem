// Student Number: u25143230
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../api.js";
import { timeAgo } from "../utils/format.js";

const ICONS = {
  friend_request: "👋",
  friend_accepted: "🤝",
  post_removed: "⚠️",
  verification: "✓",
  reporting: "🚩",
};

export default function NotificationBell()
{
  const navigate = useNavigate();
  const location = useLocation();
  const boxRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unread: 0 });

  const load = useCallback(async() =>
  {
    try
    {
      setData(await getNotifications());
    }
    catch
    {
      //the bell just stays as it was
    }
  }, []);

  //check when the page changes and every 30 seconds
  useEffect(() =>
  {
    let cancelled = false;
    getNotifications().then((d) => { if(!cancelled) setData(d); }).catch(() => {});
    const timer = setInterval(load, 30000);
    return() =>
    {
      cancelled = true;
      clearInterval(timer);
    };
  }, [load, location.pathname]);

  useEffect(() =>
  {
    function onClick(e)
    {
      if(!boxRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e)
    {
      if(e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return() =>
    {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function openItem(n)
  {
    setOpen(false);
    if(!n.read) await markNotificationRead(n._id).catch(() => {});
    load();
    if(n.link) navigate(n.link);
  }

  async function readAll()
  {
    await markAllNotificationsRead().catch(() => {});
    load();
  }

  return(
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="icon-btn relative"
        aria-label={data.unread ? `Notifications, ${data.unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <span aria-hidden="true" className="text-lg">🔔</span>
        {data.unread > 0 &&(
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-pixamber text-pixnavy text-[10px] font-bold flex items-center justify-center">
            {data.unread > 9 ? "9+" : data.unread}
          </span>
        )}
      </button>

      {open &&(
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] card p-0 shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="font-heading text-sm text-ink">Notifications</h2>
            {data.unread > 0 &&(
              <button type="button" onClick={readAll} className="text-xs link">Mark all as read</button>
            )}
          </div>

          {data.items.length === 0 && <p className="px-4 py-6 text-sm text-muted text-center">You're all caught up.</p>}

          <ul className="max-h-96 overflow-y-auto">
            {data.items.map((n) =>(
              <li key={n._id}>
                <button
                  type="button"
                  onClick={() => openItem(n)}
                  className={`w-full text-left flex gap-3 px-4 py-3 text-sm border-b border-border last:border-0 hover:bg-surface2 transition ${
                    n.read ? "text-muted" : "text-ink bg-pixblue/5"
                  }`}
                >
                  <span aria-hidden="true">{ICONS[n.type] || "•"}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block">{n.message}</span>
                    <span className="block text-xs text-muted mt-0.5">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-pixblue mt-1.5 shrink-0" aria-label="Unread" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
