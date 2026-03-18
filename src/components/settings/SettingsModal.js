import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "firebase/auth";
import { auth } from "../../firebase";

const SECTIONS = [
  { id: "account",       icon: "👤", label: "Account" },
  { id: "appearance",    icon: "🎨", label: "Appearance" },
  { id: "notifications", icon: "🔔", label: "Notifications" },
  { id: "privacy",       icon: "🔒", label: "Privacy & Safety" },
  { id: "help",          icon: "💬", label: "Help & Support" },
  { id: "legal",         icon: "📄", label: "Terms & Legal" },
  { id: "about",         icon: "✦",  label: "About Nexus" },
];

function SettingRow({ icon, label, desc, children, danger }) {
  return (
    <div className={`setting-row ${danger ? "danger" : ""}`}>
      <div className="setting-row-left">
        {icon && <span className="setting-row-icon">{icon}</span>}
        <div className="setting-row-text">
          <span className="setting-row-label">{label}</span>
          {desc && <span className="setting-row-desc">{desc}</span>}
        </div>
      </div>
      <div className="setting-row-right">{children}</div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button className={`setting-toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)} type="button">
      <span className="setting-toggle-knob" />
    </button>
  );
}

function Divider({ label }) {
  return <div className="setting-divider"><span>{label}</span></div>;
}

function AccountSection({ profile }) {
  const { user, updateUserProfile, logout } = useAuth();
  const [tab, setTab] = useState(null);
  const [form, setForm] = useState({ currentPassword: "", newEmail: "", newPassword: "", confirmPassword: "", deleteConfirm: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const reauth = async (password) => {
    const cred = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, cred);
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg({ type: "", text: "" });
    try {
      await reauth(form.currentPassword);
      await updateEmail(user, form.newEmail);
      await updateUserProfile({ email: form.newEmail });
      setMsg({ type: "success", text: "Email updated successfully." });
      setForm(f => ({ ...f, currentPassword: "", newEmail: "" }));
      setTab(null);
    } catch (err) {
      setMsg({ type: "error", text: err.code === "auth/wrong-password" ? "Current password is incorrect." : err.code === "auth/email-already-in-use" ? "That email is already in use." : "Failed to update email." });
    } finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { setMsg({ type: "error", text: "Passwords don't match." }); return; }
    if (form.newPassword.length < 6) { setMsg({ type: "error", text: "Password must be at least 6 characters." }); return; }
    setLoading(true); setMsg({ type: "", text: "" });
    try {
      await reauth(form.currentPassword);
      await updatePassword(user, form.newPassword);
      setMsg({ type: "success", text: "Password changed successfully." });
      setForm(f => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
      setTab(null);
    } catch (err) {
      setMsg({ type: "error", text: err.code === "auth/wrong-password" ? "Current password is incorrect." : "Failed to change password." });
    } finally { setLoading(false); }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (form.deleteConfirm !== profile?.username) { setMsg({ type: "error", text: `Type your username "${profile?.username}" to confirm.` }); return; }
    setLoading(true);
    try {
      await reauth(form.currentPassword);
      await deleteUser(user);
      logout();
    } catch (err) {
      setMsg({ type: "error", text: err.code === "auth/wrong-password" ? "Current password is incorrect." : "Failed to delete account." });
      setLoading(false);
    }
  };

  return (
    <div className="settings-section-body">
      <Divider label="Profile info" />
      <SettingRow icon="📧" label="Email address" desc={user?.email}>
        <button className="setting-action-btn" onClick={() => { setTab(tab === "email" ? null : "email"); setMsg({ type: "", text: "" }); }}>Change</button>
      </SettingRow>
      {tab === "email" && (
        <form className="settings-form" onSubmit={handleEmailChange}>
          <input className="settings-input" type="password" placeholder="Current password" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} required />
          <input className="settings-input" type="email" placeholder="New email address" value={form.newEmail} onChange={e => setForm(f => ({ ...f, newEmail: e.target.value }))} required />
          {msg.text && <div className={`settings-msg ${msg.type}`}>{msg.text}</div>}
          <div className="settings-form-actions">
            <button type="button" className="btn-ghost-sm" onClick={() => setTab(null)}>Cancel</button>
            <button type="submit" className="btn-primary-sm" disabled={loading}>{loading ? "Saving…" : "Update email"}</button>
          </div>
        </form>
      )}
      <SettingRow icon="🔑" label="Password" desc="Change your account password">
        <button className="setting-action-btn" onClick={() => { setTab(tab === "password" ? null : "password"); setMsg({ type: "", text: "" }); }}>Change</button>
      </SettingRow>
      {tab === "password" && (
        <form className="settings-form" onSubmit={handlePasswordChange}>
          <input className="settings-input" type="password" placeholder="Current password" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} required />
          <input className="settings-input" type="password" placeholder="New password (min. 6 chars)" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} required />
          <input className="settings-input" type="password" placeholder="Confirm new password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
          {msg.text && <div className={`settings-msg ${msg.type}`}>{msg.text}</div>}
          <div className="settings-form-actions">
            <button type="button" className="btn-ghost-sm" onClick={() => setTab(null)}>Cancel</button>
            <button type="submit" className="btn-primary-sm" disabled={loading}>{loading ? "Saving…" : "Update password"}</button>
          </div>
        </form>
      )}
      <Divider label="Danger zone" />
      <SettingRow icon="🗑️" label="Delete account" desc="Permanently delete your account and all data" danger>
        <button className="setting-action-btn danger" onClick={() => { setTab(tab === "delete" ? null : "delete"); setMsg({ type: "", text: "" }); }}>Delete</button>
      </SettingRow>
      {tab === "delete" && (
        <form className="settings-form danger-form" onSubmit={handleDeleteAccount}>
          <p className="danger-warning">⚠️ This is <strong>permanent</strong> and cannot be undone. All posts, messages, and data will be deleted.</p>
          <input className="settings-input" type="password" placeholder="Enter your password to confirm" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} required />
          <input className="settings-input" type="text" placeholder={`Type your username: ${profile?.username}`} value={form.deleteConfirm} onChange={e => setForm(f => ({ ...f, deleteConfirm: e.target.value }))} required />
          {msg.text && <div className={`settings-msg ${msg.type}`}>{msg.text}</div>}
          <div className="settings-form-actions">
            <button type="button" className="btn-ghost-sm" onClick={() => setTab(null)}>Cancel</button>
            <button type="submit" className="setting-delete-btn" disabled={loading}>{loading ? "Deleting…" : "Delete my account"}</button>
          </div>
        </form>
      )}
    </div>
  );
}

function AppearanceSection() {
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem("nexus_compact") === "true");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("nexus_fontsize") || "medium");
  const handleCompact = (val) => { setCompactMode(val); localStorage.setItem("nexus_compact", val); };
  const handleFontSize = (size) => {
    setFontSize(size); localStorage.setItem("nexus_fontsize", size);
    const sizes = { small: "13px", medium: "14px", large: "16px" };
    document.documentElement.style.setProperty("--chat-font-size", sizes[size]);
  };
  return (
    <div className="settings-section-body">
      <Divider label="Display" />
      <SettingRow icon="📐" label="Compact mode" desc="Show messages closer together">
        <Toggle on={compactMode} onChange={handleCompact} />
      </SettingRow>
      <div className="setting-row">
        <div className="setting-row-left">
          <span className="setting-row-icon">🔡</span>
          <div className="setting-row-text">
            <span className="setting-row-label">Font size</span>
            <span className="setting-row-desc">Adjust text size across the app</span>
          </div>
        </div>
        <div className="setting-font-options">
          {["small", "medium", "large"].map(s => (
            <button key={s} className={`setting-font-btn ${fontSize === s ? "active" : ""}`} onClick={() => handleFontSize(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <Divider label="Theme" />
      <SettingRow icon="🌑" label="Dark mode" desc="Nexus always uses a dark theme for the best experience">
        <span className="setting-badge">Always on</span>
      </SettingRow>
    </div>
  );
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nexus_notif_prefs")) || {}; } catch { return {}; }
  });
  const defaults = { messages: true, mentions: true, follows: true, reactions: false, sounds: false };
  const get = (k) => prefs[k] !== undefined ? prefs[k] : defaults[k];
  const update = (key, val) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    localStorage.setItem("nexus_notif_prefs", JSON.stringify(next));
  };
  return (
    <div className="settings-section-body">
      <Divider label="Push notifications" />
      <SettingRow icon="💬" label="Direct messages" desc="Get notified when someone messages you"><Toggle on={get("messages")} onChange={v => update("messages", v)} /></SettingRow>
      <SettingRow icon="📣" label="Mentions" desc="Get notified when someone mentions you"><Toggle on={get("mentions")} onChange={v => update("mentions", v)} /></SettingRow>
      <SettingRow icon="👤" label="New followers" desc="Get notified when someone follows you"><Toggle on={get("follows")} onChange={v => update("follows", v)} /></SettingRow>
      <SettingRow icon="❤️" label="Reactions" desc="Get notified when someone reacts to your posts"><Toggle on={get("reactions")} onChange={v => update("reactions", v)} /></SettingRow>
      <Divider label="Sound" />
      <SettingRow icon="🔊" label="Notification sounds" desc="Play a sound for incoming messages"><Toggle on={get("sounds")} onChange={v => update("sounds", v)} /></SettingRow>
    </div>
  );
}

function PrivacySection() {
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nexus_privacy_prefs")) || {}; } catch { return {}; }
  });
  const defaults = { showOnline: true, readReceipts: true, allowDMs: true };
  const get = (k) => prefs[k] !== undefined ? prefs[k] : defaults[k];
  const update = (key, val) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    localStorage.setItem("nexus_privacy_prefs", JSON.stringify(next));
  };
  return (
    <div className="settings-section-body">
      <Divider label="Visibility" />
      <SettingRow icon="🟢" label="Show online status" desc="Let others see when you're online"><Toggle on={get("showOnline")} onChange={v => update("showOnline", v)} /></SettingRow>
      <SettingRow icon="✓✓" label="Read receipts" desc="Show others when you've read their messages"><Toggle on={get("readReceipts")} onChange={v => update("readReceipts", v)} /></SettingRow>
      <Divider label="Messaging" />
      <SettingRow icon="✉️" label="Allow message requests" desc="Let anyone send you a message request"><Toggle on={get("allowDMs")} onChange={v => update("allowDMs", v)} /></SettingRow>
      <Divider label="Data" />
      <SettingRow icon="📦" label="Download your data" desc="Get a copy of all your Nexus data">
        <button className="setting-action-btn" onClick={() => alert("Data export coming soon!")}>Request</button>
      </SettingRow>
    </div>
  );
}

function HelpSection() {
  const faqs = [
    { q: "How do I start a conversation?", a: "Go to Messages in the sidebar, click the + button, and search for any user by their username." },
    { q: "How do channels work?", a: "Channels are public or private rooms for group conversations. Click Channels in the rail to browse or create one." },
    { q: "What are Vibes?", a: "Vibes are status indicators shown as a coloured ring around your avatar. Set yours from the smiley face at the bottom of the rail." },
    { q: "How do Stories work?", a: "Stories appear at the top of your feed and expire after 24 hours. Tap your avatar ring to create a text or photo story." },
    { q: "Can I unsend a message?", a: "Yes — hover over any message you sent and click the trash icon. The message is replaced with a deleted notice for both sides." },
    { q: "How do I change my username?", a: "Go to your profile page, hover over your @username and click the pencil icon that appears." },
    { q: "How do I report a user?", a: "For urgent reports please contact us at support@nexus.app." },
  ];
  const [open, setOpen] = useState(null);
  return (
    <div className="settings-section-body">
      <Divider label="Frequently asked questions" />
      {faqs.map((faq, i) => (
        <div key={i} className={`faq-item ${open === i ? "open" : ""}`} onClick={() => setOpen(open === i ? null : i)}>
          <div className="faq-question">
            <span>{faq.q}</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ transform: open === i ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>
              <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {open === i && <div className="faq-answer">{faq.a}</div>}
        </div>
      ))}
      <Divider label="Contact" />
      <SettingRow icon="📧" label="Email support" desc="support@nexus.app">
        <button className="setting-action-btn" onClick={() => window.open("mailto:support@nexus.app")}>Email</button>
      </SettingRow>
      <SettingRow icon="🐛" label="Report a bug" desc="Help us improve Nexus">
        <button className="setting-action-btn" onClick={() => window.open("mailto:bugs@nexus.app?subject=Bug Report")}>Report</button>
      </SettingRow>
    </div>
  );
}

function LegalSection() {
  const [view, setView] = useState(null);
  const docs = {
    tos: {
      title: "Terms of Service",
      content: `Last updated: January 2025\n\n1. ACCEPTANCE OF TERMS\nBy accessing or using Nexus, you agree to be bound by these Terms of Service.\n\n2. ELIGIBILITY\nYou must be at least 13 years old to use Nexus.\n\n3. YOUR ACCOUNT\nYou are responsible for maintaining the confidentiality of your credentials and all activity under your account.\n\n4. ACCEPTABLE USE\nYou agree not to:\n• Post unlawful, harmful, or abusive content\n• Impersonate any person or entity\n• Upload malicious code\n• Collect data about other users without consent\n• Use the service for spam\n\n5. CONTENT OWNERSHIP\nYou retain ownership of content you post. By posting you grant Nexus a non-exclusive, worldwide, royalty-free licence to display and distribute that content within the platform.\n\n6. TERMINATION\nWe may suspend or terminate accounts that violate these terms at our discretion.\n\n7. DISCLAIMER\nThe service is provided "as is" without warranties of any kind.\n\n8. LIMITATION OF LIABILITY\nNexus shall not be liable for indirect, incidental, or consequential damages.\n\n9. CHANGES\nWe may update these terms at any time. Continued use constitutes acceptance.\n\n10. CONTACT\nlegal@nexus.app`,
    },
    privacy: {
      title: "Privacy Policy",
      content: `Last updated: January 2025\n\n1. INFORMATION WE COLLECT\n• Account info: username, email, profile photo\n• Content: posts, messages, stories, reactions\n• Usage data: pages visited, features used\n• Device info: browser type, IP address\n\n2. HOW WE USE YOUR INFORMATION\n• To provide and improve Nexus\n• To send notifications (with your permission)\n• To enforce our Terms of Service\n• To respond to support requests\n\n3. INFORMATION SHARING\nWe do not sell your data. We may share it with:\n• Service providers (e.g. Firebase/Google)\n• Law enforcement when required by law\n• Other users as part of normal platform use\n\n4. DATA RETENTION\nData is retained while your account is active. You may request deletion from Settings → Account.\n\n5. SECURITY\nWe implement industry-standard security measures.\n\n6. YOUR RIGHTS\nYou may access, correct, delete, or export your data.\n\n7. CONTACT\nprivacy@nexus.app`,
    },
    community: {
      title: "Community Guidelines",
      content: `BE KIND & RESPECTFUL\nTreat everyone with dignity. Personal attacks and harassment are never acceptable.\n\nNO HATE SPEECH\nContent promoting hatred based on race, religion, gender, sexual orientation, or disability is prohibited.\n\nNO HARASSMENT\nDo not stalk, threaten, or bully other users.\n\nKEEP IT LEGAL\nDon't post anything that violates the law.\n\nNO SPAM\nDon't flood channels with repeated messages or bot activity.\n\nPROTECT MINORS\nContent that endangers minors is strictly forbidden and will be reported to authorities.\n\nAUTHENTIC IDENTITY\nDon't impersonate real people or create fake accounts to evade bans.\n\nENFORCEMENT\nViolations may result in content removal, suspension, or permanent ban.`,
    },
  };
  if (view) {
    return (
      <div className="settings-section-body">
        <button className="settings-back-btn" onClick={() => setView(null)}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <div className="legal-doc">
          <h3 className="legal-doc-title">{docs[view].title}</h3>
          <pre className="legal-doc-body">{docs[view].content}</pre>
        </div>
      </div>
    );
  }
  return (
    <div className="settings-section-body">
      <Divider label="Documents" />
      <SettingRow icon="📋" label="Terms of Service" desc="Rules governing your use of Nexus"><button className="setting-action-btn" onClick={() => setView("tos")}>Read →</button></SettingRow>
      <SettingRow icon="🔒" label="Privacy Policy" desc="How we collect and use your data"><button className="setting-action-btn" onClick={() => setView("privacy")}>Read →</button></SettingRow>
      <SettingRow icon="🤝" label="Community Guidelines" desc="Standards for respectful behaviour"><button className="setting-action-btn" onClick={() => setView("community")}>Read →</button></SettingRow>
      <Divider label="Licenses" />
      <SettingRow icon="⚖️" label="Open source licenses" desc="Third-party software used in Nexus">
        <button className="setting-action-btn" onClick={() => alert("React, Firebase, date-fns and other open-source libraries are used under their respective licences.")}>View</button>
      </SettingRow>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="settings-section-body">
      <div className="about-hero">
        <div className="about-logo">
          <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
            <path d="M14 2C7.373 2 2 7.373 2 14c0 2.09.536 4.052 1.474 5.762L2 26l6.48-1.448A11.952 11.952 0 0014 26c6.627 0 12-5.373 12-12S20.627 2 14 2z" fill="currentColor"/>
          </svg>
        </div>
        <h2 className="about-name">Nexus</h2>
        <p className="about-tagline">Chat · Share · Connect</p>
        <span className="about-version">Version 2.0.0</span>
      </div>
      <Divider label="Stack" />
      <SettingRow icon="🚀" label="Version" desc="Current release"><span className="setting-badge">v2.0.0</span></SettingRow>
      <SettingRow icon="🛠️" label="Built with" desc="React 18, Firebase 10, date-fns"><span className="setting-badge">Web</span></SettingRow>
      <Divider label="Features in v2" />
      {[
        ["✦","Stories","24-hour photo & text stories"],
        ["💬","Group DMs","Group conversations with multiple people"],
        ["🎭","GIF & Sticker support","Powered by Giphy"],
        ["🎙️","Voice messages","Record and send audio"],
        ["🔥","Vibes","Express your mood with an animated ring"],
        ["📣","Reactions","React to posts and messages with emoji"],
      ].map(([icon,label,desc]) => <SettingRow key={label} icon={icon} label={label} desc={desc} />)}
    </div>
  );
}

