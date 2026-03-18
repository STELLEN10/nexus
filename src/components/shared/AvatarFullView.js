// src/components/shared/AvatarFullView.js
import { createPortal } from "react-dom";

const COLORS = ["#f43f5e","#f97316","#eab308","#22c55e","#06b6d4","#8b5cf6","#ec4899","#14b8a6"];

export default function AvatarFullView({ user, onClose }) {
  const name = user?.displayName || user?.username || "?";
  const handle = user?.username ? `@${user.username}` : null;
  const color = COLORS[(name.charCodeAt(0) || 0) % COLORS.length];

  return createPortal(
    <div className="avatar-full-overlay" onClick={onClose}>
      <button className="avatar-full-close" onClick={onClose}>✕</button>

      {user?.avatar
        ? <img src={user.avatar} alt={name} className="avatar-full-img" onClick={e => e.stopPropagation()} />
        : <div className="avatar-full-initials" style={{ background: color }} onClick={e => e.stopPropagation()}>
            {name.slice(0, 2).toUpperCase()}
          </div>
      }

      <span className="avatar-full-name">{name}</span>
      {handle && <span className="avatar-full-handle">{handle}</span>}
    </div>,
    document.body
  );
}
