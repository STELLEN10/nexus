import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export { BADGES, useBadges, useMyBadges, awardBadge, useBadgeShop } from "./useBadgeSystem";

// ── Badge definitions ────────────────────────────────────────
export const BADGES = {
  early_adopter: {
    id: "early_adopter",
    label: "Early Adopter",
    icon: "🌟",
    color: "#f59e0b",
    glow: "#f59e0b66",
    desc: "One of the first to join Nexus",
  },
  founder: {
    id: "founder",
    label: "Founder",
    icon: "👑",
    color: "#a855f7",
    glow: "#a855f766",
    desc: "Nexus founding member",
  },
  verified: {
    id: "verified",
    label: "Verified",
    icon: "✓",
    color: "#06b6d4",
    glow: "#06b6d466",
    desc: "Verified account",
  },
  creator: {
    id: "creator",
    label: "Creator",
    icon: "🎨",
    color: "#ec4899",
    glow: "#ec489966",
    desc: "Content creator on Nexus",
  },
  og: {
    id: "og",
    label: "OG",
    icon: "🔥",
    color: "#ef4444",
    glow: "#ef444466",
    desc: "Original Gangster — been here from day one",
  },
  social_butterfly: {
    id: "social_butterfly",
    label: "Social",
    icon: "🦋",
    color: "#22c55e",
    glow: "#22c55e66",
    desc: "Has 50+ followers",
  },
  storyteller: {
    id: "storyteller",
    label: "Storyteller",
    icon: "📖",
    color: "#8b5cf6",
    glow: "#8b5cf666",
    desc: "Posted 10+ stories",
  },
};

// Auto-assign early_adopter to all users on first fetch
export function useBadges(uid) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "badges", uid);
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        setBadges(snap.data().list || []);
      } else {
        // Auto-assign early_adopter to everyone currently on the platform
        setDoc(ref, { list: ["early_adopter"] });
        setBadges(["early_adopter"]);
      }
      setLoading(false);
    });
  }, [uid]);

  return { badges, loading };
}

export function useMyBadges() {
  const { user } = useAuth();
  return useBadges(user?.uid);
}

// Admin function — award a badge to a user
export async function awardBadge(uid, badgeId) {
  const ref = doc(db, "badges", uid);
  await setDoc(ref, { list: arrayUnion(badgeId) }, { merge: true });
}
