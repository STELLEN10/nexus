import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import NexusLogo from "../shared/NexusLogo";
import SuperOwnerDashboard from "../owner/SuperOwnerDashboard";
import AppIcon from "../shared/AppIcon";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { db } from "../../firebase";
import {
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";

const SECTIONS = [
  { id: "account", icon: "account", label: "Account" },
  { id: "appearance", icon: "palette", label: "Appearance" },
  { id: "notifications", icon: "bell", label: "Notifications" },
  { id: "privacy", icon: "shield", label: "Privacy & Safety" },
  { id: "help", icon: "help", label: "Help & Support" },
  { id: "legal", icon: "document", label: "Terms & Legal" },
  { id: "about", icon: "star", label: "About Nexus" },
  { id: "owner", icon: "crown", label: "Owner" },
];

const DEFAULT_PREFS = {
  directMessages: true,
  newFollowers: true,
  likesReactions: false,
  notificationSounds: true,
  privateProfile: false,
  discoverable: true,
  allowDms: true,
  readReceipts: true,
  debugMode: false,
  globalLock: false,
};

const LEGAL_DOCS = {
  terms: {
    title: "Terms of Service",
    body: "Nexus is a social experience for chat, stories, posts, coins, and badges. Use the app respectfully, protect your account, and do not abuse platform systems or other users.",
  },
  privacy: {
    title: "Privacy Policy",
    body: "Nexus stores account details, content, messages, preferences, wallet balances, badges, and notifications in Firebase services so the app can work across devices.",
  },
  cookies: {
    title: "Cookie Policy",
    body: "Nexus uses local storage for theme, onboarding, owner access, and preference state. Firebase Auth may also keep session data in the browser.",
  },
};

const FEATURES = [
  ["book", "Stories", "24-hour photo and text stories"],
  ["mail", "Group DMs", "Conversations with multiple people"],
  ["badge", "Badges", "Earn rewards and profile status"],
  ["coin", "Coins", "Tip creators with in-app coins"],
  ["palette", "Custom themes", "Accent colors plus light and dark modes"],
  ["broadcast", "Notifications", "Realtime follows, tips, and broadcasts"],
];

function useStoredPrefs() {
  const [prefs, setPrefs] = useState(() => {
    try {
      return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem("nexus_settings") || "{}") };
    } catch {
      return DEFAULT_PREFS;
    }
  });

  const setPref = useCallback((key, value) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("nexus_settings", JSON.stringify(next));
      return next;
    });
  }, []);

  return [prefs, setPref];
}

function Divider({ label }) {
  return (
    <div style={{ padding:"20px 24px 8px", display:"flex", alignItems:"center", gap:10 }}>
      <span style={{ fontSize:10, fontWeight:800, letterSpacing:".1em", textTransform:"uppercase", color:"var(--text-3)", whiteSpace:"nowrap" }}>{label}</span>
      <div style={{ flex:1, height:1, background:"var(--border)" }} />
    </div>
  );
}

