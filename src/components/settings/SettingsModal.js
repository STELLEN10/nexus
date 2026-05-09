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
  Crown: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M3 16l1-8 4 3 2-7 2 7 4-3 1 8H3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
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
  { id: "owner",         Icon: Icon.Crown,      label: "Owner"           },
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
    try { await reauth(); await updateEmail(user, form.newEmail); await updateUserProfile({ email:form.newEmail }); setMsg({ type:"success", text:"Email updated." }); setForm(f => ({ ...f, curPw:"", newEm
(Content truncated due to size limit. Use line ranges to read remaining content)
