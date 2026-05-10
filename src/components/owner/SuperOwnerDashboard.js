import { useState, useEffect } from "react";
import { db, rtdb } from "../../firebase";
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy, limit, onSnapshot, where, serverTimestamp } from "firebase/firestore";
import { ref, onValue, set, remove, off } from "firebase/database";
import { format } from "date-fns";

export default function SuperOwnerDashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, activeDMs: 0, systemAlerts: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    // Fetch basic stats
    const fetchStats = async () => {
      const uSnap = await getDocs(collection(db, "users"));
      const pSnap = await getDocs(collection(db, "posts"));
      const dSnap = await getDocs(collection(db, "dms"));
      setStats({
        totalUsers: uSnap.size,
        totalPosts: pSnap.size,
        activeDMs: dSnap.size,
        systemAlerts: 0
      });
      setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setChatRooms(dSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchStats();
  }, []);

  // Chat Monitoring Logic
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
    });
    return () => off(msgsRef);
  }, [selectedChat]);

  const toggleBan = async (user) => {
    await updateDoc(doc(db, "users", user.id), { isBanned: !user.isBanned });
    setUsers(users.map(u => u.id === user.id ? { ...u, isBanned: !user.isBanned } : u));
  };

  const toggleVerify = async (user) => {
    await updateDoc(doc(db, "users", user.id), { isVerified: !user.isVerified });
    setUsers(users.map(u => u.id === user.id ? { ...u, isVerified: !user.isVerified } : u));
  };

  const addCoins = async (user, amount) => {
    const newBalance = (user.coins || 0) + amount;
    await updateDoc(doc(db, "users", user.id), { coins: newBalance });
    setUsers(users.map(u => u.id === user.id ? { ...u, coins: newBalance } : u));
  };

  const renderOverview = () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, padding: 20 }}>
      {[
        { label: "Total Users", val: stats.totalUsers, icon: "👥", color: "var(--accent)" },
        { label: "Total Posts", val: stats.totalPosts, icon: "📝", color: "var(--cyan)" },
        { label: "Active Chats", val: stats.activeDMs, icon: "💬", color: "var(--green)" },
        { label: "System Health", val: "Optimal", icon: "🛡️", color: "var(--amber)" }
      ].map(s => (
        <div key={s.label} style={{ background: "var(--bg-2)", padding: 20, borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", boxShadow: `0 10px 20px -10px ${s.color}` }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-1)" }}>{s.val}</div>
        </div>
      ))}
      <div style={{ gridColumn: "span 4", background: "var(--bg-2)", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", padding: 20, marginTop: 10 }}>
        <h4 style={{ marginBottom: 16 }}>Owner Activity Log</h4>
        <div style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>No recent administrative actions recorded.</div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h3>User Directory ({users.length})</h3>
        <input placeholder="Search users..." style={{ background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "6px 12px", color: "#fff" }} />
      </div>
      <div style={{ background: "var(--bg-2)", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "rgba(255,255,255,.05)", borderBottom: "1px solid var(--border)" }}>
            <tr>
              <th style={{ textAlign: "left", padding: 12 }}>User</th>
              <th style={{ textAlign: "left", padding: 12 }}>Status</th>
              <th style={{ textAlign: "left", padding: 12 }}>Coins</th>
              <th style={{ textAlign: "right", padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-3)", overflow: "hidden" }}>
                      {u.avatar && <img src={u.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{u.displayName}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)" }}>@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: 12 }}>
                  {u.isBanned ? <span style={{ color: "var(--red)", fontWeight: 700 }}>BANNED</span> : <span style={{ color: "var(--green)" }}>Active</span>}
                  {u.isVerified && <span style={{ marginLeft: 6 }}>✅</span>}
                </td>
                <td style={{ padding: 12 }}>🪙 {u.coins || 0}</td>
                <td style={{ padding: 12, textAlign: "right" }}>
                  <button onClick={() => toggleVerify(u)} style={{ marginRight: 8, background: "none", border: "none", color: "var(--cyan)", cursor: "pointer", fontSize: 18 }} title="Verify">💎</button>
                  <button onClick={() => addCoins(u, 100)} style={{ marginRight: 8, background: "none", border: "none", color: "var(--amber)", cursor: "pointer", fontSize: 18 }} title="Give 100 Coins">🪙</button>
                  <button onClick={() => toggleBan(u)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 18 }} title={u.isBanned ? "Unban" : "Ban"}>{u.isBanned ? "🔓" : "🚫"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderChatMonitoring = () => (
    <div style={{ display: "flex", height: 500 }}>
      <div style={{ width: 240, borderRight: "1px solid var(--border)", overflowY: "auto", padding: 10 }}>
        <h4 style={{ padding: 10, fontSize: 12, textTransform: "uppercase", color: "var(--text-3)" }}>Active Conversations</h4>
        {chatRooms.map(room => (
          <div
            key={room.id}
            onClick={() => setSelectedChat(room)}
            style={{
              padding: 12, borderRadius: "var(--r-md)", cursor: "pointer",
              background: selectedChat?.id === room.id ? "var(--accent-bg)" : "transparent",
              marginBottom: 4
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700 }}>{room.id.split("_").join(" & ")}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>{room.lastMessage?.content?.slice(0, 20)}...</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(0,0,0,.2)" }}>
        {selectedChat ? (
          <>
            <div style={{ padding: 16, borderBottom: "1px solid var(--border)", fontWeight: 800 }}>Monitoring: {selectedChat.id}</div>
            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              {chatMessages.map(m => (
                <div key={m.id} style={{ alignSelf: "flex-start", maxWidth: "80%" }}>
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 2 }}>{m.senderName} • {format(m.createdAt, "HH:mm")}</div>
                  <div style={{ background: "var(--bg-3)", padding: "8px 12px", borderRadius: "var(--r-md)", fontSize: 13 }}>{m.content}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>Select a chat to monitor</div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", backdropFilter: "blur(10px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 1000, height: "85vh", background: "var(--bg-1)", border: "2px solid var(--accent)", borderRadius: "var(--r-xl)", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 0 100px rgba(124,58,237,.3)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", background: "linear-gradient(90deg, var(--bg-2), var(--bg-1))", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>⚡</div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-.03em" }}>SUPER OWNER DASHBOARD</h2>
              <div style={{ fontSize: 11, color: "var(--accent-2)", fontWeight: 800 }}>AUTHORIZED ACCESS ONLY • SYSTEM VERSION 2.5.0</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ fontSize: 20 }}>✕</button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <aside style={{ width: 200, background: "var(--bg)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: 10 }}>
            {[
              { id: "overview", label: "Overview", icon: "📊" },
              { id: "users", label: "User Control", icon: "👤" },
              { id: "chats", label: "Chat Monitor", icon: "👁️" },
              { id: "broadcast", label: "Broadcast", icon: "📢" },
              { id: "logs", label: "Audit Logs", icon: "📜" },
              { id: "settings", label: "Core Config", icon: "⚙️" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                  background: activeTab === tab.id ? "var(--accent-bg)" : "transparent",
                  border: "none", borderRadius: "var(--r-md)", color: activeTab === tab.id ? "var(--accent-2)" : "var(--text-2)",
                  cursor: "pointer", textAlign: "left", marginBottom: 4, fontWeight: 700, fontSize: 13,
                  transition: "all .2s"
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ padding: 10, background: "rgba(239,68,68,.1)", borderRadius: "var(--r-md)", border: "1px solid rgba(239,68,68,.2)" }}>
              <div style={{ fontSize: 10, color: "var(--red)", fontWeight: 800, marginBottom: 4 }}>SECURITY STATUS</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>ENCRYPTED</div>
            </div>
          </aside>

          <main style={{ flex: 1, overflowY: "auto", background: "var(--bg-1)" }}>
            {loading ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                {activeTab === "overview" && renderOverview()}
                {activeTab === "users" && renderUserManagement()}
                {activeTab === "chats" && renderChatMonitoring()}
                {activeTab !== "overview" && activeTab !== "users" && activeTab !== "chats" && (
                  <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)" }}>
                    <div style={{ fontSize: 48, marginBottom: 20 }}>🚧</div>
                    <h3>Module Under Construction</h3>
                    <p>This administrative power is being initialized.</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
