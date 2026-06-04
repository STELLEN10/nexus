import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase";
import { awardBadge, BADGES } from "../../hooks/useBadgeSystem";
import { giveCoinsToUser, OWNER_BALANCE, OWNER_UID_KEY } from "../../hooks/useCoins";
import { useAuth } from "../../context/AuthContext";
import AppIcon from "../shared/AppIcon";

const TABS = [
  { id:"overview", icon:"analytics", label:"Overview" },
  { id:"users", icon:"users", label:"Users" },
  { id:"badges", icon:"badge", label:"Award Badges" },
  { id:"coins", icon:"coin", label:"Coins" },
  { id:"broadcast", icon:"broadcast", label:"Broadcast" },
];

function Notice({ msg }) {
  if (!msg) return null;
  const ok = !msg.startsWith("Error");
  return (
    <div style={{
      background: ok ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)",
      border: `1px solid ${ok ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.25)"}`,
      borderRadius:10,padding:"9px 14px",fontSize:12,
      color: ok ? "var(--green)" : "var(--red)",marginBottom:14,
    }}>{msg}</div>
  );
}

function StatCard({ icon, label, value, color="#7c3aed" }) {
  return (
    <div style={{background:"var(--bg-2)",border:`1.5px solid ${color}33`,borderRadius:12,padding:"16px 18px",boxShadow:`0 0 16px ${color}18`}}>
      <div style={{color,marginBottom:9}}><AppIcon name={icon} size={25} /></div>
      <div style={{fontSize:24,fontWeight:800,color,marginBottom:2}}>{value}</div>
      <div style={{fontSize:12,color:"var(--text-2)",fontWeight:700}}>{label}</div>
    </div>
  );
}

function QuickButton({ icon, label, desc, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        display:"flex",alignItems:"center",gap:11,padding:"13px 14px",
        background:"var(--bg-3)",border:"1.5px solid var(--border)",borderRadius:10,
        color:"var(--text)",cursor:disabled?"wait":"pointer",textAlign:"left",width:"100%",
        opacity:disabled ? .8 : 1,
      }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent-bd)";e.currentTarget.style.background="var(--accent-bg)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="var(--bg-3)";}}
    >
      <span style={{color:"var(--accent-2)",flexShrink:0}}><AppIcon name={icon} size={21} /></span>
      <span style={{minWidth:0}}>
        <span style={{fontSize:12,fontWeight:800,display:"block"}}>{label}</span>
        <span style={{fontSize:10,color:"var(--text-3)",display:"block"}}>{desc}</span>
      </span>
    </button>
  );
}

