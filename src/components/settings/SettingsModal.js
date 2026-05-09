// src/components/settings/SettingsModal.js  — SVG icon redesign
import { useState } from "react";
import NexusLogo from "../shared/NexusLogo";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  updatePassword, updateEmail,
  reauthenticateWithCredential, EmailAuthProvider, deleteUser
} from "firebase/auth";

// ── SVG icon library (all 20×20 viewBox) ─────────────────────
const Icon = {
  User: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Palette: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="7" cy="8" r="1.25" fill="currentColor"/>
      <circle cx="13" cy="8" r="1.25" fill="currentColor"/>
      <circle cx="7" cy="13" r="1.25" fill="currentColor"/>
      <circle cx="13" cy="13" r="1.25" fill="currentColor"/>
      <circle cx="10" cy="6" r="1.25" fill="currentColor"/>
    </svg>
  ),
  Bell: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M10 2.5a5.5 5.5 0 00-5.5 5.5c0 5.25-2 6.5-2 6.5h15s-2-1.25-2-6.5A5.5 5.5 0 0010 2.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.73 17a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Shield: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5l7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  HelpCircle: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M7.5 7.5a2.5 2.5 0 015 0c0 2-2.5 2.5-2.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="10" cy="14.5" r=".75" fill="currentColor"/>
    </svg>
  ),
  FileText: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M11.5 2H5.5A1.5 1.5 0 004 3.5v13A1.5 1.5 0 005.5 18h9a1.5 1.5 0 001.5-1.5V6.5L11.5 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M11.5 2v4.5H16M7 9h6M7 12h6M7 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Star: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M10 2l2.39 5.26L18 8.18l-4 3.9.94 5.5L10 14.77l-4.94 2.81L6 12.08 2 8.18l5.61-.92L10 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  Mail: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="4.5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Key: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <circle cx="7.5" cy="10" r="4" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M11 10h7M15 10v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M3 6h14M8 6V4h4v2M6 6l1 10h6l1-10M8 9v5M12 9v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Circle: (props) => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="4" fill={props.color || "currentColor"}/>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  CheckCheck: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M3 10l4 4 8-8M9 14l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  MessageCircle: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M17 11a7 7 0 10-6 3.5L15 17l-.5-3.5A6.97 6.97 0 0017 11z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  AtSign: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M13 10c0 3 5.5 3 5.5 0a8.5 8.5 0 10-3 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  UserPlus: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M1 17c0-3.314 3.134-6 7-6M15 9v6M12 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Heart: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M10 17s-7-4.5-7-9a4 4 0 018 0 4 4 0 018 0c0 4.5-7 9-7 9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  Volume: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M4 8H2v4h2l4 3V5L4 8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M14 6a5 5 0 010 8M11.5 8.5a2.5 2.5 0 010 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Layout: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M2 8h16M8 8v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Type: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M3 4h14M10 4v12M7 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Box: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L2 6l8 4 8-4-8-4zM2 14l8 4 8-4M2 10l8 4 8-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Bug: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M10 14a4 4 0 004-4V8a4 4 0 00-8 0v2a4 4 0 004 4z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M10 14v3M6 10H2M18 10h-4M6.5 6.5L4 4M13.5 6.5L16 4M6 14l-2 2M14 14l2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Clipboard: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M7 3H5a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.6"/>
      <rect x="7" y="2" width="6" height="3" rx="1" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Lock: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="10" cy="13" r="1.25" fill="currentColor"/>
    </svg>
  ),
  Users: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <circle cx="7.5" cy="7" r="3" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="13.5" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M1 17c0-3 2.91-5.5 6.5-5.5S14 14 14 17M13.5 12c2.5.5 4.5 2.5 4.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Scale: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M10 2v16M4 18h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M4 6L2 12h4L4 6zM16 6l-2 6h4l-2-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M4 6h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Rocket: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M10 2c3 0 6 3 6 7L10 15 4 9c0-4 3-7 6-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <circle cx="10" cy="9" r="1.5" fill="currentColor"/>
      <path d="M4 9L2 13l3-1M16 9l2 4-3-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Tool: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M13.5 3c-2.5 0-4 1.5-4 3.5L4 12a2 2 0 002.83 2.83l5.5-5.5c2 0 3.5-1.5 3.5-4A4 4 0 0013.5 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <circle cx="6.5" cy="12.5" r="1" fill="currentColor"/>
    </svg>
  ),
  Sun: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Moon: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M17 13.5A7.5 7.5 0 016.5 3a7.5 7.5 0 1010.5 10.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  MailOpen: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M2 8l8-5 8 5v7.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 15.5V8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M2 8l8 5 8-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
};

