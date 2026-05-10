import { useState, useEffect, useCallback } from "react";
import { db, rtdb } from "../../firebase";
import {
  collection, getDocs, doc, updateDoc, addDoc,
  serverTimestamp, onSnapshot, orderBy, query,
  setDoc, getDoc, deleteDoc
} from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { format } from "date-fns";

const BADGES = ["founder", "early_adopter", "verified", "vip", "moderator", "legend"];

// ─────────────────────────────────────────────────────────────
// Shared UI primitives
// ─────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: "var(--bg-2)", borderRadius: "var(--r-lg)",
      border: "1.5px solid var(--border)", padding: 24, ...style
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-3)", marginBottom: 16 }}>
      {children}
    </div>
  );
}

function StatusBadge({ color, label }) {
  const colors = {
    green:  { bg: "rgba(34,197,94,.12)",  border: "rgba(34,197,94,.3)",  text: "var(--green)" },
    red:    { bg: "rgba(239,68,68,.12)",   border: "rgba(239,68,68,.3)",  text: "var(--red)" },
    amber:  { bg: "rgba(245,158,11,.12)",  border: "rgba(245,158,11,.3)", text: "var(--amber)" },
    cyan:   { bg: "rgba(6,182,212,.12)",   border: "rgba(6,182,212,.3)",  text: "var(--cyan)" },
  };
  const c = colors[color] || colors.green;
  return (
    <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: c.bg, border: `1px solid ${c.border}`, color: c.text, textTransform: "uppercase" }}>
      {label}
    </span>
  );
}

function Toggle({ active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 40, height: 22, borderRadius: 20, flexShrink: 0,
      background: active ? "var(--accent-2)" : "var(--bg-3)",
      border: "none", position: "relative", cursor: "pointer",
      transition: "all .25s", boxShadow: active ? "0 0 12px var(--glow-purple)" : "none"
    }}>
      <div style={{
        width: 14, height: 14, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 4, left: active ? 22 : 4, transition: "all .25s"
      }} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────