function OverviewTab({ stats, ownerUid }) {
  const [lockReg, setLockReg] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "config", "global")).then(snap => {
      if (snap.exists()) setLockReg(Boolean(snap.data().registrationLocked));
    });
  }, []);

  const flash = text => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3500);
  };

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); } catch (e) { flash("Error: " + e.message); }
    setBusy(false);
  };

  const handleLockReg = () => run(async () => {
    const next = !lockReg;
    await setDoc(doc(db, "config", "global"), { registrationLocked: next, updatedAt: serverTimestamp() }, { merge: true });
    setLockReg(next);
    flash(next ? "New registrations locked." : "Registrations reopened.");
  });

  const handleClearReports = () => run(async () => {
    const snap = await getDocs(collection(db, "reports"));
    if (snap.empty) {
      flash("No reports to clear.");
      return;
    }
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { resolved: true, resolvedAt: serverTimestamp() }));
    await batch.commit();
    flash("All reports marked resolved.");
  });

  const handleBroadcast = () => run(async () => {
    const text = window.prompt("Enter broadcast message to all users:");
    if (!text?.trim()) return;
    const users = await getDocs(collection(db, "users"));
    await Promise.all(users.docs.map(d =>
      addDoc(collection(db, "notifications"), {
        type:"broadcast", fromUid:"system", fromUsername:"Nexus",
        toUid:d.id, message:text.trim(), read:false, createdAt:serverTimestamp(),
      })
    ));
    flash(`Broadcast sent to ${users.size} users.`);
  });

  const handleExport = async () => {
    const snap = await getDocs(query(collection(db,"users"),orderBy("createdAt","desc")));
    const rows = [["Username","Display Name","Email","Followers","Following","Joined"]];
    snap.docs.forEach(d => {
      const u = d.data();
      rows.push([u.username||"",u.displayName||"",u.email||"",u.followersCount||0,u.followingCount||0,u.createdAt?.toDate ? u.createdAt.toDate().toISOString() : ""]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexus_users.csv";
    a.click();
    URL.revokeObjectURL(url);
    flash("CSV downloaded.");
  };

  const handleRefillOwner = () => run(async () => {
    if (!ownerUid) throw new Error("Owner user not loaded.");
    await setDoc(doc(db,"coins",ownerUid), { balance:OWNER_BALANCE, uid:ownerUid, updatedAt:serverTimestamp() }, { merge:true });
    flash("Owner wallet set to unlimited.");
  });

  return (
    <div style={{padding:20}}>
      <Notice msg={msg} />
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard icon="users" label="Total Users" value={stats.users} color="#7c3aed"/>
        <StatCard icon="edit" label="Total Posts" value={stats.posts} color="#06b6d4"/>
        <StatCard icon="book" label="Stories Posted" value={stats.stories} color="#8b5cf6"/>
        <StatCard icon="coin" label="Coins in System" value={stats.coins} color="#f59e0b"/>
        <StatCard icon="badge" label="Badges Awarded" value={stats.badges} color="#22c55e"/>
        <StatCard icon="bell" label="Notifications" value={stats.notifs} color="#ec4899"/>
      </div>
      <div style={{background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:12,padding:18}}>
        <h3 style={{fontSize:13,fontWeight:800,marginBottom:14,color:"var(--accent-2)",display:"flex",alignItems:"center",gap:8}}>
          <AppIcon name="star" size={15} /> Owner Quick Actions
        </h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <QuickButton icon={lockReg ? "unlock" : "lock"} label={lockReg ? "Unlock Registrations" : "Lock Registrations"} desc="Control new signups" onClick={handleLockReg} disabled={busy}/>
          <QuickButton icon="broadcast" label="Global Broadcast" desc="Message all users" onClick={handleBroadcast} disabled={busy}/>
          <QuickButton icon="trash" label="Clear Reports" desc="Mark all resolved" onClick={handleClearReports} disabled={busy}/>
          <QuickButton icon="download" label="Export User CSV" desc="Download user data" onClick={handleExport} disabled={busy}/>
          <QuickButton icon="coin" label="Refill Owner Wallet" desc="Restore unlimited balance" onClick={handleRefillOwner} disabled={busy}/>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getDocs(query(collection(db,"users"),orderBy("createdAt","desc"),limit(200)))
      .then(snap => setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))))
      .finally(() => setLoading(false));
  }, []);

  const flash = text => {
    setMsg(text);
    setTimeout(()=>setMsg(""),4000);
  };

  const doAction = async (uid, act) => {
    try {
      if (act === "ban" || act === "unban") {
        const banned = act === "ban";
        await updateDoc(doc(db,"users",uid),{banned});
        setUsers(p=>p.map(u=>u.id===uid?{...u,banned}:u));
        flash(banned ? "User banned." : "User unbanned.");
      } else if (["verified","founder","og","legend"].includes(act)) {
        await awardBadge(uid, act);
        flash(`${BADGES[act].label} badge awarded.`);
      } else if (act === "give100" || act === "give500") {
        const amount = act === "give100" ? 100 : 500;
        await giveCoinsToUser(uid, amount, "Nexus Owner", "Owner gift");
        flash(`${amount} coins sent.`);
      } else if (act === "delete") {
        if (!window.confirm("Delete this user's profile permanently?")) return;
        await deleteDoc(doc(db,"users",uid));
        setUsers(p=>p.filter(u=>u.id!==uid));
        setSelected(null);
        flash("User deleted.");
      }
    } catch(e) {
      flash("Error: " + e.message);
    }
  };

  const filtered = users.filter(u =>
    !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.displayName?.toLowerCase().includes(search.toLowerCase())
  );
  const sel = selected ? users.find(u=>u.id===selected) : null;

  return (
    <div style={{display:"flex",height:"100%",minHeight:0}}>
      <div style={{width:250,flexShrink:0,borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"10px 12px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",padding:"7px 10px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:10,color:"var(--text)",fontFamily:"var(--font)",fontSize:12,outline:"none"}}/>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {loading ? <div style={{display:"flex",justifyContent:"center",padding:20}}><div className="spinner"/></div>
          : filtered.map(u=>(
            <button key={u.id} onClick={()=>setSelected(u.id)}
              style={{
                display:"flex",alignItems:"center",gap:8,padding:"9px 12px",width:"100%",
                cursor:"pointer",border:"none",borderBottom:"1px solid var(--border)",color:"var(--text)",
                background:selected===u.id?"var(--accent-bg)":"transparent",textAlign:"left",fontFamily:"var(--font)",
              }}>
              <div style={{width:30,height:30,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:"var(--bg-3)",border:`2px solid ${u.banned?"var(--red)":"var(--border)"}`}}>
                {u.avatar ? <img src={u.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"var(--accent-2)"}}>{(u.displayName||"?").slice(0,2).toUpperCase()}</div>}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:12,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.displayName}</div>
                <div style={{fontSize:10,color:"var(--text-3)"}}>@{u.username}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:18}}>
        {!sel ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--text-3)",gap:8}}>
            <AppIcon name="account" size={32} /><p style={{fontSize:13}}>Select a user</p>
          </div>
        ) : (
          <>
            <Notice msg={msg} />
            <div style={{display:"flex",alignItems:"center",gap:12,padding:14,background:"var(--bg-2)",borderRadius:12,border:"1.5px solid var(--border)",marginBottom:16}}>
              <div style={{width:50,height:50,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:"var(--bg-3)"}}>
                {sel.avatar ? <img src={sel.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"var(--accent-2)"}}>{(sel.displayName||"?").slice(0,2).toUpperCase()}</div>}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800}}>{sel.displayName}</div>
                <div style={{fontSize:12,color:"var(--text-3)"}}>@{sel.username} - {sel.email}</div>
                <div style={{fontSize:11,color:"var(--text-3)",marginTop:2}}>{sel.followersCount||0} followers - UID: {sel.id?.slice(0,12)}...</div>
              </div>
            </div>
            <div style={{fontSize:11,fontWeight:800,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Actions</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {[
                {label:"Verify", icon:"check", color:"#06b6d4", act:"verified"},
                {label:"Founder", icon:"crown", color:"#a855f7", act:"founder"},
                {label:"OG", icon:"rocket", color:"#ef4444", act:"og"},
                {label:"Legend", icon:"star", color:"#eab308", act:"legend"},
                {label:"+100", icon:"coin", color:"#f59e0b", act:"give100"},
                {label:"+500", icon:"coin", color:"#f59e0b", act:"give500"},
                {label:sel.banned ? "Unban" : "Ban", icon:sel.banned ? "check" : "warning", color:sel.banned?"#22c55e":"#ef4444", act:sel.banned?"unban":"ban"},
                {label:"Delete", icon:"trash", color:"#ef4444", act:"delete"},
              ].map(a=>(
                <button key={a.act} onClick={()=>doAction(sel.id,a.act)}
                  style={{background:`${a.color}14`,border:`1.5px solid ${a.color}44`,borderRadius:10,padding:"7px 12px",color:a.color,fontFamily:"var(--font)",fontSize:12,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                  <AppIcon name={a.icon} size={14} /> {a.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
  const selUserObj = users.find(u=>u.id===selUser);

  const handleAward = async () => {
    if (!selUser || !selBadge) { setMsg("Select a user and badge."); return; }
    setLoading(true); setMsg("");
    try {
      await awardBadge(selUser, selBadge);
      setMsg(`${BADGES[selBadge].label} awarded and coins sent.`);
      setSelBadge("");
    } catch(e) {
      setMsg("Error: "+e.message);
    }
    setLoading(false);
    setTimeout(()=>setMsg(""),5000);
  };

  return (
    <div style={{padding:20}}>
      <Notice msg={msg} />
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Pick User</div>
          <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",padding:"8px 12px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:10,color:"var(--text)",fontFamily:"var(--font)",fontSize:12,outline:"none",marginBottom:8}}/>
          <div style={{maxHeight:240,overflowY:"auto",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:12}}>
            {filtered.map(u=>(
              <button key={u.id} onClick={()=>setSelUser(u.id)}
                style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",cursor:"pointer",border:"none",borderBottom:"1px solid var(--border)",background:selUser===u.id?"var(--accent-bg)":"transparent",color:"var(--text)",fontFamily:"var(--font)",width:"100%",textAlign:"left"}}>
                <div style={{width:26,height:26,borderRadius:"50%",overflow:"hidden",background:"var(--bg-3)",flexShrink:0}}>
                  {u.avatar ? <img src={u.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"var(--accent-2)"}}>{(u.displayName||"?").slice(0,2).toUpperCase()}</div>}
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:800}}>{u.displayName}</div>
                  <div style={{fontSize:10,color:"var(--text-3)"}}>@{u.username}</div>
                </div>
                {selUser===u.id && <AppIcon name="check" size={14} style={{color:"var(--accent-2)",marginLeft:"auto"}} />}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Pick Badge</div>
          <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:288,overflowY:"auto"}}>
            {Object.values(BADGES).map(badge=>(
              <button key={badge.id} onClick={()=>setSelBadge(badge.id)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:selBadge===badge.id?`${badge.color}18`:"var(--bg-2)",border:`1.5px solid ${selBadge===badge.id?badge.color+"66":"var(--border)"}`,borderRadius:12,cursor:"pointer",textAlign:"left",transition:"all .15s",boxShadow:selBadge===badge.id?`0 0 10px ${badge.glow}`:"none",color:"var(--text)",fontFamily:"var(--font)"}}>
                <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,background:`${badge.color}20`,border:`1.5px solid ${badge.color}44`,display:"flex",alignItems:"center",justifyContent:"center",color:badge.color}}>
                  <AppIcon name={badge.iconName} size={17} />
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:800}}>{badge.label}</div>
                  <div style={{fontSize:10,color:"var(--text-3)"}}>{badge.desc}</div>
                </div>
                <div style={{fontSize:11,color:"#f59e0b",fontWeight:800,flexShrink:0,display:"flex",alignItems:"center",gap:4}}>
                  +{badge.coinReward}<AppIcon name="coin" size={12} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      {selUser && selBadge && (
        <div style={{background:"var(--accent-bg)",border:"1.5px solid var(--accent-bd)",borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div style={{fontSize:13}}>
            Award <strong style={{color:BADGES[selBadge].color}}>{BADGES[selBadge].label}</strong> to <strong style={{color:"var(--accent-2)"}}>{selUserObj?.displayName}</strong> and add {BADGES[selBadge].coinReward} coins?
          </div>
          <button onClick={handleAward} disabled={loading}
            style={{background:"linear-gradient(135deg,var(--accent),var(--accent-2))",border:"none",borderRadius:10,padding:"10px 16px",color:"#fff",fontFamily:"var(--font)",fontSize:13,fontWeight:800,cursor:"pointer",flexShrink:0,boxShadow:"0 0 14px var(--glow-purple)",display:"flex",alignItems:"center",gap:7}}>
            <AppIcon name="badge" size={15} /> {loading ? "Awarding..." : "Award"}
          </button>
        </div>
      )}
    </div>
  );
}

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
    if (!selUser || amount < 1) { setMsg("Select user and valid amount."); return; }
    setLoading(true); setMsg("");
    try {
      await giveCoinsToUser(selUser, amount, "Nexus Owner", reason);
      const u = users.find(u=>u.id===selUser);
      setMsg(`Sent ${amount} coins to ${u?.displayName}.`);
      setAmount(100); setReason("");
    } catch(e) { setMsg("Error: "+e.message); }
    setLoading(false);
    setTimeout(()=>setMsg(""),4000);
  };

  return (
    <div style={{padding:20,maxWidth:540}}>
      <Notice msg={msg} />
      <div style={{fontSize:11,fontWeight:800,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Recipient</div>
      <select value={selUser} onChange={e=>setSelUser(e.target.value)}
        style={{width:"100%",padding:"10px 12px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:10,color:"var(--text)",fontFamily:"var(--font)",fontSize:13,outline:"none",marginBottom:14}}>
        <option value="">Select user</option>
        {users.map(u=><option key={u.id} value={u.id}>{u.displayName} (@{u.username})</option>)}
      </select>
      <div style={{fontSize:11,fontWeight:800,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Amount</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
        {[50,100,200,500,1000,5000].map(a=>(
          <button key={a} onClick={()=>setAmount(a)} style={{padding:"7px 12px",border:`1.5px solid ${amount===a?"var(--accent)":"var(--border)"}`,borderRadius:10,background:amount===a?"var(--accent-bg)":"var(--bg-2)",color:amount===a?"var(--accent-2)":"var(--text-2)",fontFamily:"var(--font)",fontSize:12,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            <AppIcon name="coin" size={13} /> {a}
          </button>
        ))}
      </div>
      <input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} min={1} max={999999}
        style={{width:"100%",padding:"10px 12px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:10,color:"var(--text)",fontFamily:"var(--font)",fontSize:13,outline:"none",marginBottom:14}}/>
      <div style={{fontSize:11,fontWeight:800,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Reason (optional)</div>
      <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Contest winner, bug bounty, gift"
        style={{width:"100%",padding:"10px 12px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:10,color:"var(--text)",fontFamily:"var(--font)",fontSize:13,outline:"none",marginBottom:14}}/>
      <button onClick={handleGive} disabled={loading||!selUser}
        style={{width:"100%",background:"linear-gradient(135deg,var(--accent),var(--accent-2))",border:"none",borderRadius:10,padding:"13px",color:"#fff",fontFamily:"var(--font)",fontSize:14,fontWeight:800,cursor:loading||!selUser?"not-allowed":"pointer",boxShadow:"0 0 16px var(--glow-purple)",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <AppIcon name="coin" size={16} /> {loading ? "Sending..." : `Send ${amount} Coins`}
      </button>
    </div>
  );
}

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
      await Promise.all(users.docs.map(d=>
        addDoc(collection(db,"notifications"),{
          type:"broadcast", fromUid:"system", fromUsername:"Nexus",
          toUid:d.id, message:body.trim(), title:title.trim(),
          notifType:type, read:false, createdAt:serverTimestamp(),
        })
      ));
      setMsg(`Broadcast sent to ${users.size} users.`);
      setTitle(""); setBody("");
    } catch(e) { setMsg("Error: "+e.message); }
    setLoading(false);
    setTimeout(()=>setMsg(""),5000);
  };

  const types = [
    {id:"info",label:"Info",icon:"broadcast",color:"#06b6d4"},
    {id:"update",label:"Update",icon:"star",color:"#a855f7"},
    {id:"warning",label:"Warning",icon:"warning",color:"#f59e0b"},
    {id:"event",label:"Event",icon:"badge",color:"#22c55e"},
  ];

  return (
    <div style={{padding:20,maxWidth:520}}>
      <Notice msg={msg} />
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {types.map(t=>(
          <button key={t.id} onClick={()=>setType(t.id)}
            style={{padding:"7px 12px",border:`1.5px solid ${type===t.id?t.color+"66":"var(--border)"}`,borderRadius:10,background:type===t.id?t.color+"15":"var(--bg-2)",color:type===t.id?t.color:"var(--text-2)",fontFamily:"var(--font)",fontSize:11,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            <AppIcon name={t.icon} size={13} /> {t.label}
          </button>
        ))}
      </div>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title e.g. New Feature Alert"
        style={{width:"100%",padding:"10px 12px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:10,color:"var(--text)",fontFamily:"var(--font)",fontSize:13,outline:"none",marginBottom:12}}/>
      <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Write your message to all users..." rows={5}
        style={{width:"100%",padding:"10px 12px",background:"var(--bg-2)",border:"1.5px solid var(--border)",borderRadius:10,color:"var(--text)",fontFamily:"var(--font)",fontSize:13,outline:"none",resize:"vertical",marginBottom:14}}/>
      <button onClick={handleSend} disabled={loading||!title.trim()||!body.trim()}
        style={{width:"100%",background:"linear-gradient(135deg,var(--accent),var(--accent-2))",border:"none",borderRadius:10,padding:"13px",color:"#fff",fontFamily:"var(--font)",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 0 16px var(--glow-purple)",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <AppIcon name="broadcast" size={16} /> {loading ? "Sending to all users..." : "Send to All Users"}
      </button>
      <p style={{fontSize:11,color:"var(--text-3)",textAlign:"center",marginTop:10}}>Sends a notification to every user on Nexus</p>
    </div>
  );
}

export default function SuperOwnerDashboard({ onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({users:0,posts:0,stories:0,badges:0,coins:"0",notifs:0});

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
      const coinTotal = coins.docs.reduce((sum,d)=>sum + Number(d.data().balance || 0), 0);
      setStats({
        users:users.size,
        posts:posts.size,
        stories:stories.size,
        badges:badges.docs.reduce((a,d)=>a+(d.data().list?.length||0),0),
        coins: coinTotal >= OWNER_BALANCE ? "Unlimited" : coinTotal.toLocaleString(),
        notifs:notifs.size,
      });
    };
    fetch();
  }, []);

  return createPortal(
    <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,.9)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"var(--bg-1)",border:"1.5px solid var(--border-2)",borderRadius:18,width:"100%",maxWidth:900,height:"min(720px,94vh)",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 0 80px var(--glow-purple),0 32px 80px rgba(0,0,0,.9)",animation:"modal-enter .25s cubic-bezier(.16,1,.3,1)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 22px",borderBottom:"1px solid var(--border)",flexShrink:0,background:"linear-gradient(90deg,rgba(124,58,237,.15),rgba(6,182,212,.08))"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,var(--accent),var(--accent-2))",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 16px var(--glow-purple)"}}>
              <AppIcon name="crown" size={20} />
            </div>
            <div>
              <h2 style={{fontSize:16,fontWeight:800,letterSpacing:"-.02em"}}>Super Owner Dashboard</h2>
              <p style={{fontSize:11,color:"var(--text-3)"}}>Full administrative access - Nexus v2.0</p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{background:"rgba(34,197,94,.12)",border:"1px solid rgba(34,197,94,.3)",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:800,color:"var(--green)",display:"flex",alignItems:"center",gap:6}}>
              <AppIcon name="check" size={12} /> OWNER ACTIVE
            </div>
            <button className="icon-btn" onClick={onClose} title="Close"><AppIcon name="close" size={16} /></button>
          </div>
        </div>

        <div style={{display:"flex",gap:2,padding:"8px 14px",borderBottom:"1px solid var(--border)",flexShrink:0,overflowX:"auto"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{display:"flex",alignItems:"center",gap:7,padding:"7px 13px",border:"none",borderRadius:10,cursor:"pointer",background:tab===t.id?"var(--accent)":"transparent",color:tab===t.id?"#fff":"var(--text-3)",fontFamily:"var(--font)",fontSize:12,fontWeight:800,transition:"all .15s",flexShrink:0,boxShadow:tab===t.id?"0 0 12px var(--glow-purple)":"none"}}>
              <AppIcon name={t.icon} size={14} /><span>{t.label}</span>
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto",minHeight:0}}>
          {tab==="overview" && <OverviewTab stats={stats} ownerUid={user?.uid} />}
          {tab==="users" && <UsersTab />}
          {tab==="badges" && <BadgesTab />}
          {tab==="coins" && <CoinsTab />}
          {tab==="broadcast" && <BroadcastTab />}
        </div>
      </div>
    </div>,
    document.body
  );
}
