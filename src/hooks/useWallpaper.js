// src/hooks/useWallpaper.js
// Chat wallpapers stored in localStorage per DM room

export const WALLPAPERS = [
  { id: "none",      label: "None",         preview: null,      style: {} },
  { id: "gradient1", label: "Cosmic",       preview: "linear-gradient(135deg,#1a0533,#0d1b4b,#0a2a1a)",
    style: { background: "linear-gradient(135deg,#1a0533,#0d1b4b,#0a2a1a)" } },
  { id: "gradient2", label: "Sunset",       preview: "linear-gradient(135deg,#2d1b4b,#4b1b2d,#4b2d1b)",
    style: { background: "linear-gradient(135deg,#2d1b4b,#4b1b2d,#4b2d1b)" } },
  { id: "gradient3", label: "Ocean",        preview: "linear-gradient(135deg,#0a1628,#0d2d3d,#061a2a)",
    style: { background: "linear-gradient(135deg,#0a1628,#0d2d3d,#061a2a)" } },
  { id: "gradient4", label: "Forest",       preview: "linear-gradient(135deg,#0a1f0a,#1a2d1a,#0f2b1a)",
    style: { background: "linear-gradient(135deg,#0a1f0a,#1a2d1a,#0f2b1a)" } },
  { id: "dots",      label: "Dots",         preview: null,
    style: { backgroundImage: "radial-gradient(circle,rgba(124,58,237,.15) 1px,transparent 1px)", backgroundSize: "24px 24px" } },
  { id: "grid",      label: "Grid",         preview: null,
    style: { backgroundImage: "linear-gradient(rgba(124,58,237,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.08) 1px,transparent 1px)", backgroundSize: "32px 32px" } },
  { id: "waves",     label: "Waves",        preview: null,
    style: { backgroundImage: "repeating-linear-gradient(45deg,rgba(124,58,237,.05) 0,rgba(124,58,237,.05) 1px,transparent 0,transparent 50%)", backgroundSize: "20px 20px" } },
  { id: "stars",     label: "Stars",        preview: null,
    style: { backgroundImage: "radial-gradient(1px 1px at 20% 30%,rgba(255,255,255,.3),transparent),radial-gradient(1px 1px at 80% 10%,rgba(255,255,255,.25),transparent),radial-gradient(1px 1px at 50% 70%,rgba(255,255,255,.2),transparent),radial-gradient(1px 1px at 10% 80%,rgba(255,255,255,.15),transparent)", backgroundColor: "#06060a" } },
  { id: "bubbles",   label: "Bubbles",      preview: null,
    style: { backgroundImage: "radial-gradient(circle at 25% 25%,rgba(168,85,247,.12) 0%,transparent 50%),radial-gradient(circle at 75% 75%,rgba(6,182,212,.1) 0%,transparent 50%)" } },
];

const KEY = (roomId) => `nexus_wallpaper_${roomId}`;

export function getWallpaper(roomId) {
  if (!roomId) return WALLPAPERS[0];
  const saved = localStorage.getItem(KEY(roomId));
  return WALLPAPERS.find(w => w.id === saved) || WALLPAPERS[0];
}

export function setWallpaper(roomId, wallpaperId) {
  if (!roomId) return;
  localStorage.setItem(KEY(roomId), wallpaperId);
  // Dispatch custom event so the chat page can react
  window.dispatchEvent(new CustomEvent("wallpaper-change", { detail: { roomId, wallpaperId } }));
}
