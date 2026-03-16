const COLORS = ["#f43f5e","#f97316","#eab308","#22c55e","#06b6d4","#8b5cf6","#ec4899","#14b8a6"];
export default function Avatar({ user, size = 36, online }) {
  const name = user?.displayName || user?.username || "?";
  const initials = name.slice(0, 2).toUpperCase();
  const color = COLORS[name.charCodeAt(0) % COLORS.length];
  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      {user?.avatar
        ? <img src={user.avatar} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }} />
        : <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.35, fontWeight: 700, userSelect: "none" }}>{initials}</div>
      }
      {online !== undefined && (
        <span style={{ position: "absolute", bottom: 0, right: 0, width: size * 0.28, height: size * 0.28, borderRadius: "50%", background: online ? "#22c55e" : "#3f3f46", border: `${Math.max(1.5, size * 0.04)}px solid var(--bg)` }} />
      )}
    </div>
  );
}