export default function SettingsModal({ onClose }) {
  const { profile } = useAuth();
  const [active, setActive] = useState("account");
  const sectionMap = {
    account:       <AccountSection profile={profile} />,
    appearance:    <AppearanceSection />,
    notifications: <NotificationsSection />,
    privacy:       <PrivacySection />,
    help:          <HelpSection />,
    legal:         <LegalSection />,
    about:         <AboutSection />,
  };
  return (
    <div className="settings-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="settings-modal">
        <aside className="settings-nav">
          <div className="settings-nav-header">
            <span>Settings</span>
            <button className="icon-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-nav-user">
            <div className="settings-nav-avatar">
              {profile?.avatar
                ? <img src={profile.avatar} alt={profile.displayName} />
                : <div className="settings-nav-initials">{(profile?.displayName || "?").slice(0,2).toUpperCase()}</div>
              }
            </div>
            <div>
              <span className="settings-nav-name">{profile?.displayName}</span>
              <span className="settings-nav-handle">@{profile?.username}</span>
            </div>
          </div>
          <nav className="settings-nav-list">
            {SECTIONS.map(s => (
              <button key={s.id} className={`settings-nav-btn ${active === s.id ? "active" : ""}`} onClick={() => setActive(s.id)}>
                <span className="settings-nav-icon">{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </aside>
        <main className="settings-content">
          <div className="settings-content-header">
            <h2>{SECTIONS.find(s => s.id === active)?.label}</h2>
          </div>
          <div className="settings-content-body">{sectionMap[active]}</div>
        </main>
      </div>
    </div>
  );
}
