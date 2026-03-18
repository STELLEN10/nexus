import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  updatePassword, updateEmail,
  reauthenticateWithCredential, EmailAuthProvider, deleteUser
} from "firebase/auth";

// ─── Shared primitives ────────────────────────────────────
const SECTIONS = [
  { id: "account",       icon: "👤", label: "Account"          },
  { id: "appearance",    icon: "🎨", label: "Appearance"        },
  { id: "notifications", icon: "🔔", label: "Notifications"     },
  { id: "privacy",       icon: "🔒", label: "Privacy & Safety"  },
  { id: "help",          icon: "💬", label: "Help & Support"    },
  { id: "legal",         icon: "📄", label: "Terms & Legal"     },
  { id: "about",         icon: "✦",  label: "About Nexus"       },
];

function Divider({ label }) {
  return (
    <div style={{ padding: "20px 24px 8px", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-3)", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function Row({ icon, label, desc, right, danger }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, padding: "12px 24px",
      background: danger ? "transparent" : undefined,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        {icon && <span style={{ fontSize: 17, width: 24, textAlign: "center", flexShrink: 0 }}>{icon}</span>}
        <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: danger ? "var(--red)" : "var(--text)" }}>{label}</span>
          {desc && <span style={{ fontSize: 12, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{desc}</span>}
        </div>
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

function ActionBtn({ children, danger, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: danger ? "rgba(239,68,68,.1)" : "var(--bg-2)",
        border: `1.5px solid ${danger ? "rgba(239,68,68,.3)" : "var(--border-2)"}`,
        borderRadius: "var(--r-md)",
        padding: "6px 14px",
        color: danger ? "var(--red)" : "var(--text-2)",
        fontFamily: "var(--font)",
        fontSize: 12,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap",
        transition: "all .12s",
      }}
    >
      {children}
    </button>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      type="button"
      style={{
        width: 40, height: 22,
        background: on ? "var(--accent)" : "var(--bg-3)",
        border: `1.5px solid ${on ? "var(--accent)" : "var(--border-2)"}`,
        borderRadius: 11,
        cursor: "pointer",
        position: "relative",
        transition: "all .2s",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute",
        top: 2,
        left: on ? 20 : 2,
        width: 14, height: 14,
        background: on ? "#fff" : "var(--text-3)",
        borderRadius: "50%",
        transition: "all .2s cubic-bezier(.4,0,.2,1)",
      }} />
    </button>
  );
}

function Badge({ children }) {
  return (
    <span style={{
      background: "var(--bg-2)",
      border: "1.5px solid var(--border)",
      borderRadius: "var(--r-sm)",
      padding: "3px 10px",
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-3)",
    }}>
      {children}
    </span>
  );
}

function InlineForm({ children, onSubmit }) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex", flexDirection: "column", gap: 8,
        padding: "8px 24px 16px",
        background: "var(--bg)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        marginBottom: 4,
      }}
    >
      {children}
    </form>
  );
}

function Input({ type = "text", placeholder, value, onChange, required }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      style={{
        background: "var(--bg-2)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--r-md)",
        padding: "10px 14px",
        color: "var(--text)",
        fontFamily: "var(--font)",
        fontSize: 13,
        outline: "none",
        width: "100%",
        marginTop: 4,
      }}
      onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
      onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
    />
  );
}

function StatusMsg({ type, text }) {
  if (!text) return null;
  const isSuccess = type === "success";
  return (
    <div style={{
      borderRadius: "var(--r-md)", padding: "8px 12px",
      fontSize: 12, fontWeight: 600,
      background: isSuccess ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)",
      border: `1px solid ${isSuccess ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.25)"}`,
      color: isSuccess ? "#86efac" : "#fca5a5",
    }}>
      {text}
    </div>
  );
}

