import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../../hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const ICONS = { follow: "👤", like: "❤️", comment: "💬", wall_post: "📝", mention: "📣", dm_request: "✉️" };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const ref = useRef();
  const navigate = useNavigate();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const handleOpen = () => { setOpen(v => !v); if (!open && unreadCount > 0) markAllRead(); };
  const timeAgo = (ts) => { try { return formatDistanceToNow(ts?.toDate ? ts.toDate() : new Date(ts), { addSuffix: true }); } catch { return ""; } };
  const handleClick = (n) => { markRead(n.id); setOpen(false); if (n.type === "follow") navigate(`/u/${n.fromUsername}`); };
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="rail-btn" onClick={handleOpen} title="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {unreadCount > 0 && <span className="rail-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <span>Notifications</span>
            {notifications.length > 0 && <button className="notif-mark-btn" onClick={markAllRead}>Mark all read</button>}
          </div>
          <div className="notif-panel-list">
            {notifications.length === 0
              ? <div className="notif-empty"><span style={{ fontSize: 28 }}>🔔</span><p>All caught up!</p></div>
              : notifications.slice(0, 20).map(n => (
                  <div key={n.id} className={`notif-row ${!n.read ? "unread" : ""}`} onClick={() => handleClick(n)}>
                    <div className="notif-ico">{ICONS[n.type] || "🔔"}</div>
                    <div className="notif-info">
                      <span className="notif-msg"><b>{n.fromUsername}</b> {n.message}</span>
                      <span className="notif-ts">{timeAgo(n.createdAt)}</span>
                    </div>
                    {!n.read && <div className="notif-unread-dot" />}
                  </div>
                ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
