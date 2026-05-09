// src/components/shared/WhatsNewModal.js
// Shows once per version after login. Dismiss stored in localStorage.
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import NexusLogo from "./NexusLogo";

const VERSION = "2.0.0";
const STORAGE_KEY = `nexus_whats_new_seen_${VERSION}`;

const HIGHLIGHTS = [
  { icon: "📖", color: "#8b5cf6", title: "Stories", desc: "24-hour photo & text stories that disappear." },
  { icon: "💬", color: "#06b6d4", title: "Group DMs", desc: "Multi-person conversations with anyone." },
  { icon: "🎭", color: "#ec4899", title: "GIFs & Stickers", desc: "Full Giphy library plus custom uploads." },
  { icon: "🎙️", color: "#f97316", title: "Voice Messages", desc: "Record and send audio clips in any chat." },
  { icon: "🔥", color: "#f43f5e", title: "Vibes", desc: "Animated mood rings that let people know how you're feeling." },
  { icon: "🪙", color: "#f59e0b", title: "Coins & Tips", desc: "Reward creators with in-app coins." },
  { icon: "🎨", color: "#a855f7", title: "Custom Themes", desc: "6 accent colours + light/dark mode." },
  { icon: "🖼️", color: "#22c55e", title: "Chat Wallpapers", desc: "Personalise every DM conversation." },
];

export default function WhatsNewModal() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Slight delay so the app fully loads first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setClosing(true);
    localStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => { setVisible(false); setClosing(false); }, 280);
  };

  if (!visible) return null;

  return createPortal(
    <div
      onClick={e => e.target === e.currentTarget && dismiss()}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,.82)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        animation: closing ? "wn-fade-out .28s ease forwards" : "wn-fade-in .35s ease",
      }}
    >
      <div
        style={{
          background: "var(--bg-1)",
          border: "1.5px solid var(--border-2)",
          borderRadius: "var(--r-xl)",
          width: "100%", maxWidth: 520,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          boxShadow: "0 0 80px var(--glow-purple), 0 32px 80px rgba(0,0,0,.85)",
          animation: closing ? "wn-slide-out .28s cubic-bezier(.4,0,1,1) forwards" : "wn-slide-in .38s cubic-bezier(.16,1,.3,1)",
        }}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, rgba(124,58,237,.25) 0%, rgba(6,182,212,.15) 50%, rgba(236,72,153,.15) 100%)",
          padding: "32px 28px 24px",
          textAlign: "center",
          position: "relative",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <div style={{
            width: 64, height: 64,
            background: "radial-gradient(circle, rgba(124,58,237,.3), transparent 70%)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
            filter: "drop-shadow(0 0 20px var(--glow-purple))",
          }}>
            <NexusLogo size={44} />
          </div>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "var(--accent-bg)", border: "1px solid var(--accent-bd)",
            borderRadius: 20, padding: "3px 12px",
            fontSize: 11, fontWeight: 700, color: "var(--accent-2)",
            letterSpacing: ".08em", textTransform: "uppercase",
            marginBottom: 10,
          }}>
            ✦ Version {VERSION}
          </div>

          <h2 style={{
            fontSize: 26, fontWeight: 800, letterSpacing: "-.04em",
            background: "linear-gradient(135deg, var(--accent-2), var(--cyan))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", marginBottom: 6,
          }}>
            Welcome to Nexus v2
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>
            A completely rebuilt experience. Here's everything that's new.
          </p>

          <button
            onClick={dismiss}
            style={{
              position: "absolute", top: 16, right: 16,
              width: 32, height: 32,
              background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)",
              borderRadius: "50%", color: "var(--text-2)", fontSize: 14,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.16)"; e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.08)"; e.currentTarget.style.color = "var(--text-2)"; }}
          >
            ✕
          </button>
        </div>

        {/* Feature grid */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "20px 20px 0",
          scrollbarWidth: "thin",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}>
            {HIGHLIGHTS.map((h, i) => (
              <div
                key={h.title}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                  padding: "14px 14px",
                  animation: `wn-item-in .4s cubic-bezier(.16,1,.3,1) ${i * 45}ms both`,
                  transition: "border-color .15s, box-shadow .15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${h.color}55`;
                  e.currentTarget.style.boxShadow = `0 0 16px ${h.color}22`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: "var(--r-md)", flexShrink: 0,
                  background: `${h.color}20`, border: `1.5px solid ${h.color}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                  boxShadow: `0 0 12px ${h.color}30`,
                }}>
                  {h.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{h.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>{h.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "20px 24px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          flexShrink: 0,
        }}>
          <button
            onClick={dismiss}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              border: "none", borderRadius: "var(--r-lg)",
              padding: "13px", color: "#fff",
              fontFamily: "var(--font)", fontSize: 14, fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 0 24px var(--glow-purple)",
              transition: "all .15s",
              letterSpacing: "-.01em",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 36px var(--glow-purple)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 24px var(--glow-purple)"; e.currentTarget.style.transform = "none"; }}
          >
            Let's go ✦
          </button>
          <p style={{ fontSize: 11, color: "var(--text-3)" }}>
            This won't show again for v{VERSION}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes wn-fade-in  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes wn-fade-out { from { opacity: 1 } to { opacity: 0 } }
        @keyframes wn-slide-in { from { opacity: 0; transform: scale(.94) translateY(16px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes wn-slide-out{ from { opacity: 1; transform: scale(1) translateY(0) } to { opacity: 0; transform: scale(.94) translateY(16px) } }
        @keyframes wn-item-in  { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>,
    document.body
  );
}