function Row({ icon, label, desc, right, danger }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"12px 24px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:0 }}>
        <div style={{
          width:32, height:32, borderRadius:"var(--r-md)", flexShrink:0,
          background: danger ? "rgba(239,68,68,.08)" : "var(--bg-2)",
          border: `1.5px solid ${danger ? "rgba(239,68,68,.18)" : "var(--border)"}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          color: danger ? "var(--red)" : "var(--text-2)",
        }}>
          <AppIcon name={icon} size={16} />
        </div>
        <div style={{ minWidth:0 }}>
          <span style={{ display:"block", fontSize:13, fontWeight:700, color:danger?"var(--red)":"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{label}</span>
          {desc && <span style={{ display:"block", fontSize:11, color:"var(--text-3)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{desc}</span>}
        </div>
      </div>
      {right}
    </div>
  );
}

function Badge({ children }) {
  return <span style={{ fontSize:10, fontWeight:800, padding:"2px 6px", borderRadius:4, background:"var(--bg-2)", border:"1px solid var(--border)", color:"var(--text-3)", textTransform:"uppercase" }}>{children}</span>;
}

function Toggle({ active, onClick }) {
  return (
    <button onClick={onClick} aria-pressed={active} style={{ width:38, height:20, borderRadius:20, background:active?"var(--accent-2)":"var(--bg-3)", border:"1px solid var(--border)", position:"relative", cursor:"pointer", transition:"all .2s" }}>
      <span style={{ width:14, height:14, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:active?20:2, transition:"all .2s", boxShadow:"0 1px 4px rgba(0,0,0,.25)" }} />
    </button>
  );
}

function Panel({ title, body, onClose }) {
  if (!title) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,.72)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"var(--bg-1)",border:"1.5px solid var(--border-2)",borderRadius:"var(--r-lg)",width:"min(480px,100%)",boxShadow:"0 24px 60px rgba(0,0,0,.65)",padding:22}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:12}}>
          <h3 style={{fontSize:17,fontWeight:800}}>{title}</h3>
          <button className="icon-btn" onClick={onClose}><AppIcon name="close" size={16} /></button>
        </div>
        <p style={{fontSize:13,color:"var(--text-2)",lineHeight:1.7}}>{body}</p>
      </div>
    </div>
  );
}

function AccountSection({ profile, setPanel }) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [status, setStatus] = useState("");

  const handleUpdateEmail = async () => {
    try {
      setStatus("Updating email...");
      await updateEmail(user, email);
      setStatus("Email updated.");
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  };

  const handlePassword = async () => {
    const next = window.prompt("Enter a new password with at least 6 characters:");
    if (!next) return;
    try {
      await updatePassword(user, next);
      setStatus("Password updated.");
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your Nexus account permanently?")) return;
    const password = window.prompt("Confirm your current password to delete this account:");
    if (!password) return;
    try {
      const cred = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, cred);
      await deleteUser(user);
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  };

  return (
    <>
      <Divider label="Profile Info" />
      <Row icon="account" label="Display Name" desc={profile?.displayName || "Not set"} right={<Badge>Public</Badge>} />
      <Row icon="account" label="Username" desc={`@${profile?.username || "unknown"}`} right={<Badge>Unique</Badge>} />
      <Divider label="Email Address" />
      <div style={{ padding:"0 24px 12px" }}>
        <div style={{ display:"flex", gap:8 }}>
          <input value={email} onChange={e=>setEmail(e.target.value)} style={{ flex:1, padding:"8px 12px", background:"var(--bg-2)", border:"1.5px solid var(--border)", borderRadius:"var(--r-md)", color:"var(--text)", fontSize:13 }} />
          <button className="btn-primary-sm" onClick={handleUpdateEmail}>Update</button>
        </div>
        {status && <p style={{ fontSize:11, marginTop:8, color:status.startsWith("Error")?"var(--red)":"var(--accent-2)" }}>{status}</p>}
      </div>
      <Divider label="Security" />
      <Row icon="key" label="Password" desc="Change your login password" right={<button className="btn-primary-sm" onClick={handlePassword}>Change</button>} />
      <Row icon="trash" label="Delete Account" desc="Permanently remove all data" danger right={<button className="btn-danger-sm" onClick={handleDelete}>Delete</button>} />
      <Divider label="Account Help" />
      <Row icon="help" label="Security note" desc="Email, password, and delete may require recent login" right={<button className="btn-primary-sm" onClick={() => setPanel({title:"Recent Login Required", body:"Firebase may ask you to sign in again before sensitive account changes. If an action fails, log out, log back in, and try again."})}>View</button>} />
    </>
  );
}

function AppearanceSection() {
  const { theme, setTheme, themes, colorTheme } = useTheme();
  return (
    <>
      <Divider label="Theme Mode" />
      <Row icon="sun" label="Light Mode" desc="Standard bright interface" right={<Toggle active={theme.id==="light"} onClick={()=>setTheme("light")} />} />
      <Row icon="moon" label="Dark Mode" desc="Easy on the eyes" right={<Toggle active={theme.id==="dark"} onClick={()=>setTheme("dark")} />} />
      <Row icon="moon" label="Midnight" desc="True black OLED theme" right={<Toggle active={theme.id==="midnight"} onClick={()=>setTheme("midnight")} />} />
      <Divider label="Accent Color" />
      <div style={{ padding:"8px 24px 20px", display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8 }}>
        {Object.entries(themes).filter(([id])=>!["light","dark","midnight"].includes(id)).map(([id, t]) => (
          <button key={id} onClick={()=>setTheme(id)} style={{
            padding:"10px", background:colorTheme===id?"var(--accent-bg)":"var(--bg-2)",
            border:`1.5px solid ${colorTheme===id?"var(--accent-2)":"var(--border)"}`,
            borderRadius:"var(--r-md)", display:"flex", alignItems:"center", gap:8, cursor:"pointer",
            color:colorTheme===id?"var(--accent-2)":"var(--text-2)", fontFamily:"var(--font)",
          }}>
            <span style={{ width:12, height:12, borderRadius:"50%", background:t.colors.accent }} />
            <span style={{ fontSize:12, fontWeight:700 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function NotificationsSection({ prefs, setPref }) {
  return (
    <>
      <Divider label="Push Notifications" />
      <Row icon="mail" label="Direct Messages" desc="Alerts for new private chats" right={<Toggle active={prefs.directMessages} onClick={()=>setPref("directMessages", !prefs.directMessages)} />} />
      <Row icon="users" label="New Followers" desc="When someone follows you" right={<Toggle active={prefs.newFollowers} onClick={()=>setPref("newFollowers", !prefs.newFollowers)} />} />
      <Row icon="heart" label="Likes & Reactions" desc="Activity on your posts" right={<Toggle active={prefs.likesReactions} onClick={()=>setPref("likesReactions", !prefs.likesReactions)} />} />
      <Divider label="Sound" />
      <Row icon="volume" label="Notification Sounds" desc="Play a chime for alerts" right={<Toggle active={prefs.notificationSounds} onClick={()=>setPref("notificationSounds", !prefs.notificationSounds)} />} />
    </>
  );
}

function PrivacySection({ prefs, setPref }) {
  return (
    <>
      <Divider label="Visibility" />
      <Row icon="shield" label="Private Profile" desc="Only followers can see posts" right={<Toggle active={prefs.privateProfile} onClick={()=>setPref("privateProfile", !prefs.privateProfile)} />} />
      <Row icon="search" label="Discoverability" desc="Appear in search results" right={<Toggle active={prefs.discoverable} onClick={()=>setPref("discoverable", !prefs.discoverable)} />} />
      <Divider label="Messaging" />
      <Row icon="mail" label="Direct Messages" desc="Allow DMs from everyone" right={<Toggle active={prefs.allowDms} onClick={()=>setPref("allowDms", !prefs.allowDms)} />} />
      <Row icon="chevrons" label="Read Receipts" desc="Show when you've seen messages" right={<Toggle active={prefs.readReceipts} onClick={()=>setPref("readReceipts", !prefs.readReceipts)} />} />
    </>
  );
}

function HelpSection({ setPanel }) {
  return (
    <>
      <Divider label="Support" />
      <Row icon="help" label="Help Center" desc="Browse guides and FAQs" right={<button className="btn-primary-sm" onClick={()=>setPanel({title:"Help Center", body:"For now, use the settings tabs for account, privacy, appearance, notifications, coins, and owner tools. More support pages can be added here."})}>Visit</button>} />
      <Row icon="bug" label="Report a Bug" desc="Help us improve Nexus" right={<button className="btn-primary-sm" onClick={()=>setPanel({title:"Report a Bug", body:"Send the issue, screenshots, browser, and steps to reproduce to the Nexus owner or project maintainer."})}>Report</button>} />
      <Divider label="Community" />
      <Row icon="users" label="Community Guidelines" desc="Our rules and standards" right={<button className="btn-primary-sm" onClick={()=>setPanel({title:"Community Guidelines", body:"Be respectful, avoid spam, protect privacy, and do not harass, impersonate, or abuse platform features."})}>Read</button>} />
    </>
  );
}

function LegalSection({ setPanel }) {
  return (
    <>
      <Divider label="Documents" />
      <Row icon="document" label="Terms of Service" desc="Last updated: Jan 2024" right={<button className="btn-primary-sm" onClick={()=>setPanel(LEGAL_DOCS.terms)}>View</button>} />
      <Row icon="shield" label="Privacy Policy" desc="How we handle your data" right={<button className="btn-primary-sm" onClick={()=>setPanel(LEGAL_DOCS.privacy)}>View</button>} />
      <Row icon="scale" label="Cookie Policy" desc="Use of local storage" right={<button className="btn-primary-sm" onClick={()=>setPanel(LEGAL_DOCS.cookies)}>View</button>} />
    </>
  );
}

function AboutSection() {
  return (
    <>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"28px 24px 20px", borderBottom:"1px solid var(--border)", gap:6 }}>
        <div style={{ marginBottom:6, filter:"drop-shadow(0 0 20px var(--glow-purple)) drop-shadow(0 0 40px var(--glow-cyan))" }}><NexusLogo size={88} /></div>
        <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:"-.03em", background:"linear-gradient(135deg, var(--accent-2), var(--cyan))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Nexus</h2>
        <p style={{ fontSize:13, color:"var(--text-3)" }}>Chat - Share - Connect</p>
        <span style={{ fontSize:11, color:"var(--text-3)", fontFamily:"var(--mono)" }}>Version 2.0.0</span>
      </div>
      <Divider label="Build info" />
      <Row icon="rocket" label="Version" desc="Current stable release" right={<Badge>v2.0.0</Badge>} />
      <Row icon="document" label="Stack" desc="React 18 - Firebase 10 - date-fns" right={<Badge>Web</Badge>} />
      <Divider label="What's in v2" />
      {FEATURES.map(([icon, label, desc]) => <Row key={label} icon={icon} label={label} desc={desc} />)}
    </>
  );
}

function OwnerSection({ prefs, setPref, setPanel }) {
  const [pass, setPass] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [showSuperDash, setShowSuperDash] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "config", "global")).then(snap => {
      if (snap.exists()) setPref("globalLock", Boolean(snap.data().registrationLocked));
    });
  }, [setPref]);

  const handleAuth = (e) => {
    e.preventDefault();
    if (pass === "STELLEN@10") {
      setAuthed(true);
      setError("");
    } else {
      setError("Invalid owner password.");
    }
  };

  const toggleGlobalLock = async () => {
    const next = !prefs.globalLock;
    setPref("globalLock", next);
    await setDoc(doc(db, "config", "global"), { registrationLocked: next, updatedAt: serverTimestamp() }, { merge: true });
  };

  if (!authed) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ width:58,height:58,borderRadius:18,margin:"0 auto 20px",background:"var(--accent-bg)",border:"1.5px solid var(--accent-bd)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--accent-2)" }}><AppIcon name="lock" size={30} /></div>
        <h3 style={{ marginBottom: 8 }}>Owner Access</h3>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 24 }}>Enter your master password to access owner permissions.</p>
        <form onSubmit={handleAuth} style={{ maxWidth: 280, margin: "0 auto" }}>
          <input type="password" placeholder="Master Password" value={pass} onChange={e => setPass(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", background: "var(--bg-2)", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text)", marginBottom: 12 }}
            autoFocus />
          {error && <p style={{ color: "var(--red)", fontSize: 12, marginBottom: 12 }}>{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: "100%" }}>Unlock</button>
        </form>
      </div>
    );
  }

  return (
    <>
      <Divider label="Owner Dashboard" />
      <div style={{ padding: "0 24px 24px" }}>
        <div style={{ background: "var(--accent-bg)", border: "1.5px solid var(--accent-bd)", borderRadius: "var(--r-lg)", padding: 18, marginBottom: 16 }}>
          <h4 style={{ color: "var(--accent-2)", marginBottom: 8 }}>Welcome, Owner</h4>
          <p style={{ fontSize: 13, color: "var(--text-2)" }}>You have full access to Nexus administrative tools.</p>
        </div>
        <button className="btn-primary" style={{ width: "100%", padding: "16px", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={() => setShowSuperDash(true)}>
          <AppIcon name="crown" size={17} /> Open Super Owner Dashboard
        </button>
        <Divider label="Quick Actions" />
        <Row icon="bug" label="Debug Mode" desc="Enable advanced logging" right={<Toggle active={prefs.debugMode} onClick={()=>setPref("debugMode", !prefs.debugMode)} />} />
        <Row icon="shield" label="Global Lock" desc="Restrict new registrations" right={<Toggle active={prefs.globalLock} onClick={toggleGlobalLock} />} />
        <Row icon="mail" label="System Broadcast" desc="Send notification to all users" right={<button className="btn-primary-sm" onClick={() => setShowSuperDash(true)}>Compose</button>} />
        <Row icon="help" label="Owner notes" desc="Quick actions sync with the owner dashboard" right={<button className="btn-primary-sm" onClick={()=>setPanel({title:"Owner Tools", body:"Use the Super Owner Dashboard to manage users, awards, coins, broadcasts, registrations, reports, and exports."})}>View</button>} />
      </div>
      {showSuperDash && <SuperOwnerDashboard onClose={() => setShowSuperDash(false)} />}
    </>
  );
}

export default function SettingsModal({ onClose }) {
  const { profile } = useAuth();
  const [active, setActive] = useState("account");
  const [prefs, setPref] = useStoredPrefs();
  const [panel, setPanel] = useState(null);

  const content = {
    account: <AccountSection profile={profile} setPanel={setPanel} />,
    appearance: <AppearanceSection />,
    notifications: <NotificationsSection prefs={prefs} setPref={setPref} />,
    privacy: <PrivacySection prefs={prefs} setPref={setPref} />,
    help: <HelpSection setPanel={setPanel} />,
    legal: <LegalSection setPanel={setPanel} />,
    about: <AboutSection />,
    owner: <OwnerSection prefs={prefs} setPref={setPref} setPanel={setPanel} />,
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.82)", backdropFilter:"blur(6px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ display:"flex", width:"100%", maxWidth:860, height:"min(660px, 92vh)", background:"var(--bg-1)", border:"1.5px solid var(--border-2)", borderRadius:"var(--r-xl)", overflow:"hidden", boxShadow:"0 0 60px var(--glow-purple), 0 32px 80px rgba(0,0,0,.85)", animation:"settings-enter .22s cubic-bezier(.16,1,.3,1)" }}>
        <aside style={{ width:220, flexShrink:0, background:"var(--bg)", borderRight:"1px solid var(--border-2)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 16px 12px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
            <span style={{ fontSize:15, fontWeight:800, letterSpacing:"-.02em" }}>Settings</span>
            <button className="icon-btn" onClick={onClose}><AppIcon name="close" size={16} /></button>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", overflow:"hidden", flexShrink:0, background:"var(--accent-bg)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 10px var(--glow-purple)" }}>
              {profile?.avatar ? <img src={profile.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <span style={{ fontSize:13, fontWeight:800, color:"var(--accent-2)" }}>{(profile?.displayName||"?").slice(0,2).toUpperCase()}</span>}
            </div>
            <div style={{ minWidth:0 }}>
              <span style={{ display:"block", fontSize:13, fontWeight:800, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{profile?.displayName}</span>
              <span style={{ fontSize:11, color:"var(--text-3)" }}>@{profile?.username}</span>
            </div>
          </div>
          <nav style={{ flex:1, overflowY:"auto", padding:8 }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"9px 10px", background:active===s.id?"var(--accent-bg)":"transparent", border:"none", borderRadius:"var(--r-md)", color:active===s.id?"var(--accent-2)":"var(--text-2)", fontFamily:"var(--font)", fontSize:13, fontWeight:700, cursor:"pointer", textAlign:"left", marginBottom:2, transition:"all .12s", boxShadow:active===s.id?"0 0 10px var(--glow-purple)":"none" }}>
                <span style={{ width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><AppIcon name={s.icon} size={16} /></span>
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </aside>
        <main style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
          <div style={{ padding:"18px 24px 14px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
            <h2 style={{ fontSize:17, fontWeight:800, letterSpacing:"-.02em" }}>{SECTIONS.find(s => s.id === active)?.label}</h2>
          </div>
          <div style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>{content[active]}</div>
        </main>
      </div>
      <Panel title={panel?.title} body={panel?.body} onClose={() => setPanel(null)} />
    </div>
  );
}
