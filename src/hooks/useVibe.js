import { useState, useEffect, useCallback } from "react";
import { ref, set, onValue, off, remove } from "firebase/database";
import { rtdb } from "../firebase";
import { useAuth } from "../context/AuthContext";

export const VIBES = [
  { emoji: "🔥", label: "On fire",     color: "#f97316" },
  { emoji: "💜", label: "Vibing",      color: "#a855f7" },
  { emoji: "😂", label: "Laughing",    color: "#eab308" },
  { emoji: "💀", label: "Dead",        color: "#6b7280" },
  { emoji: "🥶", label: "Chilling",    color: "#06b6d4" },
  { emoji: "😤", label: "Focused",     color: "#ef4444" },
  { emoji: "🎵", label: "Music mode",  color: "#22c55e" },
  { emoji: "😴", label: "Sleepy",      color: "#8b5cf6" },
  { emoji: "🤩", label: "Hyped",       color: "#ec4899" },
  { emoji: "👻", label: "Ghost mode",  color: "#374151" },
  { emoji: "💪", label: "Grinding",    color: "#f43f5e" },
  { emoji: "🌊", label: "Relaxed",     color: "#0ea5e9" },
];

export function useVibe() {
  const { user } = useAuth();
  const [myVibe, setMyVibe] = useState(null);

  useEffect(() => {
    if (!user) return;
    const vibeRef = ref(rtdb, `vibes/${user.uid}`);
    const unsub = onValue(vibeRef, snap => setMyVibe(snap.val()));
    return () => off(vibeRef, "value", unsub);
  }, [user]);

  const setVibe = useCallback(async (vibe) => {
    if (!user) return;
    const vibeRef = ref(rtdb, `vibes/${user.uid}`);
    if (!vibe) {
      await remove(vibeRef);
    } else {
      await set(vibeRef, {
        emoji: vibe.emoji,
        label: vibe.label,
        color: vibe.color,
        uid: user.uid,
        updatedAt: Date.now(),
      });
    }
  }, [user]);

  return { myVibe, setVibe };
}

export function useUserVibe(uid) {
  const [vibe, setVibe] = useState(null);
  useEffect(() => {
    if (!uid) return;
    const vibeRef = ref(rtdb, `vibes/${uid}`);
    const unsub = onValue(vibeRef, snap => setVibe(snap.val()));
    return () => off(vibeRef, "value", unsub);
  }, [uid]);
  return vibe;
}
