// src/components/vibe/VibeAvatar.js
import { useState } from "react";
import { useUserVibe } from "../../hooks/useVibe";
import AvatarFullView from "../shared/AvatarFullView";

const COLORS = ["#f43f5e","#f97316","#eab308","#22c55e","#06b6d4","#8b5cf6","#ec4899","#14b8a6"];

export default function VibeAvatar({ user, uid, size = 36, online, showVibe = true, tappable = false }) {
  const vibe = useUserVibe(showVibe ? uid : null);
  const [showFull, setShowFull] = useState(false);
  const name = user?.displayName || user?.username || "?";
  const initials = name.slice(0, 2).toUpperCase();
  const color = COLORS[name.charCodeAt(0) % COLORS.length];

  const handleClick = (e) => {
    if (!tappable) return;
    e.stopPropagation();
    setShowFull(true);
  };

  return (
    <>
      <div
        style={{ position: "relative", flexShrink: 0, width: size, height: size }}
        className={tappable ? "avatar-tappable" : ""}
        onClick={handleClick}
      >
        {/* Vibe pulse ring */}
        {vibe && showVibe && (
          <div className="vibe-pulse-ring" style={{
            position: "absolute", inset: -3, borderRadius: "50%",
            border: `2px solid ${vibe.color}`,
            boxShadow: `0 0 8px ${vibe.color}88`,
            animation: "vibe-pulse 2s ease-in-out infinite",
            zIndex: 0,
          }} />
        )}

        {/* Avatar */}
        <div style={{ position: "relative", zIndex: 1, width: size, height: size, borderRadius: "50%", overflow: "hidden" }}>
          {user?.avatar
            ? <img src={user.avatar} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.35, fontWeight: 700, userSelect: "none" }}>{initials}</div>
          }
        </div>

        {/* Vibe emoji badge */}
        {vibe && showVibe && (
          <div style={{
            position: "absolute", bottom: -2, right: -2,
            width: size * 0.42, height: size * 0.42,
            background: vibe.color, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.22, border: `2px solid var(--bg)`, zIndex: 2,
          }}>
            {vibe.emoji}
          </div>
        )}

        {/* Online dot */}
        {!vibe && online !== undefined && (
          <span style={{
            position: "absolute", bottom: 0, right: 0,
            width: size * 0.28, height: size * 0.28, borderRadius: "50%",
            background: online ? "#22c55e" : "#3f3f46",
            border: `${Math.max(1.5, size * 0.04)}px solid var(--bg)`, zIndex: 2,
          }} />
        )}
      </div>

      {showFull && <AvatarFullView user={user} onClose={() => setShowFull(false)} />}
    </>
  );
}
