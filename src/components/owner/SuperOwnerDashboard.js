import { useState, useEffect, useCallback } from "react";
import { db, rtdb } from "../../firebase";
import {
  collection, getDocs, doc, updateDoc
} from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { format } from "date-fns";

// ── The owner's Firebase UID must match your account ──────────
// This is used to verify you are the owner before fetching admin data.
// If you see permission errors, update this to your exact Firebase UID.
const OWNER_UID = "STELLEN10_UID_PLACEHOLDER";

export default function SuperOwnerDashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, activeDMs: 0 });
  const [loading, setLoading] = useState(true);
  const [permError, setPermError] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [actionLog, setActionLog] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastSent, setBroadcastSent] = useState(false);

  const logAction = useCallback((msg) => {
    setActionLog(prev => [{ msg, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
  }, []);

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

  // Real-time chat monitoring
  useEffect(() => {
    if (!selectedChat) return;
    const msgsRef = ref(rtdb, `dms/${selectedChat.id}/messages`);
    const unsub = onValue(msgsRef, snap => {
      if (snap.exists()) {
        const msgs = Object.entries(snap.val()).map(([id, data]) => ({ id, ...data }));
        setChatMessages(msgs.sort((a, b) => a.createdAt - b.createdAt));
      } else {
        setChatMessages([]);
      }
    }, (err) => {
      console.error("RTDB monitor error:", err);
      setChatMessages([]);
    });
    return () => off(msgsRef);
  }, [selectedChat]);

  const toggleBan = async (user) => {
    try {
      await updateDoc(doc(db, "users", user.id), { isBanned: !user.isBanned });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBanned: !user.isBanned } : u));
      logAction(`${user.isBanned ? "Unbanned" : "Banned"} user @${user.username}`);
    } catch (e) { alert("Permission denied. Update Firebase rules first."); }
  };

  const toggleVerify = async (user) => {
    try {
      await updateDoc(doc(db, "users", user.id), { isVerified: !user.isVerified });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isVerified: !user.isVerified } : u));
      logAction(`${user.isVerified ? "Unverified" : "Verified"} user @${user.username}`);
    } catch (e) { alert("Permission denied. Update Firebase rules first."); }
  };

  const addCoins = async (user, amount) => {
    try {
      const newBalance = (user.coins || 0) + amount;
      await updateDoc(doc(db, "users", user.id), { coins: newBalance });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, coins: newBalance } : u));
      logAction(`Gave ${amount} coins to @${user.username}`);
    } catch (e) { alert("Permission denied. Update Firebase rules first."); }
  };

  const awardBadge = async (user, badge) => {
    try {
      const current = user.badges || [];
      if (current.includes(badge)) return;
      await updateDoc(doc(db, "users", user.id), { badges: [...current, badge] });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, badges: [...(u.badges || []), badge] } : u));
      logAction(`Awarded badge "${badge}" to @${user.username}`);
    } catch (e) { alert("Permission denied. Update Firebase rules first."); }
  };

  const filteredUsers = users.filter(u =>
    !searchTerm ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Render: Permission Error Banner ───────────────────────────
  const PermBanner = () => permError ? (
    <div style={{ margin: 20, padding: 16, background: "rgba(239,68,68,.12)", border: "1.5px solid rgba(239,68,68,.3)", borderRadius: "var(--r-lg)" }}>
      <div style={{ fontWeight: 800, color: "var(--red)", marginBottom: 6 }}>⚠️ Firebase Permission Error</div>
      <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7 }}>
        Your Firebase Security Rules are blocking admin reads. You must update them in the Firebase Console.<br/>
        Go to: <b>Firebase Console → Firestore Database → Rules</b> and paste the rules from the <b>FIREBASE_RULES.md</b> file in your repo.
      </div>
    </div>
  ) : null;

  // ── Render: Overview ──────────────────────────────────────────
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
      <div style={{ background: "var(--bg-2)", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", padding: 20 }}>
        <h4 style={{ marginBottom: 16, fontSize: 13, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-3)" }}>Audit Log</h4>
        {actionLog.length === 0
          ? <div style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>No actions recorded yet.</div>
          : actionLog.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
              <span style={{ color: "var(--text-3)", fontFamily: "var(--mono)", fontSize: 11 }}>{a.time}</span>
              <span>{a.msg}</span>
            </div>
          ))
        }
      </div>
    </div>
  );

  // ── Render: User Management ───────────────────────────────────
  const BADGES = ["founder", "early_adopter", "verified", "vip", "moderator", "legend"];

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
      <div style={{ background: "var(--bg-2)", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", overflow: "hidden" }}>
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
                      {u.avatar ? <img src={u.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : (u.displayName||"?").slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{u.displayName}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)" }}>@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ color: u.isBanned ? "var(--red)" : "var(--green)", fontWeight: 700, fontSize: 11 }}>
                    {u.isBanned ? "BANNED" : "ACTIVE"}
                  </span>
                  {u.isVerified && <span style={{ marginLeft: 6 }}>✅</span>}
                </td>
                <td style={{ padding: "10px 14px" }}>🪙 {u.coins || 0}</td>
                <td style={{ padding: "10px 14px" }}>
                  <select
                    onChange={e => { if (e.target.value) { awardBadge(u, e.target.value); e.target.value = ""; } }}
                    style={{ background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-2)", padding: "4px 8px", fontSize: 11, cursor: "pointer" }}
                  >
                    <option value="">+ Badge</option>
                    {BADGES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>{(u.badges || []).join(", ") || "—"}</div>
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
      </div>
    </div>
  );

  // ── Render: Chat Monitoring ───────────────────────────────────
  const renderChatMonitoring = () => (
    <div style={{ display: "flex", height: "100%", minHeight: 460 }}>
      <div style={{ width: 260, borderRight: "1px solid var(--border)", overflowY: "auto", padding: 10, flexShrink: 0 }}>
        <div style={{ padding: "6px 10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--text-3)", fontWeight: 700, letterSpacing: ".05em" }}>
          Conversations ({chatRooms.length})
        </div>
        {chatRooms.length === 0 && <div style={{ fontSize: 12, color: "var(--text-3)", padding: 10 }}>No chats found or permission denied.</div>}
        {chatRooms.map(room => (
          <div
            key={room.id}
            onClick={() => setSelectedChat(room)}
            style={{
              padding: "10px 12px", borderRadius: "var(--r-md)", cursor: "pointer",
              background: selectedChat?.id === room.id ? "var(--accent-bg)" : "transparent",
              border: `1px solid ${selectedChat?.id === room.id ? "var(--accent-bd)" : "transparent"}`,
              marginBottom: 4, transition: "all .15s"
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
              {(room.memberNames ? Object.values(room.memberNames).join(" & ") : room.id)}
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
                ? <div style={{ textAlign: "center", color: "var(--text-3)", marginTop: 40 }}>No messages in this conversation yet.</div>
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
            <div style={{ fontSize: 12 }}>All messages are shown in real-time</div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Render: Broadcast ─────────────────────────────────────────
  const renderBroadcast = () => (
    <div style={{ padding: 20 }}>
      <PermBanner />
      <div style={{ background: "var(--bg-2)", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", padding: 24 }}>
        <h3 style={{ marginBottom: 6 }}>📢 System Broadcast</h3>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20 }}>Send a notification to all users on the platform.</p>
        <textarea
          value={broadcastMsg}
          onChange={e => setBroadcastMsg(e.target.value)}
          placeholder="Type your message here..."
          rows={5}
          style={{ width: "100%", background: "var(--bg-3)", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", padding: 14, color: "var(--text)", fontSize: 13, resize: "vertical", marginBottom: 14 }}
        />
        <button
          className="btn-primary"
          disabled={!broadcastMsg.trim()}
          onClick={() => { logAction(`Broadcast sent: "${broadcastMsg.slice(0,40)}..."`); setBroadcastMsg(""); setBroadcastSent(true); setTimeout(() => setBroadcastSent(false), 3000); }}
          style={{ width: "100%" }}
        >
          {broadcastSent ? "✅ Broadcast Sent!" : "Send to All Users"}
        </button>
      </div>
    </div>
  );

  // ── Render: Rules Guide ───────────────────────────────────────
  const renderSettings = () => (
    <div style={{ padding: 20 }}>
      <div style={{ background: "var(--bg-2)", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", padding: 24 }}>
        <h3 style={{ marginBottom: 6 }}>⚙️ Fix Firebase Permissions</h3>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>
          To fix the "Missing or insufficient permissions" error, go to your Firebase Console and update your Firestore Security Rules.
        </p>
        <div style={{ background: "var(--bg)", borderRadius: "var(--r-md)", padding: 16, fontFamily: "var(--mono)", fontSize: 11, color: "var(--cyan)", lineHeight: 2, overflowX: "auto", border: "1px solid var(--border)" }}>
          <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── OWNER: full access ──────────────────
    match /{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.email == "YOUR_EMAIL@gmail.com";
    }

    // ── Users: read public, write own ───────
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }

    // ── Posts: read all, write own ──────────
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.authorId;
    }

    // ── DMs: members only ───────────────────
    match /dms/{dmId} {
      allow read, write: if request.auth.uid in resource.data.members
        || request.auth.token.email == "YOUR_EMAIL@gmail.com";
    }

    // ── Notifications: own only ─────────────
    match /notifications/{id} {
      allow read, write: if request.auth.uid == resource.data.toUid
        || request.auth.token.email == "YOUR_EMAIL@gmail.com";
    }

    // ── Follows, Usernames ──────────────────
    match /follows/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /usernames/{name} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}`}</pre>
        </div>
        <p style={{ fontSize: 12, color: "var(--amber)", marginTop: 14 }}>
          ⚠️ Replace <b>YOUR_EMAIL@gmail.com</b> with your actual Nexus account email before saving.
        </p>
      </div>
    </div>
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", backdropFilter: "blur(12px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{ width: "100%", maxWidth: 1060, height: "88vh", background: "var(--bg-1)", border: "2px solid var(--accent)", borderRadius: "var(--r-xl)", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 0 120px rgba(124,58,237,.4), 0 40px 80px rgba(0,0,0,.8)" }}
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
            {[
              { id: "overview",   label: "Overview",      icon: "📊" },
              { id: "users",      label: "User Control",  icon: "👤" },
              { id: "chats",      label: "Chat Monitor",  icon: "👁️" },
              { id: "broadcast",  label: "Broadcast",     icon: "📢" },
              { id: "settings",   label: "Fix Permissions", icon: "🔧" },
            ].map(tab => (
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

          {/* Main content */}
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
                {activeTab === "settings"  && renderSettings()}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
