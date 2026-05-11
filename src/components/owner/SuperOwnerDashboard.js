// src/components/owner/SuperOwnerDashboard.js
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit, getDoc, setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { awardBadge, BADGES } from "../../hooks/useBadgeSystem";

// ── Tabs ──────────────────────────────────────────────────────

const sortUsersByDisplayName = users =>
  [...users].sort((a, b) =>
    (a.displayName || a.username || "").localeCompare(
      b.displayName || b.username || "",
      undefined,
      { sensitivity: "base" }
    )
  );

const usersFromSnapshot = snap =>
  sortUsersByDisplayName(snap.docs.map(d => ({ id: d.id, ...d.data() })));

const TABS = [
  { id:"overview",   icon:"📊", label:"Overview"      },
  { id:"users",      icon:"👥", label:"Users"         },
  { id:"badges",     icon:"🏅", label:"Award Badges"  },
  { id:"coins",      icon:"🪙", label:"Coins"         },
  { id:"broadcast",  icon:"📣", label:"Broadcast"     },
  { id:"reports",    icon:"🚨", label:"Reports"       },
];

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, color="#7c3aed", sub }) {
  return (
    <div style={{
      background:"var(--bg-2)",border:`1.5px solid ${color}33`,
      borderRadius:16,padding:"18px 20px",
      boxShadow:`0 0 20px ${color}22`,
    }}>
      <div style={{fontSize:28,marginBottom:8}}>{icon}</div>
      <div style={{fontSize:26,fontWeight:800,color,marginBottom:2}}>{value}</div>
      <div style={{fontSize:12,color:"var(--text-2)",fontWeight:600}}>{label}</div>
      {sub && <div style={{fontSize:11,color:"var(--text-3)",marginTop:3}}>{sub}</div>}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────
function OverviewTab({ stats }) {
  return (
    <div style={{padding:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard icon="👥" label="Total Users"    value={stats.users}    color="#7c3aed" />
        <StatCard icon="📝" label="Total Posts"    value={stats.posts}    color="#06b6d4" />
        <StatCard icon="💬" label="Messages Sent"  value={stats.messages} color="#ec4899" />
        <StatCard icon="🪙" label="Coins in System" value={stats.coins}   color="#f59e0b" />
        <StatCard icon="🏅" label="Badges Awarded" value={stats.badges}   color="#22c55e" />
        <StatCard icon="📖" label="Stories Posted" value={stats.stories}  color="#8b5cf6" />
      </div>
      <div style={{
        background:"var(--bg-2)",border:"1.5px solid var(--border)",
        borderRadius:16,padding:20,
      }}>
        <h3 style={{fontSize:14,fontWeight:700,marginBottom:16,color:"var(--accent-2)"}}>
          ⚡ Owner Quick Actions
        </h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            ["🔒","Lock Registrations","Prevent new signups"],
            ["📣","Global Broadcast","Message all users"],
            ["🗑️","Clear Reports","Mark all resolved"],
            ["💾","Export Data","Download user list CSV"],
          ].map(([ico,lbl,desc]) => (
            <button key={lbl} style={{
              display:"flex",alignItems:"center",gap:10,
              padding:"12px 14px",background:"var(--bg-3)",
              border:"1.5px solid var(--border)",borderRadius:12,
              cursor:"pointer",textAlign:"left",transition:"all .15s",
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent-bd)";e.currentTarget.style.background="var(--accent-bg)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="var(--bg-3)"}}
            >
              <span style={{fontSize:20}}>{ico}</span>
              <div>
                <div style={{fontSize:12,fontWeight:700}}>{lbl}</div>
                <div style={{fontSize:10,color:"var(--text-3)"}}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getDocs(query(collection(db, "users"), orderBy("createdAt","desc"), limit(100)))
      .then(snap => {
        setUsers(snap.docs.map(d => ({ id:d.id, ...d.data() })));
        setLoading(false);
      });
  }, []);

  const filtered = users.filter(u =>
    !search || u.username?.includes(search.toLowerCase()) || u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = async (uid, act) => {
    setMsg("");
    if (act === "ban") {
      await updateDoc(doc(db,"users",uid), { banned:true, bannedAt: serverTimestamp() });
      setMsg("User banned.");
    } else if (act === "unban") {
      await updateDoc(doc(db,"users",uid), { banned:false });
      setMsg("User unbanned.");
    } else if (act === "verify") {
      await awardBadge(uid, "verified");
      setMsg("Verified badge awarded!");
    } else if (act === "founder") {
      await awardBadge(uid, "founder");
      setMsg("Founder badge awarded!");
    } else if (act === "delete") {
      if (!window.confirm("Delete this user's profile permanently?")) return;
      await deleteDoc(doc(db,"users",uid));
      setUsers(prev => prev.filter(u => u.id !== uid));
      setSelected(null);
      setMsg("User deleted.");
    }
    setAction("");
  };

  const sel = selected ? users.find(u => u.id === selected) : null;

  return (
    <div style={{display:"flex",height:"100%",minHeight:0}}>
      {/* User list */}
      <div style={{width:260,flexShrink:0,borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"12px 14px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <input
            placeholder="Search users..."
            value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{
              width:"100%",padding:"8px 12px",background:"var(--bg-2)",
              border:"1.5px solid var(--border)",borderRadius:10,
              color:"var(--text)",fontFamily:"var(--font)",fontSize:12,outline:"none",
            }}
          />
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {loading ? (
            <div style={{display:"flex",justifyContent:"center",padding:20}}>
              <div className="spinner"/>
            </div>
          ) : filtered.map(u => (
            <div key={u.id} onClick={() => setSelected(u.id)}
              style={{
                display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
                cursor:"pointer",borderBottom:"1px solid var(--border)",
                background: selected===u.id ? "var(--accent-bg)" : "transparent",
                transition:"background .1s",
              }}>
              <div style={{
                width:34,height:34,borderRadius:"50%",flexShrink:0,overflow:"hidden",
                background:"var(--bg-3)",display:"flex",alignItems:"center",justifyContent:"center",
                border: u.banned ? "2px solid var(--red)" : "2px solid var(--border)",
              }}>
                {u.avatar
                  ? <img src={u.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span style={{fontSize:12,fontWeight:700,color:"var(--accent-2)"}}>{(u.displayName||"?").slice(0,2).toUpperCase()}</span>
                }
              </div>
              <div style={{minWidth:0,flex:1}}>
                <div style={{fontSize:12,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {u.displayName}
                  {u.banned && <span style={{color:"var(--red)",marginLeft:4,fontSize:10}}>BANNED</span>}
                </div>
                <div style={{fontSize:10,color:"var(--text-3)"}}>@{u.username}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User detail */}
      <div style={{flex:1,overflowY:"auto",padding:20}}>
        {!sel ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--text-3)",gap:10}}>
            <span style={{fontSize:32}}>👤</span>
            <p style={{fontSize:13}}>Select a user to manage</p>
          </div>
        ) : (
          <>
            {msg && (
              <div style={{background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.25)",borderRadius:10,padding:"8px 14px",fontSize:12,color:"var(--green)",marginBottom:16}}>
                ✓ {msg}
              </div>
            )}
            {/* Profile */}
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,padding:"16px",background:"var(--bg-2)",borderRadius:16,border:"1.5px solid var(--border)"}}>
              <div style={{width:56,height:56,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:"var(--bg-3)"}}>
                {sel.avatar
                  ? <img src={sel.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"var(--accent-2)"}}>{(sel.displayName||"?").slice(0,2).toUpperCase()}</div>
                }
              </div>
              <div>
                <div style={{fontSize:16,fontWeight:800}}>{sel.displayName}</div>
                <div style={{fontSize:12,color:"var(--text-3)"}}>@{sel.username} · {sel.email}</div>
                <div style={{fontSize:11,color:"var(--text-3)",marginTop:2}}>
                  {sel.followersCount||0} followers · {sel.followingCount||0} following
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {[
                ["🆔","User ID", sel.id?.slice(0,16)+"..."],
                ["📧","Email", sel.email||"—"],
                ["📅","Joined", sel.createdAt?.toDate ? new Date(sel.createdAt.toDate()).toLocaleDateString() : "—"],
                ["🔒","Status", sel.banned ? "BANNED" : "Active"],
              ].map(([ico,lbl,val]) => (
                <div key={lbl} style={{background:"var(--bg-2)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px"}}>
                  <div style={{fontSize:10,color:"var(--text-3)",marginBottom:3,textTransform:"uppercase",letterSpacing:".04em"}}>{ico} {lbl}</div>
                  <div style={{fontSize:12,fontWeight:700,wordBreak:"break-all"}}>{val}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Actions</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                <button onClick={() => handleAction(sel.id,"verify")} style={{background:"rgba(6,182,212,.12)",border:"1.5px solid rgba(6,182,212,.3)",borderRadius:10,padding:"8px 14px",color:"#06b6d4",fontFamily:"var(--font)",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  ✓ Award Verified
                </button>
                <button onClick={() => handleAction(sel.id,"founder")} style={{background:"rgba(168,85,247,.12)",border:"1.5px solid rgba(168,85,247,.3)",borderRadius:10,padding:"8px 14px",color:"#a855f7",fontFamily:"var(--font)",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  👑 Award Founder
                </button>
                {!sel.banned ? (
                  <button onClick={() => handleAction(sel.id,"ban")} style={{background:"rgba(239,68,68,.1)",border:"1.5px solid rgba(239,68,68,.25)",borderRadius:10,padding:"8px 14px",color:"var(--red)",fontFamily:"var(--font)",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    🚫 Ban User
                  </button>
                ) : (
                  <button onClick={() => handleAction(sel.id,"unban")} style={{background:"rgba(34,197,94,.1)",border:"1.5px solid rgba(34,197,94,.25)",borderRadius:10,padding:"8px 14px",color:"var(--green)",fontFamily:"var(--font)",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    ✓ Unban User
                  </button>
                )}
                <button onClick={() => handleAction(sel.id,"delete")} style={{background:"rgba(239,68,68,.08)",border:"1.5px solid rgba(239,68,68,.2)",borderRadius:10,padding:"8px 14px",color:"var(--red)",fontFamily:"var(--font)",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  🗑️ Delete Profile
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Award Badges tab ──────────────────────────────────────────
function BadgesTab() {
  const [users, setUsers] = useState([]);
  const [selUser, setSelUser] = useState("");
  const [selBadge, setSelBadge] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getDocs(query(collection(db,"users"),limit(100)))
      .then(snap => setUsers(usersFromSnapshot(snap)))
      .catch(err => setMsg("Error loading users: " + err.message));
  }, []);

  const filtered = users.filter(u =>
    !search || u.username?.includes(search.toLowerCase()) || u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAward = async () => {
    if (!selUser || !selBadge) { setMsg("Select a user and badge."); return; }
    setLoading(true); setMsg("");
    try {
      await awardBadge(selUser, selBadge);
      const badge = BADGES[selBadge];
      setMsg(`✓ ${badge.icon} ${badge.label} awarded! (+${badge.coinReward} coins sent)`);
      setSelBadge("");
    } catch (err) { setMsg("Error: " + err.message); }
    setLoading(false);
  };

  const selUserObj = users.find(u => u.id === selUser);

  return (
    <div style={{padding:20}}>
      {msg && (
        <div style={{
          background: msg.startsWith("✓") ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)",
          border: `1px solid ${msg.startsWith("✓") ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.25)"}`,
          borderRadius:12,padding:"10px 16px",fontSize:13,
          color: msg.startsWith("✓") ? "var(--green)" : "var(--red)",
          marginBottom:16,
        }}>{msg}</div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        {/* User picker */}
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>
            1. Select User
          </div>
          <input
            placeholder="Search users..."
            value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",padding:"8px 12px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:10,color:"var(--text)",fontFamily:"var(--font)",fontSize:12,outline:"none",marginBottom:8}}
          />
          <div style={{maxHeight:220,overflowY:"auto",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:12}}>
            {filtered.map(u => (
              <div key={u.id} onClick={() => setSelUser(u.id)}
                style={{
                  display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                  cursor:"pointer",borderBottom:"1px solid var(--border)",
                  background: selUser===u.id ? "var(--accent-bg)" : "transparent",
                  transition:"background .1s",
                }}>
                <div style={{width:28,height:28,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:"var(--bg-3)"}}>
                  {u.avatar
                    ? <img src={u.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"var(--accent-2)"}}>{(u.displayName||"?").slice(0,2).toUpperCase()}</div>
                  }
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700}}>{u.displayName}</div>
                  <div style={{fontSize:10,color:"var(--text-3)"}}>@{u.username}</div>
                </div>
                {selUser===u.id && <span style={{color:"var(--accent-2)",marginLeft:"auto",fontSize:14}}>✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Badge picker */}
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>
            2. Select Badge
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:280,overflowY:"auto"}}>
            {Object.values(BADGES).map(badge => (
              <button key={badge.id} onClick={() => setSelBadge(badge.id)}
                style={{
                  display:"flex",alignItems:"center",gap:12,padding:"12px 14px",
                  background: selBadge===badge.id ? `${badge.color}20` : "var(--bg-2)",
                  border: `1.5px solid ${selBadge===badge.id ? badge.color+"66" : "var(--border)"}`,
                  borderRadius:12,cursor:"pointer",textAlign:"left",
                  transition:"all .15s",
                  boxShadow: selBadge===badge.id ? `0 0 12px ${badge.glow}` : "none",
                }}>
                <div style={{
                  width:38,height:38,borderRadius:"50%",flexShrink:0,
                  background:`${badge.color}20`,border:`1.5px solid ${badge.color}44`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
                }}>{badge.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700}}>{badge.label}</div>
                  <div style={{fontSize:10,color:"var(--text-3)"}}>{badge.desc}</div>
                </div>
                <div style={{fontSize:11,color:"#f59e0b",fontWeight:700,flexShrink:0}}>
                  +{badge.coinReward}🪙
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview + confirm */}
      {selUser && selBadge && (
        <div style={{
          background:"var(--accent-bg)",border:"1.5px solid var(--accent-bd)",
          borderRadius:16,padding:"16px 20px",marginBottom:16,
          display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,
        }}>
          <div style={{fontSize:14}}>
            Award <strong style={{color: BADGES[selBadge].color}}>{BADGES[selBadge].icon} {BADGES[selBadge].label}</strong> to <strong style={{color:"var(--accent-2)"}}>{selUserObj?.displayName}</strong> + {BADGES[selBadge].coinReward} coins?
          </div>
          <button onClick={handleAward} disabled={loading} style={{
            background:"linear-gradient(135deg,var(--accent),var(--accent-2))",
            border:"none",borderRadius:12,padding:"10px 20px",
            color:"#fff",fontFamily:"var(--font)",fontSize:13,fontWeight:700,
            cursor:"pointer",flexShrink:0,
            boxShadow:"0 0 14px var(--glow-purple)",
          }}>
            {loading ? "Awarding…" : "Award Now 🏅"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Coins tab ─────────────────────────────────────────────────
function CoinsTab() {
  const [users, setUsers] = useState([]);
  const [selUser, setSelUser] = useState("");
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
 
  useEffect(() => {
    getDocs(query(collection(db, "users"), limit(100)))
      .then(snap => setUsers(usersFromSnapshot(snap)))
      .catch(err => setMsg("Error loading users: " + err.message));
  }, []);
 
  const handleGive = async () => {
    if (!selUser || amount < 1) { setMsg("Select user and valid amount."); return; }
    setLoading(true);
    setMsg("");
    try {
      const coinRef = doc(db, "coins", selUser);
      const snap    = await getDoc(coinRef);
 
      if (snap.exists()) {
        // Use plain arithmetic — no increment() import needed
        const current = snap.data().balance || 0;
        await updateDoc(coinRef, { balance: current + amount });
      } else {
        await setDoc(coinRef, { balance: amount, uid: selUser });
      }
 
      // Notification
      await addDoc(collection(db, "notifications"), {
        type:         "tip",
        fromUid:      "system",
        fromUsername: "Nexus Owner",
        toUid:        selUser,
        message:      `gifted you ${amount} coins 🪙${reason ? ` — "${reason}"` : ""}`,
        amount,
        read:         false,
        createdAt:    serverTimestamp(),
      });
 
      const u = users.find(u => u.id === selUser);
      setMsg(`✓ Sent ${amount} coins to ${u?.displayName}`);
      setAmount(100);
      setReason("");
    } catch (err) {
      setMsg("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div style={{ padding: 20 }}>
      {msg && (
        <div style={{
          background: msg.startsWith("✓") ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)",
          border: `1px solid ${msg.startsWith("✓") ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.25)"}`,
          borderRadius: 12, padding: "10px 16px", fontSize: 13,
          color: msg.startsWith("✓") ? "var(--green)" : "var(--red)", marginBottom: 16,
        }}>{msg}</div>
      )}
 
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          {/* Recipient */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
            Recipient
          </div>
          <select
            value={selUser}
            onChange={e => setSelUser(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", background: "var(--bg-2)", border: "1.5px solid var(--border)", borderRadius: 12, color: "var(--text)", fontFamily: "var(--font)", fontSize: 13, outline: "none", marginBottom: 12 }}
          >
            <option value="">— Select user —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.displayName} (@{u.username})</option>)}
          </select>
 
          {/* Quick amounts */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
            Amount
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {[50, 100, 200, 500, 1000].map(a => (
              <button key={a} onClick={() => setAmount(a)} style={{
                padding: "7px 14px",
                border: `1.5px solid ${amount === a ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 10,
                background: amount === a ? "var(--accent-bg)" : "var(--bg-2)",
                color: amount === a ? "var(--accent-2)" : "var(--text-2)",
                fontFamily: "var(--font)", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>
                🪙 {a}
              </button>
            ))}
          </div>
 
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            min={1}
            max={99999}
            style={{ width: "100%", padding: "10px 12px", background: "var(--bg-2)", border: "1.5px solid var(--border)", borderRadius: 12, color: "var(--text)", fontFamily: "var(--font)", fontSize: 13, outline: "none", marginBottom: 12 }}
          />
 
          {/* Reason */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
            Reason (optional)
          </div>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Contest winner, bug bounty, etc..."
            style={{ width: "100%", padding: "10px 12px", background: "var(--bg-2)", border: "1.5px solid var(--border)", borderRadius: 12, color: "var(--text)", fontFamily: "var(--font)", fontSize: 13, outline: "none", marginBottom: 16 }}
          />
 
          <button
            onClick={handleGive}
            disabled={loading || !selUser}
            style={{
              width: "100%",
              background: "linear-gradient(135deg,var(--accent),var(--accent-2))",
              border: "none", borderRadius: 12, padding: 12,
              color: "#fff", fontFamily: "var(--font)", fontSize: 14, fontWeight: 700,
              cursor: loading || !selUser ? "not-allowed" : "pointer",
              boxShadow: "0 0 16px var(--glow-purple)",
            }}
          >
            {loading ? "Sending…" : `Send 🪙 ${amount} Coins`}
          </button>
        </div>
 
        <div style={{ background: "var(--bg-2)", border: "1.5px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: "var(--accent-2)" }}>🪙 Coin Economy</h3>
          <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7 }}>
            As owner you can gift coins to any user for:<br /><br />
            • Contest &amp; giveaway winners<br />
            • Bug bounty rewards<br />
            • Community contributions<br />
            • Special events<br />
            • Early tester rewards<br /><br />
            All gifts are logged and the user receives a notification.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Broadcast tab ─────────────────────────────────────────────
function BroadcastTab() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { setMsg("Fill in title and message."); return; }
    setLoading(true); setMsg("");
    try {
      const users = await getDocs(collection(db,"users"));
      const batch = [];
      users.docs.forEach(d => {
        batch.push(addDoc(collection(db,"notifications"), {
          type:"broadcast",fromUid:"system",fromUsername:"Nexus",
          toUid:d.id,message:body.trim(),title:title.trim(),
          notifType:type,read:false,createdAt:serverTimestamp(),
        }));
      });
      await Promise.all(batch);
      setMsg(`✓ Broadcast sent to ${users.size} users!`);
      setTitle(""); setBody("");
    } catch(err) { setMsg("Error: "+err.message); }
    setLoading(false);
  };

  const TYPES = [
    {id:"info",    label:"📢 Info",    color:"#06b6d4"},
    {id:"update",  label:"✨ Update",  color:"#a855f7"},
    {id:"warning", label:"⚠️ Warning", color:"#f59e0b"},
    {id:"event",   label:"🎉 Event",   color:"#22c55e"},
  ];

  return (
    <div style={{padding:20,maxWidth:560}}>
      {msg && (
        <div style={{background:msg.startsWith("✓")?"rgba(34,197,94,.1)":"rgba(239,68,68,.1)",border:`1px solid ${msg.startsWith("✓")?"rgba(34,197,94,.25)":"rgba(239,68,68,.25)"}`,borderRadius:12,padding:"10px 16px",fontSize:13,color:msg.startsWith("✓")?"var(--green)":"var(--red)",marginBottom:16}}>{msg}</div>
      )}
      <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Message Type</div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {TYPES.map(t => (
          <button key={t.id} onClick={()=>setType(t.id)} style={{
            padding:"7px 14px",border:`1.5px solid ${type===t.id?t.color+"66":"var(--border)"}`,
            borderRadius:10,background:type===t.id?t.color+"15":"var(--bg-2)",
            color:type===t.id?t.color:"var(--text-2)",
            fontFamily:"var(--font)",fontSize:11,fontWeight:700,cursor:"pointer",
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Title</div>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. New Feature Alert!"
        style={{width:"100%",padding:"10px 12px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:12,color:"var(--text)",fontFamily:"var(--font)",fontSize:13,outline:"none",marginBottom:16}} />
      <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Message</div>
      <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Write your broadcast message..." rows={5}
        style={{width:"100%",padding:"10px 12px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:12,color:"var(--text)",fontFamily:"var(--font)",fontSize:13,outline:"none",resize:"vertical",marginBottom:16}} />
      <button onClick={handleSend} disabled={loading||!title.trim()||!body.trim()}
        style={{width:"100%",background:"linear-gradient(135deg,var(--accent),var(--accent-2))",border:"none",borderRadius:12,padding:"13px",color:"#fff",fontFamily:"var(--font)",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 0 16px var(--glow-purple)"}}>
        {loading?"Sending to all users…":"📣 Send to All Users"}
      </button>
      <p style={{fontSize:11,color:"var(--text-3)",textAlign:"center",marginTop:10}}>
        This will send a notification to every single user on Nexus
      </p>
    </div>
  );
}

// ── Reports tab ───────────────────────────────────────────────
function ReportsTab() {
  return (
    <div style={{padding:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,color:"var(--text-3)",minHeight:200}}>
      <span style={{fontSize:40}}>🚨</span>
      <h3 style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>Reports Dashboard</h3>
      <p style={{fontSize:13,textAlign:"center"}}>When users report content, it will appear here. No reports yet.</p>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────
export default function SuperOwnerDashboard({ onClose }) {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({ users:0, posts:0, messages:0, coins:0, badges:0, stories:0 });

  useEffect(() => {
    const fetch = async () => {
      const [users, posts, stories, badges] = await Promise.all([
        getDocs(query(collection(db,"users"), limit(1000))),
        getDocs(query(collection(db,"posts"), limit(1000))),
        getDocs(query(collection(db,"stories"), limit(1000))),
        getDocs(query(collection(db,"badges"), limit(1000))),
      ]);
      const badgeCount = badges.docs.reduce((acc,d) => acc + (d.data().list?.length||0), 0);
      setStats({
        users: users.size,
        posts: posts.size,
        messages: "—",
        coins: "—",
        badges: badgeCount,
        stories: stories.size,
      });
    };
    fetch();
  }, []);

  return createPortal(
    <div style={{
      position:"fixed",inset:0,zIndex:999,
      background:"rgba(0,0,0,.9)",backdropFilter:"blur(12px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16,
    }}>
      <div style={{
        background:"var(--bg-1)",border:"1.5px solid var(--border-2)",
        borderRadius:24,width:"100%",maxWidth:860,
        height:"min(700px,94vh)",display:"flex",flexDirection:"column",
        overflow:"hidden",
        boxShadow:"0 0 80px var(--glow-purple),0 0 160px rgba(124,58,237,.2),0 32px 80px rgba(0,0,0,.9)",
        animation:"modal-enter .25s cubic-bezier(.16,1,.3,1)",
      }}>

        {/* Header */}
        <div style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"18px 24px",borderBottom:"1px solid var(--border)",flexShrink:0,
          background:"linear-gradient(90deg,rgba(124,58,237,.15) 0%,rgba(6,182,212,.08) 100%)",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{
              width:40,height:40,borderRadius:12,
              background:"linear-gradient(135deg,var(--accent),var(--accent-2))",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:20,boxShadow:"0 0 20px var(--glow-purple)",
            }}>⚡</div>
            <div>
              <h2 style={{fontSize:17,fontWeight:800,letterSpacing:"-.02em"}}>Super Owner Dashboard</h2>
              <p style={{fontSize:11,color:"var(--text-3)"}}>Full administrative access · Nexus v2.0</p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{
              background:"rgba(34,197,94,.12)",border:"1px solid rgba(34,197,94,.3)",
              borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700,color:"var(--green)",
            }}>● OWNER ACTIVE</div>
            <button className="icon-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display:"flex",gap:2,padding:"10px 16px",
          borderBottom:"1px solid var(--border)",flexShrink:0,
          overflowX:"auto",
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              display:"flex",alignItems:"center",gap:6,
              padding:"7px 14px",border:"none",borderRadius:10,cursor:"pointer",
              background:tab===t.id?"var(--accent)":"transparent",
              color:tab===t.id?"#fff":"var(--text-3)",
              fontFamily:"var(--font)",fontSize:12,fontWeight:700,
              transition:"all .15s",flexShrink:0,
              boxShadow:tab===t.id?"0 0 12px var(--glow-purple)":"none",
            }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",minHeight:0}}>
          {tab==="overview"  && <OverviewTab stats={stats} />}
          {tab==="users"     && <UsersTab />}
          {tab==="badges"    && <BadgesTab />}
          {tab==="coins"     && <CoinsTab />}
          {tab==="broadcast" && <BroadcastTab />}
          {tab==="reports"   && <ReportsTab />}
        </div>
      </div>
    </div>,
    document.body
  );
}
