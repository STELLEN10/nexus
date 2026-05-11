 // src/components/owner/SuperOwnerDashboard.js
 import { useState, useEffect } from "react";
 import { createPortal } from "react-dom";
 import {
   collection, getDocs, doc, updateDoc, deleteDoc,
   query, orderBy, limit, getDoc, setDoc, addDoc,
-  serverTimestamp, where, onSnapshot
+  serverTimestamp
 } from "firebase/firestore";
 import { db } from "../../firebase";
 import { awardBadge, BADGES } from "../../hooks/useBadgeSystem";
 
 // ── Tabs ──────────────────────────────────────────────────────
+
+const sortUsersByDisplayName = users =>
+  [...users].sort((a, b) =>
+    (a.displayName || a.username || "").localeCompare(
+      b.displayName || b.username || "",
+      undefined,
+      { sensitivity: "base" }
+    )
+  );
+
+const usersFromSnapshot = snap =>
+  sortUsersByDisplayName(snap.docs.map(d => ({ id: d.id, ...d.data() })));
+
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
 
@@ -246,52 +259,53 @@ function UsersTab() {
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
-    getDocs(query(collection(db,"users"),orderBy("displayName"),limit(100)))
-      .then(snap => setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))));
+    getDocs(query(collection(db,"users"),limit(100)))
+      .then(snap => setUsers(usersFromSnapshot(snap)))
+      .catch(err => setMsg("Error loading users: " + err.message));
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
@@ -378,60 +392,61 @@ function BadgesTab() {
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
-  const [users, setUsers] = React.useState([]);
-  const [selUser, setSelUser] = React.useState("");
-  const [amount, setAmount] = React.useState(100);
-  const [reason, setReason] = React.useState("");
-  const [loading, setLoading] = React.useState(false);
-  const [msg, setMsg] = React.useState("");
+  const [users, setUsers] = useState([]);
+  const [selUser, setSelUser] = useState("");
+  const [amount, setAmount] = useState(100);
+  const [reason, setReason] = useState("");
+  const [loading, setLoading] = useState(false);
+  const [msg, setMsg] = useState("");
  
-  React.useEffect(() => {
-    getDocs(query(collection(db, "users"), orderBy("displayName"), limit(100)))
-      .then(snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
+  useEffect(() => {
+    getDocs(query(collection(db, "users"), limit(100)))
+      .then(snap => setUsers(usersFromSnapshot(snap)))
+      .catch(err => setMsg("Error loading users: " + err.message));
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
