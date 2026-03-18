import { useState } from "react";
import { useVibe, VIBES } from "../../hooks/useVibe";
import { useAuth } from "../../context/AuthContext";

export default function VibePicker({ onClose }) {
  const { myVibe, setVibe } = useVibe();
  const { profile } = useAuth();
  const [hovering, setHovering] = useState(null);
  const [setting, setSetting] = useState(false);

  const preview = hovering || myVibe;
  const initials = (profile?.displayName || "?").slice(0, 2).toUpperCase();

  const handleSelect = async (vibe) => {
    if (setting) return;
    setSetting(true);
    await setVibe(myVibe?.emoji === vibe.emoji ? null : vibe);
    setSetting(false);
    onClose?.();
  };

  const handleClear = async () => {
    if (setting) return;
    setSetting(true);
    await setVibe(null);
    setSetting(false);
    onClose?.();
  };

  return (
    <div className="vp-root">

      {/* ── Live avatar preview ── */}
      <div className="vp-preview" style={{
        background: preview
          ? `radial-gradient(ellipse at 50% 0%, ${preview.color}22 0%, transparent 70%)`
          : "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,.12) 0%, transparent 70%)",
      }}>
        <div className="vp-avatar-wrap">
          {/* Animated ring */}
          <div
            className={`vp-ring ${preview ? "active" : ""}`}
            style={{ borderColor: preview?.color || "var(--border-2)", boxShadow: preview ? `0 0 18px ${preview.color}88, 0 0 40px ${preview.color}44` : "none" }}
          />
          {/* Avatar */}
          <div className="vp-avatar">
            {profile?.avatar
              ? <img src={profile.avatar} alt={profile.displayName} />
              : <span>{initials}</span>
            }
          </div>
          {/* Emoji badge */}
          {preview && (
            <div
              className="vp-badge"
              style={{ background: preview.color, boxShadow: `0 0 12px ${preview.color}` }}
            >
              {preview.emoji}
            </div>
          )}
        </div>

        <div className="vp-preview-text">
          <span className="vp-preview-name">{profile?.displayName}</span>
          {preview
            ? <span className="vp-preview-vibe" style={{ color: preview.color }}>{preview.emoji} {preview.label}</span>
            : <span className="vp-preview-vibe" style={{ color: "var(--text-3)" }}>No vibe set</span>
          }
        </div>
      </div>

      {/* ── Vibe grid ── */}
      <div className="vp-grid">
        {VIBES.map((v, i) => {
          const isActive = myVibe?.emoji === v.emoji;
          return (
            <button
              key={v.emoji}
              className={`vp-card ${isActive ? "active" : ""}`}
              style={{
                "--vibe-color": v.color,
                animationDelay: `${i * 30}ms`,
              }}
              onClick={() => handleSelect(v)}
              onMouseEnter={() => setHovering(v)}
              onMouseLeave={() => setHovering(null)}
              disabled={setting}
            >
              <span className="vp-card-emoji">{v.emoji}</span>
              <span className="vp-card-label">{v.label}</span>
              {isActive && <span className="vp-card-active-dot" style={{ background: v.color }} />}
            </button>
          );
        })}
      </div>

      {/* ── Footer ── */}
      {myVibe && (
        <div className="vp-footer">
          <button className="vp-clear-btn" onClick={handleClear} disabled={setting}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Clear vibe
          </button>
        </div>
      )}
    </div>
  );
}