// ── Nav sections ──────────────────────────────────────────────
const SECTIONS = [
  { id: "account",       Icon: Icon.User,       label: "Account"         },
  { id: "appearance",    Icon: Icon.Palette,    label: "Appearance"      },
  { id: "notifications", Icon: Icon.Bell,       label: "Notifications"   },
  { id: "privacy",       Icon: Icon.Shield,     label: "Privacy & Safety"},
  { id: "help",          Icon: Icon.HelpCircle, label: "Help & Support"  },
  { id: "legal",         Icon: Icon.FileText,   label: "Terms & Legal"   },
  { id: "about",         Icon: Icon.Star,       label: "About Nexus"     },
];

// ── Shared layout primitives ──────────────────────────────────
function Divider({ label }) {
  return (
    <div style={{ padding:"20px 24px 8px", display:"flex", alignItems:"center", gap:10 }}>
      <span style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--text-3)", whiteSpace:"nowrap" }}>{label}</span>
      <div style={{ flex:1, height:1, background:"var(--border)" }} />
    </div>
  );
}

function Row({ icon: IconEl, label, desc, right, danger }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"12px 24px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:0 }}>
        {IconEl && (
          <div style={{
            width:32, height:32, borderRadius:"var(--r-md)", flexShrink:0,
            background: danger ? "rgba(239,68,68,.08)" : "var(--bg-2)",
            border: `1.5px solid ${danger ? "rgba(239,68,68,.18)" : "var(--border)"}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            color: danger ? "var(--red)" : "var(--text-2)",
          }}>
            <IconEl />
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:1, minWidth:0 }}>
          <span style={{ fontSize:13, fontWeight:600, color: danger ? "var(--red)" : "var(--text)" }}>{label}</span>
          {desc && <span style={{ fontSize:12, color:"var(--text-3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{desc}</span>}
        </div>
      </div>
      {right && <div style={{ flexShrink:0 }}>{right}</div>}
    </div>
  );
}

function ActionBtn({ children, danger, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: danger ? "rgba(239,68,68,.1)" : "var(--bg-2)", border:`1.5px solid ${danger ? "rgba(239,68,68,.3)" : "var(--border-2)"}`, borderRadius:"var(--r-md)", padding:"6px 14px", color: danger ? "var(--red)" : "var(--text-2)", fontFamily:"var(--font)", fontSize:12, fontWeight:700, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.5:1, whiteSpace:"nowrap", transition:"all .12s" }}>
      {children}
    </button>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} type="button" style={{ width:40, height:22, background:on?"var(--accent)":"var(--bg-3)", border:`1.5px solid ${on?"var(--accent)":"var(--border-2)"}`, borderRadius:11, cursor:"pointer", position:"relative", transition:"all .2s", flexShrink:0, boxShadow:on?"0 0 10px var(--glow-purple)":"none" }}>
      <span style={{ position:"absolute", top:2, left:on?20:2, width:14, height:14, background:on?"#fff":"var(--text-3)", borderRadius:"50%", transition:"all .2s cubic-bezier(.4,0,.2,1)" }} />
    </button>
  );
}

function Badge({ children }) {
  return <span style={{ background:"var(--bg-2)", border:"1.5px solid var(--border)", borderRadius:"var(--r-sm)", padding:"3px 10px", fontSize:11, fontWeight:700, color:"var(--text-3)" }}>{children}</span>;
}

function InlineForm({ children, onSubmit }) {
  return (
    <form onSubmit={onSubmit} style={{ display:"flex", flexDirection:"column", gap:8, padding:"8px 24px 16px", background:"var(--bg)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", marginBottom:4 }}>
      {children}
    </form>
  );
}

function SInput({ type="text", placeholder, value, onChange, required }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} required={required}
      style={{ background:"var(--bg-2)", border:"1.5px solid var(--border)", borderRadius:"var(--r-md)", padding:"10px 14px", color:"var(--text)", fontFamily:"var(--font)", fontSize:13, outline:"none", width:"100%", marginTop:4 }}
      onFocus={e => { e.target.style.borderColor="var(--accent)"; e.target.style.boxShadow="0 0 0 3px var(--accent-bg)"; }}
      onBlur={e => { e.target.style.borderColor="var(--border)"; e.target.style.boxShadow="none"; }}
    />
  );
}

function StatusMsg({ type, text }) {
  if (!text) return null;
  const ok = type === "success";
  return <div style={{ borderRadius:"var(--r-md)", padding:"8px 12px", fontSize:12, fontWeight:600, background:ok?"rgba(34,197,94,.1)":"rgba(239,68,68,.1)", border:`1px solid ${ok?"rgba(34,197,94,.25)":"rgba(239,68,68,.25)"}`, color:ok?"#86efac":"#fca5a5" }}>{text}</div>;
}

// ── Account ───────────────────────────────────────────────────
function AccountSection({ profile }) {
  const { user, updateUserProfile, logout } = useAuth();
  const [tab, setTab] = useState(null);
  const [form, setForm] = useState({ curPw:"", newEmail:"", newPw:"", confirmPw:"", deleteConfirm:"" });
  const [msg, setMsg] = useState({ type:"", text:"" });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));
  const openTab = (t) => { setTab(tab === t ? null : t); setMsg({ type:"", text:"" }); };
  const reauth = async () => { const cred = EmailAuthProvider.credential(user.email, form.curPw); await reauthenticateWithCredential(user, cred); };

  const changeEmail = async (e) => {
    e.preventDefault(); setBusy(true); setMsg({ type:"", text:"" });
    try { await reauth(); await updateEmail(user, form.newEmail); await updateUserProfile({ email:form.newEmail }); setMsg({ type:"success", text:"Email updated." }); setForm(f => ({ ...f, curPw:"", newEmail:"" })); setTab(null); }
    catch (err) { const m = { "auth/wrong-password":"Wrong password.", "auth/email-already-in-use":"Email in use.", "auth/requires-recent-login":"Sign out and back in, then retry." }; setMsg({ type:"error", text:m[err.code]||"Failed to update email." }); }
    finally { setBusy(false); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (form.newPw !== form.confirmPw) { setMsg({ type:"error", text:"Passwords don't match." }); return; }
    if (form.newPw.length < 6) { setMsg({ type:"error", text:"Password needs 6+ characters." }); return; }
    setBusy(true); setMsg({ type:"", text:"" });
    try { await reauth(); await updatePassword(user, form.newPw); setMsg({ type:"success", text:"Password changed." }); setForm(f => ({ ...f, curPw:"", newPw:"", confirmPw:"" })); setTab(null); }
    catch (err) { setMsg({ type:"error", text:err.code==="auth/wrong-password"?"Wrong password.":"Failed to change password." }); }
    finally { setBusy(false); }
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    if (form.deleteConfirm !== profile?.username) { setMsg({ type:"error", text:`Type your username "${profile?.username}" to confirm.` }); return; }
    setBusy(true);
    try { await reauth(); await deleteUser(user); logout(); }
    catch (err) { setMsg({ type:"error", text:err.code==="auth/wrong-password"?"Wrong password.":"Failed to delete account." }); setBusy(false); }
  };

  return (
    <>
      <Divider label="Profile info" />
      <Row icon={Icon.Mail}  label="Email address" desc={user?.email} right={<ActionBtn onClick={() => openTab("email")}>Change</ActionBtn>} />
      {tab === "email" && <InlineForm onSubmit={changeEmail}><SInput type="password" placeholder="Current password" value={form.curPw} onChange={e => set("curPw", e.target.value)} required /><SInput type="email" placeholder="New email address" value={form.newEmail} onChange={e => set("newEmail", e.target.value)} required /><StatusMsg type={msg.type} text={msg.text} /><div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><ActionBtn onClick={() => setTab(null)}>Cancel</ActionBtn><button type="submit" className="btn-primary-sm" disabled={busy}>{busy?"Saving…":"Update email"}</button></div></InlineForm>}
      <Row icon={Icon.Key} label="Password" desc="Change your account password" right={<ActionBtn onClick={() => openTab("password")}>Change</ActionBtn>} />
      {tab === "password" && <InlineForm onSubmit={changePw}><SInput type="password" placeholder="Current password" value={form.curPw} onChange={e => set("curPw", e.target.value)} required /><SInput type="password" placeholder="New password (min 6 chars)" value={form.newPw} onChange={e => set("newPw", e.target.value)} required /><SInput type="password" placeholder="Confirm new password" value={form.confirmPw} onChange={e => set("confirmPw", e.target.value)} required /><StatusMsg type={msg.type} text={msg.text} /><div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><ActionBtn onClick={() => setTab(null)}>Cancel</ActionBtn><button type="submit" className="btn-primary-sm" disabled={busy}>{busy?"Saving…":"Update password"}</button></div></InlineForm>}
      <Divider label="Danger zone" />
      <Row icon={Icon.Trash} label="Delete account" desc="Permanently delete your account and all data" danger right={<ActionBtn danger onClick={() => openTab("delete")}>Delete</ActionBtn>} />
      {tab === "delete" && <InlineForm onSubmit={deleteAccount}><div style={{ fontSize:12, color:"#fca5a5", background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.2)", borderRadius:"var(--r-md)", padding:"10px 12px", lineHeight:1.55 }}>⚠️ This is <strong>permanent</strong>. All posts, messages, and data will be deleted.</div><SInput type="password" placeholder="Enter your password" value={form.curPw} onChange={e => set("curPw", e.target.value)} required /><SInput type="text" placeholder={`Type your username: ${profile?.username}`} value={form.deleteConfirm} onChange={e => set("deleteConfirm", e.target.value)} required /><StatusMsg type={msg.type} text={msg.text} /><div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><ActionBtn onClick={() => setTab(null)}>Cancel</ActionBtn><button type="submit" disabled={busy} style={{ background:"var(--red)", border:"none", borderRadius:"var(--r-md)", padding:"7px 16px", color:"#fff", fontFamily:"var(--font)", fontSize:12, fontWeight:700, cursor:busy?"not-allowed":"pointer", opacity:busy?0.5:1 }}>{busy?"Deleting…":"Delete my account"}</button></div></InlineForm>}
    </>
  );
}

// ── Appearance ────────────────────────────────────────────────
function AppearanceSection() {
  const { theme, setDark, setLight, colorTheme, setColorTheme, COLOR_THEMES } = useTheme();
  const [compact, setCompact] = useState(() => localStorage.getItem("nexus_compact") === "true");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("nexus_fontsize") || "medium");

  const handleCompact = (v) => { setCompact(v); localStorage.setItem("nexus_compact", v); };
  const handleFont = (s) => {
    setFontSize(s); localStorage.setItem("nexus_fontsize", s);
    document.documentElement.style.setProperty("--chat-font-size", { small:"13px", medium:"14px", large:"16px" }[s]);
  };

  return (
    <>
      <Divider label="App theme" />
      <div style={{ padding:"8px 24px 20px" }}>
        <div style={{ display:"flex", gap:12 }}>
          {[
            { fn: setDark,  active: theme === "dark",  IconC: Icon.Moon,  label:"🌑 Dark" },
            { fn: setLight, active: theme === "light", IconC: Icon.Sun,   label:"☀️ Light" },
          ].map(({ fn, active, IconC, label }) => (
            <button key={label} onClick={fn} style={{ flex:1, padding:"16px 12px", borderRadius:"var(--r-lg)", cursor:"pointer", background:active?"rgba(124,58,237,.18)":"var(--bg-2)", border:`2px solid ${active?"var(--accent)":"var(--border)"}`, display:"flex", flexDirection:"column", alignItems:"center", gap:8, transition:"all .18s", boxShadow:active?"0 0 20px rgba(124,58,237,.4)":"none" }}>
              <div style={{ width:52, height:34, borderRadius:8, background:active&&theme==="dark"?"#06060a":"#f4f4fb", border:"1px solid rgba(124,58,237,.4)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--accent)" }}>
                <IconC />
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:active?"var(--accent-2)":"var(--text-3)" }}>{label}</span>
              {active && <span style={{ fontSize:10, background:"var(--accent-bg)", color:"var(--accent-2)", padding:"2px 8px", borderRadius:20, border:"1px solid var(--accent-bd)" }}>Active</span>}
            </button>
          ))}
        </div>
      </div>

      <Divider label="Accent colour" />
      <div style={{ padding:"8px 24px 20px" }}>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {COLOR_THEMES.map(ct => (
            <button key={ct.id} onClick={() => setColorTheme(ct.id)} title={ct.label} style={{ width:36, height:36, borderRadius:"50%", background:ct.preview, border:colorTheme===ct.id?"3px solid #fff":"3px solid transparent", cursor:"pointer", boxShadow:colorTheme===ct.id?`0 0 0 2px ${ct.preview}, 0 0 16px ${ct.preview}88`:"none", transition:"all .18s", transform:colorTheme===ct.id?"scale(1.15)":"scale(1)" }} />
          ))}
        </div>
        <div style={{ marginTop:8, fontSize:12, color:"var(--text-3)" }}>
          Current: <span style={{ color:"var(--accent-2)", fontWeight:700 }}>{COLOR_THEMES.find(ct => ct.id === colorTheme)?.label || "Violet"}</span>
        </div>
      </div>

      <Divider label="Display" />
      <Row icon={Icon.Layout} label="Compact mode" desc="Show messages closer together" right={<Toggle on={compact} onChange={handleCompact} />} />
      <Row icon={Icon.Type} label="Font size" desc="Adjust chat text size" right={
        <div style={{ display:"flex", gap:4 }}>
          {["Small","Medium","Large"].map(s => { const k = s.toLowerCase(); return (
            <button key={k} onClick={() => handleFont(k)} style={{ background:fontSize===k?"var(--accent-bg)":"var(--bg-2)", border:`1.5px solid ${fontSize===k?"var(--accent-bd)":"var(--border)"}`, borderRadius:"var(--r-sm)", padding:"5px 10px", fontFamily:"var(--font)", fontSize:11, fontWeight:700, color:fontSize===k?"var(--accent-2)":"var(--text-3)", cursor:"pointer" }}>{s}</button>
          ); })}
        </div>
      } />
    </>
  );
}

// ── Notifications ─────────────────────────────────────────────
function NotificationsSection() {
  const load = () => { try { return JSON.parse(localStorage.getItem("nexus_notif_prefs") || "{}"); } catch { return {}; } };
  const defaults = { messages:true, mentions:true, follows:true, reactions:false, sounds:false };
  const [prefs, setPrefs] = useState(load);
  const get = (k) => prefs[k] !== undefined ? prefs[k] : defaults[k];
  const toggle = (k) => { const next = { ...prefs, [k]:!get(k) }; setPrefs(next); localStorage.setItem("nexus_notif_prefs", JSON.stringify(next)); };
  return (
    <>
      <Divider label="Push notifications" />
      <Row icon={Icon.MessageCircle} label="Direct messages"    desc="New messages from people"    right={<Toggle on={get("messages")}  onChange={() => toggle("messages")}  />} />
      <Row icon={Icon.AtSign}        label="Mentions"           desc="When someone mentions you"   right={<Toggle on={get("mentions")}  onChange={() => toggle("mentions")}  />} />
      <Row icon={Icon.UserPlus}      label="New followers"      desc="When someone follows you"    right={<Toggle on={get("follows")}   onChange={() => toggle("follows")}   />} />
      <Row icon={Icon.Heart}         label="Reactions"          desc="Reactions on your posts"     right={<Toggle on={get("reactions")} onChange={() => toggle("reactions")} />} />
      <Divider label="Sound" />
      <Row icon={Icon.Volume} label="Notification sounds" desc="Play a sound for new messages" right={<Toggle on={get("sounds")} onChange={() => toggle("sounds")} />} />
    </>
  );
}

// ── Privacy ───────────────────────────────────────────────────
function PrivacySection() {
  const load = () => { try { return JSON.parse(localStorage.getItem("nexus_privacy_prefs") || "{}"); } catch { return {}; } };
  const defaults = { showOnline:true, readReceipts:true, allowDMs:true };
  const [prefs, setPrefs] = useState(load);
  const get = (k) => prefs[k] !== undefined ? prefs[k] : defaults[k];
  const toggle = (k) => { const next = { ...prefs, [k]:!get(k) }; setPrefs(next); localStorage.setItem("nexus_privacy_prefs", JSON.stringify(next)); };
  return (
    <>
      <Divider label="Visibility" />
      <Row icon={Icon.Circle}      label="Show online status"     desc="Others can see when you're active"  right={<Toggle on={get("showOnline")}   onChange={() => toggle("showOnline")}   />} />
      <Row icon={Icon.CheckCheck}  label="Read receipts"          desc="Show when you've read messages"     right={<Toggle on={get("readReceipts")} onChange={() => toggle("readReceipts")} />} />
      <Divider label="Messaging" />
      <Row icon={Icon.MailOpen}    label="Allow message requests"  desc="Let anyone send you a DM request"  right={<Toggle on={get("allowDMs")}     onChange={() => toggle("allowDMs")}     />} />
      <Divider label="Data" />
      <Row icon={Icon.Box} label="Download your data" desc="Export a copy of all your Nexus data" right={<ActionBtn onClick={() => alert("Data export coming soon!")}>Request</ActionBtn>} />
    </>
  );
}

// ── Help ──────────────────────────────────────────────────────
const FAQS = [
  { q:"How do I start a conversation?",       a:"Go to Messages in the sidebar, click +, and search by username." },
  { q:"How do channels work?",                a:"Channels are public or private group rooms. Click Channels in the rail to browse or create one." },
  { q:"What are Vibes?",                      a:"Vibes are animated status rings around your avatar. Set yours with the smiley button at the bottom of the rail." },
  { q:"How do Stories work?",                 a:"Stories appear at the top of the feed and expire after 24 hours. Tap your avatar ring to create one." },
  { q:"Can I unsend a message?",              a:"Yes — hover over a message you sent and click the trash icon. Both sides see a deleted notice." },
  { q:"How do I change my username?",         a:"On your profile page, hover over your @username and click the pencil icon." },
  { q:"How do I tip someone coins?",          a:"Visit their profile and tap the 🪙 Tip button next to the Message button." },
  { q:"How do I change the chat wallpaper?",  a:"Open any DM conversation and tap the image icon in the top-right corner." },
  { q:"How do I report someone?",             a:"Contact us at support@nexus.app for urgent reports." },
];

function HelpSection() {
  const [open, setOpen] = useState(null);
  return (
    <>
      <Divider label="Frequently asked questions" />
      {FAQS.map((faq, i) => (
        <div key={i} onClick={() => setOpen(open === i ? null : i)} style={{ borderBottom:"1px solid var(--border)", cursor:"pointer" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"13px 24px", fontSize:13, fontWeight:600 }}>
            <span>{faq.q}</span>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ transform:open===i?"rotate(180deg)":"none", transition:"transform .2s", flexShrink:0 }}><path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          {open === i && <div style={{ padding:"4px 24px 14px", fontSize:13, color:"var(--text-2)", lineHeight:1.65, borderTop:"1px solid var(--border)" }}>{faq.a}</div>}
        </div>
      ))}
      <Divider label="Contact" />
      <Row icon={Icon.Mail}  label="Email support" desc="support@nexus.app" right={<ActionBtn onClick={() => window.open("mailto:support@nexus.app")}>Email</ActionBtn>} />
      <Row icon={Icon.Bug}   label="Report a bug"  desc="Help us squash issues"  right={<ActionBtn onClick={() => window.open("mailto:bugs@nexus.app?subject=Bug%20Report")}>Report</ActionBtn>} />
    </>
  );
}

// ── Legal ─────────────────────────────────────────────────────
const LEGAL = {
  tos:       { title:"Terms of Service",       body:`Last updated: March 2026\n\n1. ACCEPTANCE\nBy using Nexus you agree to these terms.\n\n2. ELIGIBILITY\nYou must be 13 or older.\n\n3. YOUR ACCOUNT\nYou are responsible for all activity under your account.\n\n4. ACCEPTABLE USE\nYou agree NOT to:\n• Post harmful, harassing, or hateful content\n• Impersonate any person or organisation\n• Upload malware or attempt to hack the service\n• Scrape other users' data without consent\n\n5. CONTENT\nYou keep ownership of what you post. By posting you grant Nexus a non-exclusive licence to display it within the platform.\n\n6. TERMINATION\nWe may suspend accounts that violate these terms.\n\n7. DISCLAIMER\nService is provided "as is" without warranties.\n\n8. CONTACT\nlegal@nexus.app` },
  privacy:   { title:"Privacy Policy",         body:`Last updated: March 2026\n\n1. DATA WE COLLECT\n• Account: username, email, profile photo\n• Content: posts, messages, stories\n• Usage: features used, session duration\n• Device: browser, IP address\n\n2. HOW WE USE IT\n• To operate and improve Nexus\n• To deliver notifications you've opted into\n• To enforce our Terms of Service\n\n3. SHARING\nWe never sell your data. We share only with infrastructure providers (Firebase/Google) and law enforcement when legally required.\n\n4. YOUR RIGHTS\nAccess · Correct · Delete · Export your data at any time from Settings → Account.\n\n5. CONTACT\nprivacy@nexus.app` },
  community: { title:"Community Guidelines",   body:`BE KIND & RESPECTFUL\nTreat everyone with dignity.\n\nNO HATE SPEECH\nContent targeting people based on race, religion, gender, sexuality, or disability is banned.\n\nNO HARASSMENT\nNo stalking, threatening, or bullying.\n\nKEEP IT LEGAL\nNo illegal content or activity.\n\nNO SPAM\nNo flood posting or bots.\n\nPROTECT MINORS\nContent endangering minors is strictly forbidden.\n\nENFORCEMENT\nViolations may result in removal, suspension, or permanent ban.` },
};

function LegalSection() {
  const [view, setView] = useState(null);
  if (view) {
    const docItem = LEGAL[view];
    return (
      <>
        <button onClick={() => setView(null)} style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:"none", color:"var(--accent-2)", fontFamily:"var(--font)", fontSize:13, fontWeight:600, cursor:"pointer", padding:"16px 24px 8px" }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <div style={{ padding:"0 24px 32px" }}>
          <h3 style={{ fontSize:16, fontWeight:800, marginBottom:16, letterSpacing:"-.02em" }}>{docItem.title}</h3>
          <pre style={{ fontFamily:"var(--font)", fontSize:12, color:"var(--text-2)", lineHeight:1.8, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{docItem.body}</pre>
        </div>
      </>
    );
  }
  return (
    <>
      <Divider label="Documents" />
      <Row icon={Icon.Clipboard} label="Terms of Service"      desc="Rules governing your use of Nexus" right={<ActionBtn onClick={() => setView("tos")}>Read →</ActionBtn>} />
      <Row icon={Icon.Lock}      label="Privacy Policy"        desc="How we handle your data"           right={<ActionBtn onClick={() => setView("privacy")}>Read →</ActionBtn>} />
      <Row icon={Icon.Users}     label="Community Guidelines"  desc="Standards for a healthy community" right={<ActionBtn onClick={() => setView("community")}>Read →</ActionBtn>} />
      <Divider label="Licenses" />
      <Row icon={Icon.Scale} label="Open-source licences" desc="React, Firebase, date-fns and others" right={<ActionBtn onClick={() => alert("React 18, Firebase 10, and date-fns are used under their respective open-source licences.")}>View</ActionBtn>} />
    </>
  );
}

// ── About ─────────────────────────────────────────────────────
const FEATURES = [
  ["✦",   "Stories",         "24-hour photo & text stories"],
  ["💬",  "Group DMs",       "Conversations with multiple people"],
  ["🎭",  "GIFs & Stickers", "Powered by Giphy"],
  ["🎙️", "Voice messages",   "Record and send audio clips"],
  ["🔥",  "Vibes",           "Animated mood rings on avatars"],
  ["📣",  "Reactions",       "Emoji reactions on posts & messages"],
  ["🪙",  "Coins",           "Tip creators with in-app coins"],
  ["🖼️", "Chat wallpapers",  "Personalise your DM backgrounds"],
  ["🎨",  "Custom themes",   "6 accent colours to choose from"],
  ["🏅",  "Badges",          "Earn badges for milestones"],
];

function AboutSection() {
  return (
    <>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"28px 24px 20px", borderBottom:"1px solid var(--border)", gap:6 }}>
        <div style={{ marginBottom:6, filter:"drop-shadow(0 0 20px var(--glow-purple)) drop-shadow(0 0 40px var(--glow-cyan))" }}>
          <NexusLogo size={88} />
        </div>
        <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:"-.03em", background:"linear-gradient(135deg, var(--accent-2), var(--cyan))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Nexus</h2>
        <p style={{ fontSize:13, color:"var(--text-3)" }}>Chat · Share · Connect</p>
        <span style={{ fontSize:11, color:"var(--text-3)", fontFamily:"var(--mono)" }}>Version 2.0.0</span>
      </div>
      <Divider label="Build info" />
      <Row icon={Icon.Rocket} label="Version" desc="Current stable release"            right={<Badge>v2.0.0</Badge>} />
      <Row icon={Icon.Tool}   label="Stack"   desc="React 18 · Firebase 10 · date-fns" right={<Badge>Web</Badge>} />
      <Divider label="What's in v2" />
      {FEATURES.map(([icon, label, desc]) => (
        <div key={label} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 24px" }}>
          <div style={{ width:32, height:32, borderRadius:"var(--r-md)", background:"var(--bg-2)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{icon}</div>
          <div>
            <span style={{ fontSize:13, fontWeight:600, display:"block" }}>{label}</span>
            <span style={{ fontSize:12, color:"var(--text-3)" }}>{desc}</span>
          </div>
        </div>
      ))}
    </>
  );
}

// ── Root modal ────────────────────────────────────────────────
export default function SettingsModal({ onClose }) {
  const { profile } = useAuth();
  const [active, setActive] = useState("account");

  const content = {
    account:       <AccountSection profile={profile} />,
    appearance:    <AppearanceSection />,
    notifications: <NotificationsSection />,
    privacy:       <PrivacySection />,
    help:          <HelpSection />,
    legal:         <LegalSection />,
    about:         <AboutSection />,
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.82)", backdropFilter:"blur(6px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ display:"flex", width:"100%", maxWidth:860, height:"min(660px, 92vh)", background:"var(--bg-1)", border:"1.5px solid var(--border-2)", borderRadius:"var(--r-xl)", overflow:"hidden", boxShadow:"0 0 60px var(--glow-purple), 0 32px 80px rgba(0,0,0,.85)", animation:"settings-enter .22s cubic-bezier(.16,1,.3,1)" }}>

        {/* ── Nav ── */}
        <aside style={{ width:220, flexShrink:0, background:"var(--bg)", borderRight:"1px solid var(--border-2)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 16px 12px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
            <span style={{ fontSize:15, fontWeight:800, letterSpacing:"-.02em" }}>Settings</span>
            <button className="icon-btn" onClick={onClose}>✕</button>
          </div>

          {/* User pill */}
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", overflow:"hidden", flexShrink:0, background:"var(--accent-bg)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 10px var(--glow-purple)" }}>
              {profile?.avatar
                ? <img src={profile.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <span style={{ fontSize:13, fontWeight:700, color:"var(--accent-2)" }}>{(profile?.displayName||"?").slice(0,2).toUpperCase()}</span>
              }
            </div>
            <div style={{ minWidth:0 }}>
              <span style={{ display:"block", fontSize:13, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{profile?.displayName}</span>
              <span style={{ fontSize:11, color:"var(--text-3)" }}>@{profile?.username}</span>
            </div>
          </div>

          <nav style={{ flex:1, overflowY:"auto", padding:8 }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"9px 10px", background:active===s.id?"var(--accent-bg)":"transparent", border:"none", borderRadius:"var(--r-md)", color:active===s.id?"var(--accent-2)":"var(--text-2)", fontFamily:"var(--font)", fontSize:13, fontWeight:600, cursor:"pointer", textAlign:"left", marginBottom:2, transition:"all .12s", boxShadow:active===s.id?"0 0 10px var(--glow-purple)":"none" }}>
                <div style={{ width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <s.Icon />
                </div>
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Content ── */}
        <main style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
          <div style={{ padding:"18px 24px 14px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
            <h2 style={{ fontSize:17, fontWeight:800, letterSpacing:"-.02em" }}>{SECTIONS.find(s => s.id === active)?.label}</h2>
          </div>
          <div style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>{content[active]}</div>
        </main>
      </div>
    </div>
  );
}