export default function SuperOwnerDashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers]         = useState([]);
  const [stats, setStats]         = useState({ totalUsers: 0, totalPosts: 0, activeDMs: 0 });
  const [loading, setLoading]     = useState(true);
  const [permError, setPermError] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChat, setSelectedChat]     = useState(null);
  const [chatMessages, setChatMessages]     = useState([]);
  const [searchTerm, setSearchTerm]         = useState("");

  // Broadcast state
  const [broadcastMsg, setBroadcastMsg]     = useState("");
  const [broadcastType, setBroadcastType]   = useState("info");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState([]);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Core Config state
  const [config, setConfig] = useState({
    registrationEnabled: true,
    maintenanceMode: false,
    dmEnabled: true,
    postsEnabled: true,
    storiesEnabled: true,
    coinsEnabled: true,
    badgesEnabled: true,
    maxPostLength: 500,
    maxBioLength: 160,
    minUsernameLength: 3,
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved]   = useState(false);

  // ── Initial data fetch ──────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [uSnap, pSnap, dSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "posts")).catch(() => ({ size: 0, docs: [] })),
          getDocs(collection(db, "dms")).catch(() => ({ size: 0, docs: [] })),
        ]);
        setStats({ totalUsers: uSnap.size, totalPosts: pSnap.size, activeDMs: dSnap.size });
        setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setChatRooms(dSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Load config from Firestore
        const cfgSnap = await getDoc(doc(db, "owner", "config")).catch(() => null);
        if (cfgSnap && cfgSnap.exists()) setConfig(prev => ({ ...prev, ...cfgSnap.data() }));

        setPermError(false);
      } catch (e) {
        console.error("Owner fetch error:", e);
        setPermError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Audit logs real-time listener ──────────────────────────
  useEffect(() => {
    if (activeTab !== "logs") return;
    setLogsLoading(true);
    const q = query(collection(db, "owner_logs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLogsLoading(false);
    }, () => setLogsLoading(false));
    return unsub;
  }, [activeTab]);

  // ── Broadcast history listener ──────────────────────────────
  useEffect(() => {
    if (activeTab !== "broadcast") return;
    const q = query(collection(db, "broadcasts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setBroadcastHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, [activeTab]);

  // ── Chat monitoring ─────────────────────────────────────────
  useEffect(() => {
    if (!selectedChat) return;
    const msgsRef = ref(rtdb, `dms/${selectedChat.id}/messages`);
    const unsub = onValue(msgsRef, snap => {
      if (snap.exists()) {
        const msgs = Object.entries(snap.val()).map(([id, data]) => ({ id, ...data }));
        setChatMessages(msgs.sort((a, b) => a.createdAt - b.createdAt));
      } else setChatMessages([]);
    }, () => setChatMessages([]));
    return () => off(msgsRef);
  }, [selectedChat]);

  // ── Shared log writer ───────────────────────────────────────
  const writeLog = useCallback(async (action, details = "") => {
    try {
      await addDoc(collection(db, "owner_logs"), {
        action, details, createdAt: serverTimestamp(),
        performedBy: "STELLEN10"
      });
    } catch (e) { console.warn("Log write failed:", e); }
  }, []);

  // ── User actions ────────────────────────────────────────────
  const toggleBan = async (u) => {
    try {
      await updateDoc(doc(db, "users", u.id), { isBanned: !u.isBanned });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isBanned: !u.isBanned } : x));
      await writeLog(u.isBanned ? "UNBAN_USER" : "BAN_USER", `@${u.username}`);
    } catch { alert("Permission denied — update Firebase rules first."); }
  };

  const toggleVerify = async (u) => {
    try {
      await updateDoc(doc(db, "users", u.id), { isVerified: !u.isVerified });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isVerified: !u.isVerified } : x));
      await writeLog(u.isVerified ? "UNVERIFY_USER" : "VERIFY_USER", `@${u.username}`);
    } catch { alert("Permission denied — update Firebase rules first."); }
  };

  const addCoins = async (u, amount) => {
    try {
      const newBal = (u.coins || 0) + amount;
      await updateDoc(doc(db, "users", u.id), { coins: newBal });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, coins: newBal } : x));
      await writeLog("GIVE_COINS", `+${amount} coins to @${u.username}`);
    } catch { alert("Permission denied — update Firebase rules first."); }
  };

  const awardBadge = async (u, badge) => {
    try {
      const current = u.badges || [];
      if (current.includes(badge)) return;
      const updated = [...current, badge];
      await updateDoc(doc(db, "users", u.id), { badges: updated });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, badges: updated } : x));
      await writeLog("AWARD_BADGE", `Badge "${badge}" → @${u.username}`);
    } catch { alert("Permission denied — update Firebase rules first."); }
  };

  // ── Broadcast sender ────────────────────────────────────────
  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setBroadcastSending(true);
    try {
      // Write to broadcasts collection (history)
      await addDoc(collection(db, "broadcasts"), {
        message: broadcastMsg,
        type: broadcastType,
        sentBy: "STELLEN10",
        createdAt: serverTimestamp(),
      });

      // Send a notification to every user
      const uSnap = await getDocs(collection(db, "users"));
      const batch = uSnap.docs.map(d =>
        addDoc(collection(db, "notifications"), {
          type: "broadcast",
          fromUid: "owner",
          fromUsername: "Nexus Team",
          toUid: d.id,
          message: broadcastMsg,
          broadcastType,
          read: false,
          createdAt: serverTimestamp(),
        }).catch(() => {})
      );
      await Promise.all(batch);
      await writeLog("BROADCAST", `"${broadcastMsg.slice(0, 60)}..." → ${uSnap.size} users`);
      setBroadcastMsg("");
    } catch (e) {
      alert("Broadcast failed — check Firebase rules.");
    } finally {
      setBroadcastSending(false);
    }
  };

  // ── Config saver ────────────────────────────────────────────
  const saveConfig = async () => {
    setConfigSaving(true);
    try {
      await setDoc(doc(db, "owner", "config"), { ...config, updatedAt: serverTimestamp() });
      await writeLog("UPDATE_CONFIG", JSON.stringify(config).slice(0, 100));
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
    } catch { alert("Config save failed — check Firebase rules."); }
    setConfigSaving(false);
  };

  // ── Permission error banner ─────────────────────────────────
  const PermBanner = () => permError ? (
    <div style={{ margin: "0 0 20px", padding: 14, background: "rgba(239,68,68,.1)", border: "1.5px solid rgba(239,68,68,.3)", borderRadius: "var(--r-lg)", fontSize: 13 }}>
      <b style={{ color: "var(--red)" }}>⚠️ Firebase Permission Error</b><br />
      <span style={{ color: "var(--text-2)" }}>Update your Firestore rules in the Firebase Console to grant owner access.</span>
    </div>
  ) : null;

  const filteredUsers = users.filter(u =>
    !searchTerm ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────
  // TAB: Overview
  // ─────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div style={{ padding: 20 }}>
      <PermBanner />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Users", val: stats.totalUsers, icon: "👥", color: "var(--accent)" },
          { label: "Total Posts", val: stats.totalPosts, icon: "📝", color: "var(--cyan)" },
          { label: "Active Chats", val: stats.activeDMs, icon: "💬", color: "var(--green)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-2)", padding: 20, borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", boxShadow: `0 10px 30px -10px ${s.color}` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>{s.val}</div>
          </div>
        ))}
      </div>
      <Card>
        <SectionTitle>Platform Status</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Registration", ok: config.registrationEnabled },
            { label: "Direct Messages", ok: config.dmEnabled },
            { label: "Posts", ok: config.postsEnabled },
            { label: "Maintenance Mode", ok: !config.maintenanceMode },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-3)", borderRadius: "var(--r-md)" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</span>
              <StatusBadge color={s.ok ? "green" : "red"} label={s.ok ? "ON" : "OFF"} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // TAB: User Management
  // ─────────────────────────────────────────────────────────
  const renderUserManagement = () => (
    <div style={{ padding: 20 }}>
      <PermBanner />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800 }}>User Directory ({filteredUsers.length})</h3>
        <input
          placeholder="🔍 Search users..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "8px 14px", color: "var(--text)", width: 200 }}
        />
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "rgba(255,255,255,.04)", borderBottom: "1px solid var(--border)" }}>
            <tr>
              {["User", "Status", "Coins", "Badges", "Actions"].map(h => (
                <th key={h} style={{ textAlign: h === "Actions" ? "right" : "left", padding: "10px 14px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-3)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg-3)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "var(--accent-2)" }}>
                      {u.avatar ? <img src={u.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : (u.displayName || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{u.displayName}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)" }}>@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <StatusBadge color={u.isBanned ? "red" : "green"} label={u.isBanned ? "Banned" : "Active"} />
                  {u.isVerified && <span style={{ marginLeft: 6 }}>✅</span>}
                </td>
                <td style={{ padding: "10px 14px" }}>🪙 {u.coins || 0}</td>
                <td style={{ padding: "10px 14px" }}>
                  <select
                    onChange={e => { if (e.target.value) { awardBadge(u, e.target.value); e.target.value = ""; } }}
                    style={{ background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-2)", padding: "4px 8px", fontSize: 11, cursor: "pointer", marginBottom: 4 }}
                  >
                    <option value="">+ Award Badge</option>
                    {BADGES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <div style={{ fontSize: 10, color: "var(--text-3)" }}>{(u.badges || []).join(", ") || "—"}</div>
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                  <button onClick={() => toggleVerify(u)} style={{ marginRight: 6, background: "none", border: "none", color: "var(--cyan)", cursor: "pointer", fontSize: 16 }} title="Toggle Verify">💎</button>
                  <button onClick={() => addCoins(u, 100)} style={{ marginRight: 6, background: "none", border: "none", color: "var(--amber)", cursor: "pointer", fontSize: 16 }} title="Give 100 Coins">🪙</button>
                  <button onClick={() => toggleBan(u)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }} title={u.isBanned ? "Unban" : "Ban"}>
                    {u.isBanned ? "🔓" : "🚫"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // TAB: Chat Monitor
  // ─────────────────────────────────────────────────────────
  const renderChatMonitoring = () => (
    <div style={{ display: "flex", height: "100%", minHeight: 460 }}>
      <div style={{ width: 260, borderRight: "1px solid var(--border)", overflowY: "auto", padding: 10, flexShrink: 0 }}>
        <div style={{ padding: "6px 10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--text-3)", fontWeight: 700, letterSpacing: ".05em" }}>
          Conversations ({chatRooms.length})
        </div>
        {chatRooms.length === 0 && <div style={{ fontSize: 12, color: "var(--text-3)", padding: 10 }}>No chats found.</div>}
        {chatRooms.map(room => (
          <div key={room.id} onClick={() => setSelectedChat(room)} style={{ padding: "10px 12px", borderRadius: "var(--r-md)", cursor: "pointer", background: selectedChat?.id === room.id ? "var(--accent-bg)" : "transparent", border: `1px solid ${selectedChat?.id === room.id ? "var(--accent-bd)" : "transparent"}`, marginBottom: 4, transition: "all .15s" }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
              {room.memberNames ? Object.values(room.memberNames).join(" & ") : room.id}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {room.lastMessage?.content?.slice(0, 30) || "No messages yet"}
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {selectedChat ? (
          <>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 8px var(--green)" }} />
              <span style={{ fontWeight: 800, fontSize: 13 }}>Live Monitor: {selectedChat.memberNames ? Object.values(selectedChat.memberNames).join(" & ") : selectedChat.id}</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              {chatMessages.length === 0
                ? <div style={{ textAlign: "center", color: "var(--text-3)", marginTop: 40 }}>No messages yet.</div>
                : chatMessages.map(m => (
                  <div key={m.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "var(--accent-2)", flexShrink: 0 }}>
                      {(m.senderName || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 3 }}>
                        <b style={{ color: "var(--text-2)" }}>{m.senderName}</b> · {m.createdAt ? format(m.createdAt, "HH:mm") : ""}
                      </div>
                      <div style={{ background: "var(--bg-3)", padding: "8px 12px", borderRadius: "var(--r-md)", fontSize: 13, maxWidth: 400 }}>
                        {m.type === "sticker" ? "🎭 Sticker" : m.content}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-3)", gap: 12 }}>
            <div style={{ fontSize: 40 }}>👁️</div>
            <div style={{ fontWeight: 700 }}>Select a conversation to monitor</div>
            <div style={{ fontSize: 12 }}>Messages appear in real-time</div>
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // TAB: Broadcast
  // ─────────────────────────────────────────────────────────
  const BROADCAST_TYPES = [
    { id: "info",    label: "📣 Announcement", color: "var(--cyan)" },
    { id: "warning", label: "⚠️ Warning",       color: "var(--amber)" },
    { id: "update",  label: "🚀 Update",         color: "var(--accent-2)" },
    { id: "alert",   label: "🚨 Alert",           color: "var(--red)" },
  ];

  const renderBroadcast = () => (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
      <PermBanner />
      <Card>
        <SectionTitle>Compose Broadcast</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
          {BROADCAST_TYPES.map(t => (
            <button key={t.id} onClick={() => setBroadcastType(t.id)} style={{
              padding: "10px 6px", borderRadius: "var(--r-md)", border: `1.5px solid ${broadcastType === t.id ? t.color : "var(--border)"}`,
              background: broadcastType === t.id ? `${t.color}18` : "var(--bg-3)",
              color: broadcastType === t.id ? t.color : "var(--text-3)",
              cursor: "pointer", fontWeight: 700, fontSize: 12, transition: "all .15s"
            }}>
              {t.label}
            </button>
          ))}
        </div>
        <textarea
          value={broadcastMsg}
          onChange={e => setBroadcastMsg(e.target.value)}
          placeholder="Write your message to all users..."
          rows={5}
          style={{ width: "100%", background: "var(--bg-3)", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", padding: 14, color: "var(--text)", fontSize: 13, resize: "vertical", marginBottom: 14, fontFamily: "var(--font)" }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>Will be sent to all {stats.totalUsers} users as a notification.</span>
          <button
            className="btn-primary"
            disabled={!broadcastMsg.trim() || broadcastSending}
            onClick={sendBroadcast}
            style={{ minWidth: 160, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
          >
            {broadcastSending ? <><div className="spinner-sm" /> Sending...</> : "📢 Send Broadcast"}
          </button>
        </div>
      </Card>

      <Card>
        <SectionTitle>Broadcast History</SectionTitle>
        {broadcastHistory.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>No broadcasts sent yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {broadcastHistory.map(b => {
              const t = BROADCAST_TYPES.find(x => x.id === b.type) || BROADCAST_TYPES[0];
              return (
                <div key={b.id} style={{ display: "flex", gap: 14, padding: "12px 16px", background: "var(--bg-3)", borderRadius: "var(--r-md)", borderLeft: `3px solid ${t.color}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{b.message}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                      {t.label} · by {b.sentBy} · {b.createdAt?.toDate ? format(b.createdAt.toDate(), "MMM d, HH:mm") : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // TAB: Audit Logs
  // ─────────────────────────────────────────────────────────
  const LOG_ICONS = {
    BAN_USER: "🚫", UNBAN_USER: "🔓", VERIFY_USER: "✅", UNVERIFY_USER: "❌",
    GIVE_COINS: "🪙", AWARD_BADGE: "🏅", BROADCAST: "📢", UPDATE_CONFIG: "⚙️",
  };

  const renderLogs = () => (
    <div style={{ padding: 20 }}>
      <PermBanner />
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <SectionTitle>Audit Log ({auditLogs.length} entries)</SectionTitle>
          <StatusBadge color="green" label="Live" />
        </div>
        {logsLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : auditLogs.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic", textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📜</div>
            No actions recorded yet. Start managing users to see logs here.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {auditLogs.map((log, i) => (
              <div key={log.id} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < auditLogs.length - 1 ? "1px solid var(--border)" : "none", alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--bg-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {LOG_ICONS[log.action] || "⚡"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{log.action?.replace(/_/g, " ")}</span>
                    <StatusBadge color="cyan" label={log.performedBy || "owner"} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{log.details}</div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)", flexShrink: 0 }}>
                  {log.createdAt?.toDate ? format(log.createdAt.toDate(), "MMM d, HH:mm:ss") : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // TAB: Core Config
  // ─────────────────────────────────────────────────────────
  const renderConfig = () => {
    const toggleConfig = (key) => setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    const setConfigNum = (key, val) => setConfig(prev => ({ ...prev, [key]: Number(val) }));

    const TOGGLES = [
      { key: "registrationEnabled", label: "User Registration",    desc: "Allow new users to sign up",           icon: "👤" },
      { key: "dmEnabled",           label: "Direct Messages",      desc: "Allow users to send DMs",              icon: "💬" },
      { key: "postsEnabled",        label: "Posts & Feed",         desc: "Allow users to create posts",          icon: "📝" },
      { key: "storiesEnabled",      label: "Stories",              desc: "Allow 24-hour stories",                icon: "📸" },
      { key: "coinsEnabled",        label: "Coins System",         desc: "Allow tipping with coins",             icon: "🪙" },
      { key: "badgesEnabled",       label: "Badges System",        desc: "Show badges on profiles",              icon: "🏅" },
      { key: "maintenanceMode",     label: "Maintenance Mode",     desc: "Show maintenance page to all users",   icon: "🔧", danger: true },
    ];

    const LIMITS = [
      { key: "maxPostLength",      label: "Max Post Length",      unit: "chars", min: 100, max: 5000 },
      { key: "maxBioLength",       label: "Max Bio Length",       unit: "chars", min: 50,  max: 500  },
      { key: "minUsernameLength",  label: "Min Username Length",  unit: "chars", min: 2,   max: 10   },
    ];

    return (
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
        <PermBanner />
        <Card>
          <SectionTitle>Platform Feature Toggles</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {TOGGLES.map(t => (
              <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "var(--bg-3)", borderRadius: "var(--r-md)", border: `1px solid ${t.danger && config[t.key] ? "rgba(239,68,68,.3)" : "transparent"}` }}>
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.danger && config[t.key] ? "var(--red)" : "var(--text)" }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>{t.desc}</div>
                </div>
                <Toggle active={config[t.key]} onClick={() => toggleConfig(t.key)} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Platform Limits</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {LIMITS.map(l => (
              <div key={l.key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{l.label}</span>
                  <span style={{ fontSize: 13, fontFamily: "var(--mono)", color: "var(--accent-2)" }}>{config[l.key]} {l.unit}</span>
                </div>
                <input
                  type="range" min={l.min} max={l.max} value={config[l.key]}
                  onChange={e => setConfigNum(l.key, e.target.value)}
                  style={{ width: "100%", accentColor: "var(--accent-2)" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
                  <span>{l.min}</span><span>{l.max}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <button
          className="btn-primary"
          onClick={saveConfig}
          disabled={configSaving}
          style={{ width: "100%", padding: 16, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
        >
          {configSaving ? <><div className="spinner-sm" /> Saving...</>
           : configSaved  ? "✅ Config Saved!"
           : "⚙️ Save Configuration"}
        </button>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────
  // Root render
  // ─────────────────────────────────────────────────────────
  const TABS = [
    { id: "overview",   label: "Overview",      icon: "📊" },
    { id: "users",      label: "User Control",  icon: "👤" },
    { id: "chats",      label: "Chat Monitor",  icon: "👁️" },
    { id: "broadcast",  label: "Broadcast",     icon: "📢" },
    { id: "logs",       label: "Audit Logs",    icon: "📜" },
    { id: "config",     label: "Core Config",   icon: "⚙️" },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", backdropFilter: "blur(12px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{ width: "100%", maxWidth: 1080, height: "90vh", background: "var(--bg-1)", border: "2px solid var(--accent)", borderRadius: "var(--r-xl)", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 0 120px rgba(124,58,237,.4), 0 40px 80px rgba(0,0,0,.8)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "18px 24px", background: "linear-gradient(90deg, rgba(124,58,237,.15), transparent)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: "var(--accent-bg)", border: "1.5px solid var(--accent-bd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 20px var(--glow-purple)" }}>⚡</div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-.03em", background: "linear-gradient(135deg, var(--accent-2), var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SUPER OWNER DASHBOARD</h2>
              <div style={{ fontSize: 10, color: "var(--accent-2)", fontWeight: 800, letterSpacing: ".1em" }}>AUTHORIZED ACCESS ONLY • NEXUS v2.5.0</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Sidebar */}
          <aside style={{ width: 210, background: "var(--bg)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: 10, flexShrink: 0 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                  background: activeTab === tab.id ? "var(--accent-bg)" : "transparent",
                  border: `1px solid ${activeTab === tab.id ? "var(--accent-bd)" : "transparent"}`,
                  borderRadius: "var(--r-md)", color: activeTab === tab.id ? "var(--accent-2)" : "var(--text-2)",
                  cursor: "pointer", textAlign: "left", marginBottom: 4, fontWeight: 700, fontSize: 13,
                  transition: "all .15s", boxShadow: activeTab === tab.id ? "0 0 12px var(--glow-purple)" : "none"
                }}
              >
                <span style={{ fontSize: 16 }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ padding: "10px 12px", background: "rgba(34,197,94,.08)", borderRadius: "var(--r-md)", border: "1px solid rgba(34,197,94,.2)" }}>
              <div style={{ fontSize: 10, color: "var(--green)", fontWeight: 800, marginBottom: 2 }}>SYSTEM STATUS</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>● ONLINE</div>
            </div>
          </aside>

          {/* Main */}
          <main style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="spinner" />
              </div>
            ) : (
              <>
                {activeTab === "overview"  && renderOverview()}
                {activeTab === "users"     && renderUserManagement()}
                {activeTab === "chats"     && renderChatMonitoring()}
                {activeTab === "broadcast" && renderBroadcast()}
                {activeTab === "logs"      && renderLogs()}
                {activeTab === "config"    && renderConfig()}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
