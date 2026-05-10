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
        <div style={{ minWidth:0 }}>
          <span style={{ display:"block", fontSize:13, fontWeight:600, color:danger?"var(--red)":"var(--text-1)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{label}</span>
          {desc && <span style={{ display:"block", fontSize:11, color:"var(--text-3)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{desc}</span>}
        </div>
      </div>
      {right}
    </div>
  );
}

function Badge({ children }) {
  return (
    <span style={{ fontSize:10, fontWeight:800, padding:"2px 6px", borderRadius:4, background:"var(--bg-2)", border:"1px solid var(--border)", color:"var(--text-3)", textTransform:"uppercase" }}>{children}</span>
  );
}

function Toggle({ active, onClick }) {
  return (
    <button onClick={onClick} style={{ width:34, height:18, borderRadius:20, background:active?"var(--accent-2)":"var(--bg-3)", border:"none", position:"relative", cursor:"pointer", transition:"all .2s" }}>
      <div style={{ width:12, height:12, borderRadius:"50%", background:"#fff", position:"absolute", top:3, left:active?19:3, transition:"all .2s" }} />
    </button>
  );
}

// ── Sections ──────────────────────────────────────────────────
function AccountSection({ profile }) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [pass, setPass] = useState("");
  const [status, setStatus] = useState("");

  const handleUpdateEmail = async () => {
    try {
      setStatus("Updating email...");
      await updateEmail(user, email);
      setStatus("Email updated!");
    } catch (e) { setStatus("Error: " + e.message); }
  };

  return (
    <>
      <Divider label="Profile Info" />
      <Row icon={Icon.User} label="Display Name" desc={profile?.displayName} right={<Badge>Public</Badge>} />
      <Row icon={Icon.AtSign} label="Username" desc={`@${profile?.username}`} right={<Badge>Unique</Badge>} />
      
      <Divider label="Email Address" />
      <div style={{ padding:"0 24px 12px" }}>
        <div style={{ display:"flex", gap:8 }}>
          <input value={email} onChange={e=>setEmail(e.target.value)} style={{ flex:1, padding:"8px 12px", background:"var(--bg-2)", border:"1.5px solid var(--border)", borderRadius:"var(--r-md)", color:"var(--text-1)", fontSize:13 }} />
          <button className="btn-primary-sm" onClick={handleUpdateEmail}>Update</button>
        </div>
        {status && <p style={{ fontSize:11, marginTop:8, color:"var(--accent-2)" }}>{status}</p>}
      </div>

      <Divider label="Security" />
      <Row icon={Icon.Key} label="Password" desc="Change your login password" right={<button className="btn-primary-sm">Change</button>} />
      <Row icon={Icon.Trash} label="Delete Account" desc="Permanently remove all data" danger right={<button className="btn-danger-sm">Delete</button>} />
    </>
  );
}

function AppearanceSection() {
  const { theme, setTheme, themes } = useTheme();
  return (
    <>
      <Divider label="Theme Mode" />
      <Row icon={Icon.Sun} label="Light Mode" desc="Standard bright interface" right={<Toggle active={theme.id==='light'} onClick={()=>setTheme('light')} />} />
      <Row icon={Icon.Moon} label="Dark Mode" desc="Easy on the eyes" right={<Toggle active={theme.id==='dark'} onClick={()=>setTheme('dark')} />} />
      <Row icon={Icon.Star} label="Midnight" desc="True black OLED theme" right={<Toggle active={theme.id==='midnight'} onClick={()=>setTheme('midnight')} />} />

      <Divider label="Accent Color" />
      <div style={{ padding:"8px 24px 20px", display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8 }}>
        {Object.entries(themes).filter(([id])=>!['light','dark','midnight'].includes(id)).map(([id, t]) => (
          <button key={id} onClick={()=>setTheme(id)} style={{
            padding:"10px", background:theme.id===id?"var(--accent-bg)":"var(--bg-2)",
            border:`1.5px solid ${theme.id===id?"var(--accent-2)":"var(--border)"}`,
            borderRadius:"var(--r-md)", display:"flex", alignItems:"center", gap:8, cursor:"pointer"
          }}>
            <div style={{ width:12, height:12, borderRadius:"50%", background:t.colors.accent }} />
            <span style={{ fontSize:12, fontWeight:600, color:theme.id===id?"var(--accent-2)":"var(--text-2)" }}>{id.charAt(0).toUpperCase()+id.slice(1)}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function NotificationsSection() {
  return (
    <>
      <Divider label="Push Notifications" />
      <Row icon={Icon.MessageCircle} label="Direct Messages" desc="Alerts for new private chats" right={<Toggle active={true} />} />
      <Row icon={Icon.UserPlus} label="New Followers" desc="When someone follows you" right={<Toggle active={true} />} />
      <Row icon={Icon.Heart} label="Likes & Reactions" desc="Activity on your posts" right={<Toggle active={false} />} />
      
      <Divider label="Sound" />
      <Row icon={Icon.Volume} label="Notification Sounds" desc="Play a chime for alerts" right={<Toggle active={true} />} />
    </>
  );
}

function PrivacySection() {
  return (
    <>
      <Divider label="Visibility" />
      <Row icon={Icon.Shield} label="Private Profile" desc="Only followers can see posts" right={<Toggle active={false} />} />
      <Row icon={Icon.AtSign} label="Discoverability" desc="Appear in search results" right={<Toggle active={true} />} />
      
      <Divider label="Messaging" />
      <Row icon={Icon.Mail} label="Direct Messages" desc="Allow DMs from everyone" right={<Toggle active={true} />} />
      <Row icon={Icon.CheckCheck} label="Read Receipts" desc="Show when you've seen messages" right={<Toggle active={true} />} />
    </>
  );
}

function HelpSection() {
  return (
    <>
      <Divider label="Support" />
      <Row icon={Icon.HelpCircle} label="Help Center" desc="Browse guides and FAQs" right={<button className="btn-primary-sm">Visit</button>} />
      <Row icon={Icon.Bug} label="Report a Bug" desc="Help us improve Nexus" right={<button className="btn-primary-sm">Report</button>} />
      
      <Divider label="Community" />
      <Row icon={Icon.Users} label="Community Guidelines" desc="Our rules and standards" right={<button className="btn-primary-sm">Read</button>} />
    </>
  );
}

function LegalSection() {
  return (
    <>
      <Divider label="Documents" />
      <Row icon={Icon.FileText} label="Terms of Service" desc="Last updated: Jan 2024" right={<button className="btn-primary-sm">View</button>} />
      <Row icon={Icon.Shield} label="Privacy Policy" desc="How we handle your data" right={<button className="btn-primary-sm">View</button>} />
      <Row icon={Icon.Scale} label="Cookie Policy" desc="Use of local storage" right={<button className="btn-primary-sm">View</button>} />
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

function OwnerSection() {
  const [pass, setPass] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = (e) => {
    e.preventDefault();
    if (pass === "STELLEN@10") {
      setAuthed(true);
      setError("");
    } else {
      setError("Invalid owner password.");
    }
  };

  if (!authed) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔐</div>
        <h3 style={{ marginBottom: 8 }}>Owner Access</h3>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 24 }}>Enter your master password to access owner permissions.</p>
        <form onSubmit={handleAuth} style={{ maxWidth: 280, margin: "0 auto" }}>
          <input
            type="password"
            placeholder="Master Password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", background: "var(--bg-2)", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text-1)", marginBottom: 12 }}
            autoFocus
          />
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
        <div style={{ background: "var(--accent-bg)", border: "1.5px solid var(--accent-bd)", borderRadius: "var(--r-lg)", padding: 20, marginBottom: 16 }}>
          <h4 style={{ color: "var(--accent-2)", marginBottom: 8 }}>Welcome, Owner</h4>
          <p style={{ fontSize: 13, color: "var(--text-2)" }}>You have full access to Nexus administrative tools. Use these powers responsibly.</p>
        </div>
        <Divider label="Quick Actions" />
        <Row icon={Icon.Bug} label="Debug Mode" desc="Enable advanced logging" right={<Toggle active={false} />} />
        <Row icon={Icon.Shield} label="Global Lock" desc="Restrict new registrations" right={<Toggle active={false} />} />
        <Row icon={Icon.MailOpen} label="System Broadcast" desc="Send notification to all users" right={<button className="btn-primary-sm">Compose</button>} />
      </div>
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
    owner:         <OwnerSection />,
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
