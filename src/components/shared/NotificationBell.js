// src/components/shared/NotificationBell.js — redesigned
import { useState } from "react";
import { createPortal } from "react-dom";
import { useNotifications } from "../../hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { BADGES } from "../../hooks/useBadgeSystem";

const NOTIF_CONFIG = {
  follow:        { icon: "👤", color: "#a855f7", label: "New follower" },
  like:          { icon: "❤️", color: "#f43f5e", label: "Liked your post" },
  comment:       { icon: "💬", color: "#06b6d4", label: "Comment" },
  wall_post:     { icon: "📝", color: "#22c55e", label: "Wall post" },
  mention:       { icon: "📣", color: "#f97316", label: "Mention" },
  dm_request:    { icon: "✉️", color: "#8b5cf6", label: "Message request" },
  tip:           { icon: "🪙", color: "#f59e0b", label: "Tip received" },
  badge_awarded: { icon: "🏅", color: "#f59e0b", label: "Badge awarded" },
};

function timeAgo(ts) {
  try { return formatDistanceToNow(ts?.toDate ? ts.toDate() : new Date(ts), { addSuffix: true }); }
  catch { return "just now"; }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const navigate = useNavigate();

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open && unreadCount > 0) markAllRead();
  };

  const handleClick = (n) => {
    markRead(n.id);
    setOpen(false);
    if (n.type === "follow") navigate(`/u/${n.fromUsername}`);
    if (n.type === "tip" || n.type === "badge_awarded") navigate(`/u/${n.fromUsername || ""}`);
  };

  const filtered = filter === "all" ? notifications
    : notifications.filter(n => n.type === filter);

  const filters = [
    { key:"all", label:"All" },
    { key:"follow", label:"Follows" },
    { key:"badge_awarded", label:"Badges" },
    { key:"tip", label:"Tips" },
  ];

  return (
    <>
      <button className="rail-btn" onClick={handleOpen} title="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unreadCount > 0 && (
          <span className="rail-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && createPortal(
        <div onClick={() => setOpen(false)} style={{
          position:"fixed",inset:0,zIndex:200,
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            position:"fixed",top:60,left:68,
            width:380,maxHeight:"80vh",
            background:"var(--bg-1)",
            border:"1.5px solid var(--border-2)",
            borderRadius:20,overflow:"hidden",
            boxShadow:"0 0 40px var(--glow-purple),0 24px 60px rgba(0,0,0,.8)",
            display:"flex",flexDirection:"column",
            animation:"modal-enter .2s cubic-bezier(.16,1,.3,1)",
          }}>
            {/* Header */}
            <div style={{
              padding:"16px 18px 0",flexShrink:0,
              background:"linear-gradient(135deg,rgba(124,58,237,.12),rgba(6,182,212,.06))",
            }}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div>
                  <h3 style={{fontSize:15,fontWeight:800,letterSpacing:"-.02em"}}>Notifications</h3>
                  {unreadCount > 0 && (
                    <span style={{fontSize:11,color:"var(--text-3)"}}>
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <div style={{display:"flex",gap:6}}>
                  {notifications.length > 0 && (
                    <button onClick={markAllRead} style={{
                      background:"var(--accent-bg)",border:"1px solid var(--accent-bd)",
                      borderRadius:20,padding:"4px 10px",color:"var(--accent-2)",
                      fontFamily:"var(--font)",fontSize:11,fontWeight:700,cursor:"pointer",
                    }}>
                      Mark all read
                    </button>
                  )}
                  <button className="icon-btn" onClick={() => setOpen(false)}>✕</button>
                </div>
              </div>

              {/* Filter tabs */}
              <div style={{display:"flex",gap:4,paddingBottom:0}}>
                {filters.map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)} style={{
                    padding:"6px 12px",border:"none",borderRadius:8,cursor:"pointer",
                    background: filter===f.key ? "var(--accent)" : "transparent",
                    color: filter===f.key ? "#fff" : "var(--text-3)",
                    fontFamily:"var(--font)",fontSize:11,fontWeight:700,
                    transition:"all .15s",
                    boxShadow: filter===f.key ? "0 0 8px var(--glow-purple)" : "none",
                  }}>{f.label}</button>
                ))}
              </div>
            </div>

            {/* Border line */}
            <div style={{height:1,background:"var(--border)",flexShrink:0}}/>

            {/* Notifications list */}
            <div style={{overflowY:"auto",flex:1}}>
              {filtered.length === 0 ? (
                <div style={{
                  display:"flex",flexDirection:"column",alignItems:"center",
                  justifyContent:"center",padding:"48px 20px",gap:10,
                  color:"var(--text-3)",
                }}>
                  <span style={{fontSize:32}}>🔔</span>
                  <p style={{fontSize:13,fontWeight:600}}>Nothing here yet</p>
                </div>
              ) : (
                filtered.slice(0, 40).map(n => {
                  const cfg = NOTIF_CONFIG[n.type] || { icon:"🔔", color:"var(--text-2)", label:"" };
                  const badge = n.type === "badge_awarded" ? BADGES[n.badgeId] : null;

                  return (
                    <div key={n.id} onClick={() => handleClick(n)} style={{
                      display:"flex",alignItems:"flex-start",gap:12,
                      padding:"14px 18px",cursor:"pointer",
                      background: !n.read ? "rgba(124,58,237,.05)" : "transparent",
                      borderBottom:"1px solid var(--border)",
                      transition:"background .1s",
                      position:"relative",
                    }}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--bg-hover)"}
                      onMouseLeave={e=>e.currentTarget.style.background=!n.read?"rgba(124,58,237,.05)":"transparent"}
                    >
                      {/* Icon */}
                      <div style={{
                        width:40,height:40,borderRadius:"50%",flexShrink:0,
                        background:`${cfg.color}20`,border:`1.5px solid ${cfg.color}44`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize: badge ? 18 : 16,
                        boxShadow: !n.read ? `0 0 10px ${cfg.color}44` : "none",
                      }}>
                        {badge ? badge.icon : cfg.icon}
                      </div>

                      {/* Content */}
                      <div style={{flex:1,minWidth:0}}>
                        {n.type === "badge_awarded" && badge ? (
                          <>
                            <div style={{fontSize:13,fontWeight:600,lineHeight:1.5,marginBottom:2}}>
                              <span style={{color:badge.color,fontWeight:800}}>
                                {badge.icon} {badge.label} badge unlocked!
                              </span>
                            </div>
                            <div style={{fontSize:12,color:"var(--text-2)",marginBottom:4}}>
                              +{badge.coinReward} coins added to your wallet 🪙
                            </div>
                            <div style={{
                              display:"inline-flex",gap:6,flexWrap:"wrap",
                            }}>
                              {badge.benefits.slice(0,2).map((b,i) => (
                                <span key={i} style={{
                                  background:`${badge.color}15`,border:`1px solid ${badge.color}33`,
                                  borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:600,
                                  color:badge.color,
                                }}>{b}</span>
                              ))}
                            </div>
                          </>
                        ) : n.type === "tip" ? (
                          <>
                            <div style={{fontSize:13,fontWeight:600,lineHeight:1.5}}>
                              <b>{n.fromUsername}</b> {n.message}
                            </div>
                            <div style={{fontSize:12,color:"#f59e0b",fontWeight:700,marginTop:2}}>
                              🪙 {n.amount || ""} coins received!
                            </div>
                          </>
                        ) : (
                          <div style={{fontSize:13,fontWeight:600,lineHeight:1.5}}>
                            <b>{n.fromUsername}</b> {n.message}
                          </div>
                        )}
                        <div style={{fontSize:10,color:"var(--text-3)",marginTop:4,fontFamily:"var(--mono)"}}>
                          {timeAgo(n.createdAt)}
                        </div>
                      </div>

                      {/* Unread dot */}
                      {!n.read && (
                        <div style={{
                          width:7,height:7,borderRadius:"50%",
                          background:"var(--accent)",flexShrink:0,marginTop:4,
                          boxShadow:"0 0 6px var(--glow-purple)",
                        }}/>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
