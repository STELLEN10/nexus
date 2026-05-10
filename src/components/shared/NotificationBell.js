import { useState } from "react";
import { createPortal } from "react-dom";
import { useNotifications } from "../../hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const ICONS = {
  follow:     "👤",
  like:       "❤️",
  comment:    "💬",
  wall_post:  "📝",
  mention:    "📣",
  dm_request: "✉️",
  badge:      "🏅",
  coin:       "🪙",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const navigate = useNavigate();

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open && unreadCount > 0) markAllRead();
  };

  const timeAgo = (ts) => {
    try { return formatDistanceToNow(ts?.toDate ? ts.toDate() : new Date(ts), { addSuffix: true }); }
    catch { return ""; }
  };

  const handleClick = (n) => {
    markRead(n.id);
    setOpen(false);
    if (n.type === "follow") navigate(`/u/${n.fromUsername}`);
    if (n.type === "badge") navigate(`/u/${n.toUsername || ""}`);
  };

  return (
    <>
      <button className="rail-btn" onClick={handleOpen} title="Notifications" style={{ position: "relative" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 10, right: 10,
            background: "var(--red)", color: "#fff",
            fontSize: 10, fontWeight: 800, padding: "2px 5px",
            borderRadius: 10, border: "2px solid var(--bg)",
            boxShadow: "0 0 10px rgba(239,68,68,.5)"
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && createPortal(
        <div className="modal-bg" onClick={() => setOpen(false)} style={{ background: "transparent" }}>
          <div className="notif-modal" style={{
            position: "fixed", top: 20, left: 80,
            width: 360, maxHeight: "80vh",
            background: "var(--bg-1)", border: "1.5px solid var(--border-2)",
            borderRadius: "var(--r-xl)", boxShadow: "0 20px 50px rgba(0,0,0,.8), 0 0 30px var(--glow-purple)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            animation: "settings-enter .2s ease-out"
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(255,255,255,.02)"
            }}>
              <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.02em" }}>Notifications</span>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {unreadCount > 0 && (
                  <button style={{
                    background: "none", border: "none", color: "var(--accent-2)",
                    fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0
                  }} onClick={markAllRead}>Mark all read</button>
                )}
                <button className="icon-btn" onClick={() => setOpen(false)}>✕</button>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-3)" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
                  <div style={{ fontWeight: 700, color: "var(--text-2)" }}>All caught up!</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>No new notifications yet.</div>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    style={{
                      display: "flex", gap: 14, padding: "14px 20px",
                      cursor: "pointer", transition: "all .15s",
                      background: !n.read ? "var(--accent-bg)" : "transparent",
                      borderLeft: `3px solid ${!n.read ? "var(--accent-2)" : "transparent"}`
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = !n.read ? "var(--accent-bg)" : "transparent"}
                    onClick={() => handleClick(n)}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: "var(--r-md)",
                      background: "var(--bg-2)", border: "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0, boxShadow: !n.read ? "0 0 10px var(--glow-purple)" : "none"
                    }}>
                      {ICONS[n.type] || "🔔"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-1)" }}>
                        <b style={{ color: "var(--text)" }}>{n.fromUsername}</b> {n.message}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4, fontWeight: 600 }}>
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                    {!n.read && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-2)", marginTop: 16, boxShadow: "0 0 8px var(--glow-purple)" }} />
                    )}
                  </div>
                ))
              )}
            </div>
            
            {notifications.length > 0 && (
              <div style={{ padding: 12, borderTop: "1px solid var(--border)", textAlign: "center", background: "rgba(0,0,0,.2)" }}>
                <button style={{
                  background: "none", border: "none", color: "var(--text-3)",
                  fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: ".05em"
                }}>View all activity</button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