// ─── Section: Account ─────────────────────────────────────
function AccountSection({ profile }) {
  const { user, updateUserProfile, logout } = useAuth();
  const [tab, setTab] = useState(null);
  const [form, setForm] = useState({ curPw: "", newEmail: "", newPw: "", confirmPw: "", deleteConfirm: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openTab = (t) => { setTab(tab === t ? null : t); setMsg({ type: "", text: "" }); };

  const reauth = async () => {
    const cred = EmailAuthProvider.credential(user.email, form.curPw);
    await reauthenticateWithCredential(user, cred);
  };

  const changeEmail = async (e) => {
    e.preventDefault(); setBusy(true); setMsg({ type: "", text: "" });
    try {
      await reauth();
      await updateEmail(user, form.newEmail);
      await updateUserProfile({ email: form.newEmail });
      setMsg({ type: "success", text: "Email updated." });
      setForm(f => ({ ...f, curPw: "", newEmail: "" }));
      setTab(null);
    } catch (err) {
      const m = { "auth/wrong-password": "Wrong password.", "auth/email-already-in-use": "Email already in use.", "auth/requires-recent-login": "Please sign out and back in, then try again." };
      setMsg({ type: "error", text: m[err.code] || "Failed to update email." });
    } finally { setBusy(false); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (form.newPw !== form.confirmPw) { setMsg({ type: "error", text: "Passwords don't match." }); return; }
    if (form.newPw.length < 6) { setMsg({ type: "error", text: "Password needs 6+ characters." }); return; }
    setBusy(true); setMsg({ type: "", text: "" });
    try {
      await reauth();
      await updatePassword(user, form.newPw);
      setMsg({ type: "success", text: "Password changed." });
      setForm(f => ({ ...f, curPw: "", newPw: "", confirmPw: "" }));
      setTab(null);
    } catch (err) {
      setMsg({ type: "error", text: err.code === "auth/wrong-password" ? "Wrong password." : "Failed to change password." });
    } finally { setBusy(false); }
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    if (form.deleteConfirm !== profile?.username) {
      setMsg({ type: "error", text: `Type your exact username "${profile?.username}" to confirm.` });
      return;
    }
    setBusy(true);
    try {
      await reauth();
      await deleteUser(user);
      logout();
    } catch (err) {
      setMsg({ type: "error", text: err.code === "auth/wrong-password" ? "Wrong password." : "Failed to delete account." });
      setBusy(false);
    }
  };

  return (
    <>
      <Divider label="Profile info" />

      <Row
        icon="📧" label="Email address" desc={user?.email}
        right={<ActionBtn onClick={() => openTab("email")}>Change</ActionBtn>}
      />
      {tab === "email" && (
        <InlineForm onSubmit={changeEmail}>
          <Input type="password" placeholder="Current password" value={form.curPw} onChange={e => set("curPw", e.target.value)} required />
          <Input type="email" placeholder="New email address" value={form.newEmail} onChange={e => set("newEmail", e.target.value)} required />
          <StatusMsg type={msg.type} text={msg.text} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <ActionBtn onClick={() => setTab(null)}>Cancel</ActionBtn>
            <button type="submit" className="btn-primary-sm" disabled={busy}>{busy ? "Saving…" : "Update email"}</button>
          </div>
        </InlineForm>
      )}

      <Row
        icon="🔑" label="Password" desc="Change your account password"
        right={<ActionBtn onClick={() => openTab("password")}>Change</ActionBtn>}
      />
      {tab === "password" && (
        <InlineForm onSubmit={changePw}>
          <Input type="password" placeholder="Current password" value={form.curPw} onChange={e => set("curPw", e.target.value)} required />
          <Input type="password" placeholder="New password (min 6 chars)" value={form.newPw} onChange={e => set("newPw", e.target.value)} required />
          <Input type="password" placeholder="Confirm new password" value={form.confirmPw} onChange={e => set("confirmPw", e.target.value)} required />
          <StatusMsg type={msg.type} text={msg.text} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <ActionBtn onClick={() => setTab(null)}>Cancel</ActionBtn>
            <button type="submit" className="btn-primary-sm" disabled={busy}>{busy ? "Saving…" : "Update password"}</button>
          </div>
        </InlineForm>
      )}

      <Divider label="Danger zone" />

      <Row
        icon="🗑️" label="Delete account" desc="Permanently delete your account and all data" danger
        right={<ActionBtn danger onClick={() => openTab("delete")}>Delete</ActionBtn>}
      />
      {tab === "delete" && (
        <InlineForm onSubmit={deleteAccount}>
          <div style={{ fontSize: 12, color: "#fca5a5", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", borderRadius: "var(--r-md)", padding: "10px 12px", lineHeight: 1.55 }}>
            ⚠️ This is <strong>permanent</strong>. All posts, messages, and data will be deleted and cannot be recovered.
          </div>
          <Input type="password" placeholder="Enter your password to confirm" value={form.curPw} onChange={e => set("curPw", e.target.value)} required />
          <Input type="text" placeholder={`Type your username: ${profile?.username}`} value={form.deleteConfirm} onChange={e => set("deleteConfirm", e.target.value)} required />
          <StatusMsg type={msg.type} text={msg.text} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <ActionBtn onClick={() => setTab(null)}>Cancel</ActionBtn>
            <button type="submit" disabled={busy} style={{ background: "var(--red)", border: "none", borderRadius: "var(--r-md)", padding: "7px 16px", color: "#fff", fontFamily: "var(--font)", fontSize: 12, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1 }}>
              {busy ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </InlineForm>
      )}
    </>
  );
}

// ─── Section: Appearance ──────────────────────────────────
function AppearanceSection() {
  const [compact, setCompact] = useState(() => localStorage.getItem("nexus_compact") === "true");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("nexus_fontsize") || "medium");

  const handleCompact = (v) => { setCompact(v); localStorage.setItem("nexus_compact", v); };
  const handleFont = (s) => {
    setFontSize(s); localStorage.setItem("nexus_fontsize", s);
    document.documentElement.style.setProperty("--chat-font-size", { small: "13px", medium: "14px", large: "16px" }[s]);
  };

  return (
    <>
      <Divider label="Display" />
      <Row icon="📐" label="Compact mode" desc="Show messages closer together" right={<Toggle on={compact} onChange={handleCompact} />} />

      <Row
        icon="🔡" label="Font size" desc="Adjust chat text size"
        right={
          <div style={{ display: "flex", gap: 4 }}>
            {["Small", "Medium", "Large"].map(s => {
              const k = s.toLowerCase();
              return (
                <button key={k} onClick={() => handleFont(k)} style={{
                  background: fontSize === k ? "var(--accent-bg)" : "var(--bg-2)",
                  border: `1.5px solid ${fontSize === k ? "var(--accent-bd)" : "var(--border)"}`,
                  borderRadius: "var(--r-sm)", padding: "5px 10px",
                  fontFamily: "var(--font)", fontSize: 11, fontWeight: 700,
                  color: fontSize === k ? "var(--accent-2)" : "var(--text-3)",
                  cursor: "pointer",
                }}>
                  {s}
                </button>
              );
            })}
          </div>
        }
      />

      <Divider label="Theme" />
      <Row icon="🌑" label="Dark mode" desc="Nexus always uses a dark theme for the best experience" right={<Badge>Always on</Badge>} />
    </>
  );
}

// ─── Section: Notifications ───────────────────────────────
function NotificationsSection() {
  const load = () => { try { return JSON.parse(localStorage.getItem("nexus_notif_prefs") || "{}"); } catch { return {}; } };
  const defaults = { messages: true, mentions: true, follows: true, reactions: false, sounds: false };
  const [prefs, setPrefs] = useState(load);
  const get = (k) => prefs[k] !== undefined ? prefs[k] : defaults[k];
  const toggle = (k) => {
    const next = { ...prefs, [k]: !get(k) };
    setPrefs(next);
    localStorage.setItem("nexus_notif_prefs", JSON.stringify(next));
  };

  return (
    <>
      <Divider label="Push notifications" />
      <Row icon="💬" label="Direct messages"  desc="New messages from people" right={<Toggle on={get("messages")} onChange={() => toggle("messages")} />} />
      <Row icon="📣" label="Mentions"          desc="When someone mentions you" right={<Toggle on={get("mentions")} onChange={() => toggle("mentions")} />} />
      <Row icon="👤" label="New followers"     desc="When someone follows you" right={<Toggle on={get("follows")} onChange={() => toggle("follows")} />} />
      <Row icon="❤️" label="Reactions"         desc="Reactions on your posts" right={<Toggle on={get("reactions")} onChange={() => toggle("reactions")} />} />
      <Divider label="Sound" />
      <Row icon="🔊" label="Notification sounds" desc="Play a sound for new messages" right={<Toggle on={get("sounds")} onChange={() => toggle("sounds")} />} />
    </>
  );
}

// ─── Section: Privacy ─────────────────────────────────────
function PrivacySection() {
  const load = () => { try { return JSON.parse(localStorage.getItem("nexus_privacy_prefs") || "{}"); } catch { return {}; } };
  const defaults = { showOnline: true, readReceipts: true, allowDMs: true };
  const [prefs, setPrefs] = useState(load);
  const get = (k) => prefs[k] !== undefined ? prefs[k] : defaults[k];
  const toggle = (k) => {
    const next = { ...prefs, [k]: !get(k) };
    setPrefs(next);
    localStorage.setItem("nexus_privacy_prefs", JSON.stringify(next));
  };

  return (
    <>
      <Divider label="Visibility" />
      <Row icon="🟢" label="Show online status"   desc="Others can see when you're active" right={<Toggle on={get("showOnline")} onChange={() => toggle("showOnline")} />} />
      <Row icon="✓✓" label="Read receipts"        desc="Show when you've read messages" right={<Toggle on={get("readReceipts")} onChange={() => toggle("readReceipts")} />} />
      <Divider label="Messaging" />
      <Row icon="✉️" label="Allow message requests" desc="Let anyone send you a DM request" right={<Toggle on={get("allowDMs")} onChange={() => toggle("allowDMs")} />} />
      <Divider label="Data" />
      <Row icon="📦" label="Download your data" desc="Export a copy of all your Nexus data"
        right={<ActionBtn onClick={() => alert("Data export coming soon!")}>Request</ActionBtn>}
      />
    </>
  );
}

// ─── Section: Help ────────────────────────────────────────
const FAQS = [
  { q: "How do I start a conversation?", a: "Go to Messages in the sidebar, click the + button, and search for any user by username." },
  { q: "How do channels work?", a: "Channels are public or private group rooms. Click Channels in the rail to browse or create one." },
  { q: "What are Vibes?", a: "Vibes are animated status rings around your avatar. Set yours with the smiley button at the bottom of the rail." },
  { q: "How do Stories work?", a: "Stories appear at the top of the feed and expire after 24 hours. Tap your avatar ring to create one." },
  { q: "Can I unsend a message?", a: "Yes — hover over a message you sent and click the trash icon. Both sides see a 'deleted' notice." },
  { q: "How do I change my username?", a: "On your profile page, hover over your @username and click the pencil icon that appears." },
  { q: "How do I report someone?", a: "Contact us at support@nexus.app for urgent reports." },
];

function HelpSection() {
  const [open, setOpen] = useState(null);
  return (
    <>
      <Divider label="Frequently asked questions" />
      {FAQS.map((faq, i) => (
        <div key={i} onClick={() => setOpen(open === i ? null : i)} style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 24px", fontSize: 13, fontWeight: 600 }}>
            <span>{faq.q}</span>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ transform: open === i ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>
              <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {open === i && (
            <div style={{ padding: "0 24px 14px", paddingTop: 4, fontSize: 13, color: "var(--text-2)", lineHeight: 1.65, borderTop: "1px solid var(--border)" }}>
              {faq.a}
            </div>
          )}
        </div>
      ))}
      <Divider label="Contact" />
      <Row icon="📧" label="Email support" desc="support@nexus.app" right={<ActionBtn onClick={() => window.open("mailto:support@nexus.app")}>Email</ActionBtn>} />
      <Row icon="🐛" label="Report a bug" desc="Help us squash issues" right={<ActionBtn onClick={() => window.open("mailto:bugs@nexus.app?subject=Bug%20Report")}>Report</ActionBtn>} />
    </>
  );
}

// ─── Section: Legal ───────────────────────────────────────
const LEGAL_DOCS = {
  tos: {
    title: "Terms of Service",
    body: `Last updated: January 2025

1. ACCEPTANCE
By using Nexus you agree to these terms. If you disagree, please stop using the service.

2. ELIGIBILITY
You must be 13 or older to use Nexus.

3. YOUR ACCOUNT
You are responsible for all activity under your account. Keep your credentials secure and notify us of any unauthorised use.

4. ACCEPTABLE USE
You agree NOT to:
• Post unlawful, harmful, harassing, or hateful content
• Impersonate any person or organisation
• Upload malware or attempt to hack the service
• Scrape or collect other users' data without consent
• Use the service for unsolicited commercial messaging

5. CONTENT
You keep ownership of what you post. By posting you grant Nexus a non-exclusive, worldwide, royalty-free licence to display and distribute it within the platform.

6. TERMINATION
We may suspend or permanently ban accounts that violate these terms.

7. DISCLAIMER
Service is provided "as is" without warranties of any kind.

8. LIABILITY
Nexus is not liable for indirect, incidental, or consequential damages.

9. CHANGES
Terms may be updated at any time. Continued use means acceptance.

Contact: legal@nexus.app`,
  },
  privacy: {
    title: "Privacy Policy",
    body: `Last updated: January 2025

1. DATA WE COLLECT
• Account: username, email, profile photo
• Content: posts, messages, stories, reactions
• Usage: features used, pages visited, session duration
• Device: browser type, IP address, OS

2. HOW WE USE IT
• To operate and improve the Nexus service
• To deliver notifications you've opted into
• To enforce our Terms of Service
• To respond to your support requests

3. SHARING
We never sell your data. We may share it with:
• Infrastructure providers (Firebase / Google Cloud)
• Law enforcement when legally required
• Other users as part of normal platform operation (e.g. your public profile)

4. RETENTION
Data is kept while your account is active. Delete your account from Settings → Account to remove your data.

5. SECURITY
We use industry-standard security. No internet transmission is 100% secure.

6. YOUR RIGHTS
Access · Correct · Delete · Export your data at any time.

7. COOKIES
Used to keep you signed in and understand platform usage.

8. CHILDREN
Nexus is not for users under 13. We don't knowingly collect data from children.

Contact: privacy@nexus.app`,
  },
  community: {
    title: "Community Guidelines",
    body: `BE KIND & RESPECTFUL
Treat everyone with dignity. Disagreements are fine — personal attacks are not.

NO HATE SPEECH
Content targeting people based on race, religion, gender, sexuality, disability, or nationality is banned.

NO HARASSMENT
No stalking, threatening, or sustained bullying of any user.

KEEP IT LEGAL
No copyright infringement, no illegal activity, no stolen private content.

NO SPAM
No flood posting, no bots, no unsolicited promotions.

PROTECT MINORS
Any content that sexualises or endangers minors is strictly forbidden and will be reported to authorities immediately.

AUTHENTIC IDENTITY
No impersonation. No ban-evasion accounts.

REPORTING
Use the report feature or email support@nexus.app. All reports are reviewed.

ENFORCEMENT
Violations may result in content removal, temporary suspension, or permanent ban depending on severity.`,
  },
};

function LegalSection() {
  const [view, setView] = useState(null);
  if (view) {
    const doc = LEGAL_DOCS[view];
    return (
      <>
        <button
          onClick={() => setView(null)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "var(--accent-2)", fontFamily: "var(--font)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "16px 24px 8px" }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <div style={{ padding: "0 24px 32px" }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, letterSpacing: "-.02em" }}>{doc.title}</h3>
          <pre style={{ fontFamily: "var(--font)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{doc.body}</pre>
        </div>
      </>
    );
  }
  return (
    <>
      <Divider label="Documents" />
      <Row icon="📋" label="Terms of Service"     desc="Rules governing your use of Nexus"  right={<ActionBtn onClick={() => setView("tos")}>Read →</ActionBtn>} />
      <Row icon="🔒" label="Privacy Policy"       desc="How we handle your data"             right={<ActionBtn onClick={() => setView("privacy")}>Read →</ActionBtn>} />
      <Row icon="🤝" label="Community Guidelines" desc="Standards for a healthy community"   right={<ActionBtn onClick={() => setView("community")}>Read →</ActionBtn>} />
      <Divider label="Licenses" />
      <Row icon="⚖️" label="Open-source licences" desc="React, Firebase, date-fns and others"
        right={<ActionBtn onClick={() => alert("This app uses React 18, Firebase 10, and date-fns, each under their respective open-source licences.")}>View</ActionBtn>}
      />
    </>
  );
}

// ─── Section: About ───────────────────────────────────────
function AboutSection() {
  const features = [
    ["✦", "Stories",            "24-hour photo & text stories"],
    ["💬", "Group DMs",         "Conversations with multiple people"],
    ["🎭", "GIFs & Stickers",   "Powered by Giphy"],
    ["🎙️","Voice messages",    "Record and send audio clips"],
    ["🔥", "Vibes",             "Animated mood rings on avatars"],
    ["📣", "Reactions",         "Emoji reactions on posts & messages"],
    ["🔔", "Notifications",     "Real-time push alerts"],
  ];
  return (
    <>
      {/* Hero */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 24px 20px", borderBottom: "1px solid var(--border)", gap: 6 }}>
        <div style={{ width: 60, height: 60, background: "var(--accent-bg)", border: "1.5px solid var(--accent-bd)", borderRadius: "var(--r-xl)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-2)", marginBottom: 6 }}>
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
            <path d="M14 2C7.373 2 2 7.373 2 14c0 2.09.536 4.052 1.474 5.762L2 26l6.48-1.448A11.952 11.952 0 0014 26c6.627 0 12-5.373 12-12S20.627 2 14 2z" fill="currentColor"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.03em", background: "linear-gradient(135deg, var(--accent-2), var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Nexus</h2>
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>Chat · Share · Connect</p>
        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)", marginTop: 2 }}>Version 2.0.0</span>
      </div>

      <Divider label="Build info" />
      <Row icon="🚀" label="Version"    desc="Latest stable release"             right={<Badge>v2.0.0</Badge>} />
      <Row icon="🛠️" label="Stack"     desc="React 18 · Firebase 10 · date-fns" right={<Badge>Web</Badge>} />

      <Divider label="What's in v2" />
      {features.map(([icon, label, desc]) => (
        <Row key={label} icon={icon} label={label} desc={desc} />
      ))}
    </>
  );
}

// ─── Root modal ───────────────────────────────────────────
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
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", backdropFilter: "blur(5px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        display: "flex",
        width: "100%", maxWidth: 860,
        height: "min(660px, 92vh)",
        background: "var(--bg-1)",
        border: "1.5px solid var(--border-2)",
        borderRadius: "var(--r-xl)",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,.9)",
        animation: "settings-enter .22s cubic-bezier(.16,1,.3,1)",
      }}>

        {/* ── Nav sidebar ── */}
        <aside style={{ width: 220, flexShrink: 0, background: "var(--bg)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 16px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-.02em" }}>Settings</span>
            <button className="icon-btn" onClick={onClose}>✕</button>
          </div>
          {/* User pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {profile?.avatar
                ? <img src={profile.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-2)" }}>{(profile?.displayName || "?").slice(0,2).toUpperCase()}</span>
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.displayName}</span>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>@{profile?.username}</span>
            </div>
          </div>
          {/* Nav items */}
          <nav style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "9px 10px",
                  background: active === s.id ? "var(--accent-bg)" : "transparent",
                  border: "none",
                  borderRadius: "var(--r-md)",
                  color: active === s.id ? "var(--accent-2)" : "var(--text-2)",
                  fontFamily: "var(--font)", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", textAlign: "left",
                  marginBottom: 2,
                  transition: "all .12s",
                }}
              >
                <span style={{ fontSize: 15, width: 20, textAlign: "center", flexShrink: 0 }}>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Content panel ── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          {/* Content header */}
          <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-.02em" }}>
              {SECTIONS.find(s => s.id === active)?.label}
            </h2>
          </div>
          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            {content[active]}
          </div>
        </main>
      </div>
    </div>
  );
}
