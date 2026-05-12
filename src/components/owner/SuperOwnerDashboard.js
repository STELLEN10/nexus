// src/components/owner/SuperOwnerDashboard.js
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  collection, getDocs, doc, updateDoc, deleteDoc,
  query, orderBy, limit, getDoc, setDoc, addDoc,
  serverTimestamp, increment, writeBatch, where,
} from "firebase/firestore";
import { db } from "../../firebase";
import { awardBadge, BADGES } from "../../hooks/useBadgeSystem";
import { giveCoinsToUser, OWNER_UID_KEY } from "../../hooks/useCoins";
import { useAuth } from "../../context/AuthContext";

// ── Tabs ──────────────────────────────────────────────────────
const TABS = [
  { id:"overview",   icon:"📊", label:"Overview"     },
  { id:"users",      icon:"👥", label:"Users"        },
  { id:"badges",     icon:"🏅", label:"Award Badges" },
  { id:"coins",      icon:"🪙", label:"Coins"        },
  { id:"broadcast",  icon:"📣", label:"Broadcast"    },
];

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, color="#7c3aed" }) {
  return (
    <div style={{
      background:"var(--bg-2)",border:`1.5px solid ${color}33`,
      borderRadius:16,padding:"18px 20px",
      boxShadow:`0 0 16px ${color}18`,
    }}>
      <div style={{fontSize:26,marginBottom:8}}>{icon}</div>
      <div style={{fontSize:24,fontWeight:800,color,marginBottom:2}}>{value}</div>
      <div style={{fontSize:12,color:"var(--text-2)",fontWeight:600}}>{label}</div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────
function OverviewTab({ stats, ownerUid }) {
  const [lockReg, setLockReg] = useState(false);
  const [msg, setMsg] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  const handleLockReg = async () => {
    const newVal = !lockReg;
    setLockReg(newVal);
    await setDoc(doc(db, "config", "global"), { registrationLocked: newVal }, { merge: true });
    setMsg(newVal ? "🔒 New registrations locked." : "🔓 Registrations reopened.");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleClearReports = async () => {
    const snap = await getDocs(collection(db, "reports"));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { resolved: true }));
    await batch.commit();
    setMsg("✓ All reports marked resolved.");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleBroadcast = async () => {
    const text = prompt("Enter broadcast message to all users:");
    if (!text?.trim()) return;
    setBroadcasting(true);
    try {
      const users = await getDocs(collection(db, "users"));
      await Promise.all(users.docs.map(d =>
        addDoc(collection(db, "notifications"), {
          type:"broadcast", fromUid:"system", fromUsername:"Nexus",
          toUid:d.id, message:text.trim(), read:false,
          createdAt:serverTimestamp(),
        })
      ));
      setMsg(`✓ Broadcast sent to ${users.size} users!`);
    } catch(e) { setMsg("Error: "+e.message); }
    setBroadcasting(false);
    setTimeout(() => setMsg(""), 4000);
  };

  const handleExport = async () => {
    const snap = await getDocs(query(collection(db,"users"),orderBy("createdAt","desc")));
    const rows = [["Username","Display Name","Email","Followers","Following","Joined"]];
    snap.docs.forEach(d => {
      const u = d.data();
      rows.push([u.username||"",u.displayName||"",u.email||"",u.followersCount||0,u.followingCount||0,
        u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : ""]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="nexus_users.csv"; a.click();
    setMsg("✓ CSV downloaded!");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleRefillOwner = async () => {
    if (!ownerUid) return;
    await setDoc(doc(db,"coins",ownerUid), { balance:999999, uid:ownerUid }, { merge:true });
    setMsg("✓ Owner wallet set to 999,999 coins.");
    setTimeout(() => setMsg(""), 3000);
  };

  const ACTIONS = [
    { ico:"🔒", label: lockReg?"🔓 Unlock Registrations":"🔒 Lock Registrations", desc:"Control new signups",   fn:handleLockReg },
    { ico:"📣", label:"Global Broadcast",     desc:"Message all users",       fn:handleBroadcast },
    { ico:"🗑️", label:"Clear Reports",        desc:"Mark all resolved",       fn:handleClearReports },
    { ico:"💾", label:"Export User CSV",      desc:"Download all user data",  fn:handleExport },
    { ico:"🪙", label:"Refill Owner Wallet",  desc:"Set your coins to 999k",  fn:handleRefillOwner },
  ];

  return (
    <div style={{padding:20}}>
      {msg && (
        <div style={{
          background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.25)",
          borderRadius:12,padding:"10px 16px",fontSize:13,color:"var(--green)",marginBottom:16,
        }}>{msg}</div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard icon="👥" label="Total Users"    value={stats.users}   color="#7c3aed"/>
        <StatCard icon="📝" label="Total Posts"    value={stats.posts}   color="#06b6d4"/>
        <StatCard icon="📖" label="Stories"        value={stats.stories} color="#8b5cf6"/>
        <StatCard icon="🏅" label="Badges Awarded" value={stats.badges}  color="#22c55e"/>
        <StatCard icon="🪙" label="Wallets Created" value={stats.wallets} color="#f59e0b"/>
        <StatCard icon="📣" label="Notifications"  value={stats.notifs}  color="#ec4899"/>
      </div>
      <div style={{
        background:"var(--bg-2)",border:"1.5px solid var(--border)",
        borderRadius:16,padding:20,
      }}>
        <h3 style={{fontSize:13,fontWeight:700,marginBottom:14,color:"var(--accent-2)"}}>
          ⚡ Owner Quick Actions
        </h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {ACTIONS.map(a => (
            <button key={a.label} onClick={a.fn} disabled={broadcasting}
              style={{
                display:"flex",alignItems:"center",gap:10,
                padding:"13px 14px",background:"var(--bg-3)",
                border:"1.5px solid var(--border)",borderRadius:12,
                cursor:"pointer",textAlign:"left",transition:"all .15s",width:"100%",
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent-bd)";e.currentTarget.style.background="var(--accent-bg)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="var(--bg-3)"}}
            >
              <span style={{fontSize:22,flexShrink:0}}>{a.ico}</span>
              <div>
                <div style={{fontSize:12,fontWeight:700}}>{a.label}</div>
                <div style={{fontSize:10,color:"var(--text-3)"}}>{a.desc}</div>
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
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getDocs(query(collection(db,"users"),orderBy("createdAt","desc"),limit(200)))
      .then(snap => { setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); });
  }, []);

  const filtered = users.filter(u =>
    !search || u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const doAction = async (uid, act) => {
    setMsg("");
    if (act==="ban") {
      await updateDoc(doc(db,"users",uid),{banned:true});
      setUsers(p=>p.map(u=>u.id===uid?{...u,banned:true}:u));
      setMsg("🚫 User banned.");
    } else if (act==="unban") {
      await updateDoc(doc(db,"users",uid),{banned:false});
      setUsers(p=>p.map(u=>u.id===uid?{...u,banned:false}:u));
      setMsg("✓ User unbanned.");
    } else if (act==="verify") {
      await awardBadge(uid,"verified"); setMsg("✓ Verified badge awarded!");
    } else if (act==="founder") {
      await awardBadge(uid,"founder"); setMsg("✓ Founder badge awarded!");
    } else if (act==="og") {
      await awardBadge(uid,"og"); setMsg("✓ OG badge awarded!");
    } else if (act==="legend") {
      await awardBadge(uid,"legend"); setMsg("✓ Legend badge awarded!");
    } else if (act==="give100") {
      await giveCoinsToUser(uid,100,"Nexus Owner","Owner gift");
      setMsg("✓ 100 coins sent!");
    } else if (act==="give500") {
      await giveCoinsToUser(uid,500,"Nexus Owner","Owner gift");
      setMsg("✓ 500 coins sent!");
    } else if (act==="delete") {
      if (!window.confirm("Delete this user's profile permanently?")) return;
      await deleteDoc(doc(db,"users",uid));
      setUsers(p=>p.filter(u=>u.id!==uid));
      setSelected(null);
      setMsg("🗑️ User deleted.");
    }
    setTimeout(()=>setMsg(""),4000);
  };

  const sel = selected ? users.find(u=>u.id===selected) : null;

  return (
    <div style={{display:"flex",height:"100%",minHeight:0}}>
      {/* List */}
      <div style={{width:250,flexShrink:0,borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"10px 12px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",padding:"7px 10px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:10,color:"var(--text)",fontFamily:"var(--font)",fontSize:12,outline:"none"}}/>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {loading ? <div style={{display:"flex",justifyContent:"center",padding:20}}><div className="spinner"/></div>
          : filtered.map(u=>(
            <div key={u.id} onClick={()=>setSelected(u.id)}
              style={{
                display:"flex",alignItems:"center",gap:8,padding:"9px 12px",
                cursor:"pointer",borderBottom:"1px solid var(--border)",
                background:selected===u.id?"var(--accent-bg)":"transparent",
              }}>
              <div style={{width:30,height:30,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:"var(--bg-3)",border:`2px solid ${u.banned?"var(--red)":"var(--border)"}`}}>
                {u.avatar?<img src={u.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"var(--accent-2)"}}>{(u.displayName||"?").slice(0,2).toUpperCase()}</div>}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {u.displayName}{u.banned&&<span style={{color:"var(--red)",fontSize:9,marginLeft:4}}>BANNED</span>}
                </div>
                <div style={{fontSize:10,color:"var(--text-3)"}}>@{u.username}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div style={{flex:1,overflowY:"auto",padding:18}}>
        {!sel ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--text-3)",gap:8}}>
            <span style={{fontSize:32}}>👤</span><p style={{fontSize:13}}>Select a user</p>
          </div>
        ) : (
          <>
            {msg&&<div style={{background:msg.startsWith("✓")||msg.startsWith("🪙")?"rgba(34,197,94,.1)":"rgba(239,68,68,.08)",border:`1px solid ${msg.startsWith("✓")||msg.startsWith("🪙")?"rgba(34,197,94,.25)":"rgba(239,68,68,.2)"}`,borderRadius:10,padding:"8px 14px",fontSize:12,color:msg.startsWith("✓")||msg.startsWith("🪙")?"var(--green)":"var(--red)",marginBottom:14}}>{msg}</div>}

            <div style={{display:"flex",alignItems:"center",gap:12,padding:14,background:"var(--bg-2)",borderRadius:14,border:"1.5px solid var(--border)",marginBottom:16}}>
              <div style={{width:50,height:50,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:"var(--bg-3)"}}>
                {sel.avatar?<img src={sel.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"var(--accent-2)"}}>{(sel.displayName||"?").slice(0,2).toUpperCase()}</div>}
              </div>
              <div>
                <div style={{fontSize:15,fontWeight:800}}>{sel.displayName}</div>
                <div style={{fontSize:12,color:"var(--text-3)"}}>@{sel.username} · {sel.email}</div>
                <div style={{fontSize:11,color:"var(--text-3)",marginTop:2}}>{sel.followersCount||0} followers · UID: {sel.id?.slice(0,12)}...</div>
              </div>
            </div>

            <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Actions</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {[
                {label:"✓ Verify",   color:"#06b6d4", act:"verify"},
                {label:"👑 Founder", color:"#a855f7", act:"founder"},
                {label:"🔥 OG",      color:"#ef4444", act:"og"},
                {label:"⚡ Legend",  color:"#eab308", act:"legend"},
                {label:"🪙 +100",    color:"#f59e0b", act:"give100"},
                {label:"🪙 +500",    color:"#f59e0b", act:"give500"},
                {label:sel.banned?"✓ Unban":"🚫 Ban", color:sel.banned?"#22c55e":"#ef4444", act:sel.banned?"unban":"ban"},
                {label:"🗑️ Delete",  color:"#ef4444", act:"delete"},
              ].map(a=>(
                <button key={a.act} onClick={()=>doAction(sel.id,a.act)}
                  style={{background:`${a.color}14`,border:`1.5px solid ${a.color}44`,borderRadius:10,padding:"7px 12px",color:a.color,fontFamily:"var(--font)",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${a.color}28`}}
                  onMouseLeave={e=>{e.currentTarget.style.background=`${a.color}14`}}
                >{a.label}</button>
              ))}
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

  useEffect(()=>{
    getDocs(query(collection(db,"users"),orderBy("displayName"),limit(200)))
      .then(snap=>setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))));
  },[]);

  const filtered = users.filter(u=>!search||u.username?.toLowerCase().includes(search.toLowerCase())||u.displayName?.toLowerCase().includes(search.toLowerCase()));

  const handleAward = async () => {
    if (!selUser||!selBadge){setMsg("Select a user and badge.");return;}
    setLoading(true);setMsg("");
    try {
      await awardBadge(selUser, selBadge);
      const badge=BADGES[selBadge];
      setMsg(`✓ ${badge.icon} ${badge.label} awarded! (+${badge.coinReward} coins sent to user)`);
      setSelBadge("");
    } catch(e){setMsg("Error: "+e.message);}
    setLoading(false);
    setTimeout(()=>setMsg(""),5000);
  };

  const selUserObj = users.find(u=>u.id===selUser);

  return (
    <div style={{padding:20}}>
      {msg&&<div style={{background:msg.startsWith("✓")?"rgba(34,197,94,.1)":"rgba(239,68,68,.1)",border:`1px solid ${msg.startsWith("✓")?"rgba(34,197,94,.25)":"rgba(239,68,68,.25)"}`,borderRadius:12,padding:"10px 14px",fontSize:13,color:msg.startsWith("✓")?"var(--green)":"var(--red)",marginBottom:14}}>{msg}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        {/* User picker */}
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>1. Pick User</div>
          <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",padding:"8px 12px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:10,color:"var(--text)",fontFamily:"var(--font)",fontSize:12,outline:"none",marginBottom:8}}/>
          <div style={{maxHeight:240,overflowY:"auto",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:12}}>
            {filtered.map(u=>(
              <div key={u.id} onClick={()=>setSelUser(u.id)}
                style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",cursor:"pointer",borderBottom:"1px solid var(--border)",background:selUser===u.id?"var(--accent-bg)":"transparent"}}>
                <div style={{width:26,height:26,borderRadius:"50%",overflow:"hidden",background:"var(--bg-3)",flexShrink:0}}>
                  {u.avatar?<img src={u.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"var(--accent-2)"}}>{(u.displayName||"?").slice(0,2).toUpperCase()}</div>}
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700}}>{u.displayName}</div>
                  <div style={{fontSize:10,color:"var(--text-3)"}}>@{u.username}</div>
                </div>
                {selUser===u.id&&<span style={{color:"var(--accent-2)",marginLeft:"auto",fontSize:13}}>✓</span>}
              </div>
            ))}
          </div>
        </div>
        {/* Badge picker */}
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>2. Pick Badge</div>
          <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:288,overflowY:"auto"}}>
            {Object.values(BADGES).map(badge=>(
              <button key={badge.id} onClick={()=>setSelBadge(badge.id)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:selBadge===badge.id?`${badge.color}18`:"var(--bg-2)",border:`1.5px solid ${selBadge===badge.id?badge.color+"66":"var(--border)"}`,borderRadius:12,cursor:"pointer",textAlign:"left",transition:"all .15s",boxShadow:selBadge===badge.id?`0 0 10px ${badge.glow}`:"none"}}>
                <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,background:`${badge.color}20`,border:`1.5px solid ${badge.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{badge.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700}}>{badge.label}</div>
                  <div style={{fontSize:10,color:"var(--text-3)"}}>{badge.desc}</div>
                </div>
                <div style={{fontSize:11,color:"#f59e0b",fontWeight:700,flexShrink:0}}>+{badge.coinReward}🪙</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      {selUser&&selBadge&&(
        <div style={{background:"var(--accent-bg)",border:"1.5px solid var(--accent-bd)",borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div style={{fontSize:13}}>
            Award <strong style={{color:BADGES[selBadge].color}}>{BADGES[selBadge].icon} {BADGES[selBadge].label}</strong> to <strong style={{color:"var(--accent-2)"}}>{selUserObj?.displayName}</strong> + {BADGES[selBadge].coinReward} coins?
          </div>
          <button onClick={handleAward} disabled={loading}
            style={{background:"linear-gradient(135deg,var(--accent),var(--accent-2))",border:"none",borderRadius:12,padding:"10px 18px",color:"#fff",fontFamily:"var(--font)",fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0,boxShadow:"0 0 14px var(--glow-purple)"}}>
            {loading?"Awarding…":"Award 🏅"}
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

  useEffect(()=>{
    getDocs(query(collection(db,"users"),orderBy("displayName"),limit(200)))
      .then(snap=>setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))));
  },[]);

  const handleGive = async () => {
    if (!selUser||amount<1){setMsg("Select user and valid amount.");return;}
    setLoading(true);setMsg("");
    try {
      await giveCoinsToUser(selUser, amount, "Nexus Owner", reason);
      const u=users.find(u=>u.id===selUser);
      setMsg(`✓ Sent ${amount} coins to ${u?.displayName}!`);
      setAmount(100);setReason("");
    } catch(e){setMsg("Error: "+e.message);}
    setLoading(false);
    setTimeout(()=>setMsg(""),4000);
  };

  return (
    <div style={{padding:20,maxWidth:540}}>
      {msg&&<div style={{background:msg.startsWith("✓")?"rgba(34,197,94,.1)":"rgba(239,68,68,.1)",border:`1px solid ${msg.startsWith("✓")?"rgba(34,197,94,.25)":"rgba(239,68,68,.25)"}`,borderRadius:12,padding:"10px 14px",fontSize:13,color:msg.startsWith("✓")?"var(--green)":"var(--red)",marginBottom:14}}>{msg}</div>}
      <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Recipient</div>
      <select value={selUser} onChange={e=>setSelUser(e.target.value)}
        style={{width:"100%",padding:"10px 12px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:12,color:"var(--text)",fontFamily:"var(--font)",fontSize:13,outline:"none",marginBottom:14}}>
        <option value="">— Select user —</option>
        {users.map(u=><option key={u.id} value={u.id}>{u.displayName} (@{u.username})</option>)}
      </select>
      <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Amount</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
        {[50,100,200,500,1000,5000].map(a=>(
          <button key={a} onClick={()=>setAmount(a)} style={{padding:"7px 14px",border:`1.5px solid ${amount===a?"var(--accent)":"var(--border)"}`,borderRadius:10,background:amount===a?"var(--accent-bg)":"var(--bg-2)",color:amount===a?"var(--accent-2)":"var(--text-2)",fontFamily:"var(--font)",fontSize:12,fontWeight:700,cursor:"pointer"}}>🪙 {a}</button>
        ))}
      </div>
      <input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} min={1} max={999999}
        style={{width:"100%",padding:"10px 12px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:12,color:"var(--text)",fontFamily:"var(--font)",fontSize:13,outline:"none",marginBottom:14}}/>
      <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Reason (optional)</div>
      <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Contest winner, bug bounty, gift…"
        style={{width:"100%",padding:"10px 12px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:12,color:"var(--text)",fontFamily:"var(--font)",fontSize:13,outline:"none",marginBottom:14}}/>
      <button onClick={handleGive} disabled={loading||!selUser}
        style={{width:"100%",background:"linear-gradient(135deg,var(--accent),var(--accent-2))",border:"none",borderRadius:12,padding:"13px",color:"#fff",fontFamily:"var(--font)",fontSize:14,fontWeight:700,cursor:loading||!selUser?"not-allowed":"pointer",boxShadow:"0 0 16px var(--glow-purple)"}}>
        {loading?"Sending…":`Send 🪙 ${amount} Coins`}
      </button>
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
    if (!title.trim()||!body.trim()){setMsg("Fill in title and message.");return;}
    setLoading(true);setMsg("");
    try {
      const users = await getDocs(collection(db,"users"));
      await Promise.all(users.docs.map(d=>
        addDoc(collection(db,"notifications"),{
          type:"broadcast",fromUid:"system",fromUsername:"Nexus",
          toUid:d.id,message:body.trim(),title:title.trim(),
          notifType:type,read:false,createdAt:serverTimestamp(),
        })
      ));
      setMsg(`✓ Broadcast sent to ${users.size} users!`);
      setTitle("");setBody("");
    } catch(e){setMsg("Error: "+e.message);}
    setLoading(false);
    setTimeout(()=>setMsg(""),5000);
  };

  const TYPES=[{id:"info",label:"📢 Info",color:"#06b6d4"},{id:"update",label:"✨ Update",color:"#a855f7"},{id:"warning",label:"⚠️ Warning",color:"#f59e0b"},{id:"event",label:"🎉 Event",color:"#22c55e"}];

  return (
    <div style={{padding:20,maxWidth:520}}>
      {msg&&<div style={{background:msg.startsWith("✓")?"rgba(34,197,94,.1)":"rgba(239,68,68,.1)",border:`1px solid ${msg.startsWith("✓")?"rgba(34,197,94,.25)":"rgba(239,68,68,.25)"}`,borderRadius:12,padding:"10px 14px",fontSize:13,color:msg.startsWith("✓")?"var(--green)":"var(--red)",marginBottom:14}}>{msg}</div>}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {TYPES.map(t=>(
          <button key={t.id} onClick={()=>setType(t.id)}
            style={{padding:"7px 14px",border:`1.5px solid ${type===t.id?t.color+"66":"var(--border)"}`,borderRadius:10,background:type===t.id?t.color+"15":"var(--bg-2)",color:type===t.id?t.color:"var(--text-2)",fontFamily:"var(--font)",fontSize:11,fontWeight:700,cursor:"pointer"}}>
            {t.label}
          </button>
        ))}
      </div>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title e.g. New Feature Alert!"
        style={{width:"100%",padding:"10px 12px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:12,color:"var(--text)",fontFamily:"var(--font)",fontSize:13,outline:"none",marginBottom:12}}/>
      <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Write your message to all users..." rows={5}
        style={{width:"100%",padding:"10px 12px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:12,color:"var(--text)",fontFamily:"var(--font)",fontSize:13,outline:"none",resize:"vertical",marginBottom:14}}/>
      <button onClick={handleSend} disabled={loading||!title.trim()||!body.trim()}
        style={{width:"100%",background:"linear-gradient(135deg,var(--accent),var(--accent-2))",border:"none",borderRadius:12,padding:"13px",color:"#fff",fontFamily:"var(--font)",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 0 16px var(--glow-purple)"}}>
        {loading?"Sending to all users…":"📣 Send to All Users"}
      </button>
      <p style={{fontSize:11,color:"var(--text-3)",textAlign:"center",marginTop:10}}>Sends a notification to every user on Nexus</p>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────
export default function SuperOwnerDashboard({ onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({users:0,posts:0,stories:0,badges:0,wallets:0,notifs:0});

  // Mark this uid as owner so coins show unlimited
  useEffect(() => {
    if (user?.uid) localStorage.setItem(OWNER_UID_KEY, user.uid);
  }, [user]);

  useEffect(() => {
    const fetch = async () => {
      const [users,posts,stories,badges,coins,notifs] = await Promise.all([
        getDocs(query(collection(db,"users"),limit(1000))),
        getDocs(query(collection(db,"posts"),limit(1000))),
        getDocs(query(collection(db,"stories"),limit(1000))),
        getDocs(query(collection(db,"badges"),limit(1000))),
        getDocs(query(collection(db,"coins"),limit(1000))),
        getDocs(query(collection(db,"notifications"),limit(1000))),
      ]);
      setStats({
        users:users.size,posts:posts.size,stories:stories.size,
        badges:badges.docs.reduce((a,d)=>a+(d.data().list?.length||0),0),
        wallets:coins.size,notifs:notifs.size,
      });
    };
    fetch();
  }, []);

  return createPortal(
    <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,.9)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{
        background:"var(--bg-1)",border:"1.5px solid var(--border-2)",
        borderRadius:24,width:"100%",maxWidth:860,
        height:"min(700px,94vh)",display:"flex",flexDirection:"column",
        overflow:"hidden",
        boxShadow:"0 0 80px var(--glow-purple),0 32px 80px rgba(0,0,0,.9)",
        animation:"modal-enter .25s cubic-bezier(.16,1,.3,1)",
      }}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 22px",borderBottom:"1px solid var(--border)",flexShrink:0,background:"linear-gradient(90deg,rgba(124,58,237,.15),rgba(6,182,212,.08))"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,var(--accent),var(--accent-2))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 0 16px var(--glow-purple)"}}>⚡</div>
            <div>
              <h2 style={{fontSize:16,fontWeight:800,letterSpacing:"-.02em"}}>Super Owner Dashboard</h2>
              <p style={{fontSize:11,color:"var(--text-3)"}}>Full admin access · Nexus v2.0</p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{background:"rgba(34,197,94,.12)",border:"1px solid rgba(34,197,94,.3)",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700,color:"var(--green)"}}>● OWNER</div>
            <button className="icon-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:2,padding:"8px 14px",borderBottom:"1px solid var(--border)",flexShrink:0,overflowX:"auto"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",border:"none",borderRadius:10,cursor:"pointer",background:tab===t.id?"var(--accent)":"transparent",color:tab===t.id?"#fff":"var(--text-3)",fontFamily:"var(--font)",fontSize:12,fontWeight:700,transition:"all .15s",flexShrink:0,boxShadow:tab===t.id?"0 0 12px var(--glow-purple)":"none"}}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",minHeight:0}}>
          {tab==="overview"  && <OverviewTab stats={stats} ownerUid={user?.uid} />}
          {tab==="users"     && <UsersTab />}
          {tab==="badges"    && <BadgesTab />}
          {tab==="coins"     && <CoinsTab />}
          {tab==="broadcast" && <BroadcastTab />}
        </div>
      </div>
    </div>,
    document.body
  );
}
