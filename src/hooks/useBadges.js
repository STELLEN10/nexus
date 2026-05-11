import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  arrayUnion,
} from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

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
    desc: "Original member from day one",
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

// ── Fetch user badges ────────────────────────────────────────
export function useBadges(uid) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setBadges([]);
      setLoading(false);
      return;
    }

    const fetchBadges = async () => {
      try {
        const ref = doc(db, "badges", uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setBadges(snap.data().list || []);
        } else {
          // Auto-assign starter badge
          await setDoc(ref, {
            list: ["early_adopter"],
          });

          setBadges(["early_adopter"]);
        }
      } catch (err) {
        console.error("Error fetching badges:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [uid]);

  return { badges, loading };
}

// ── Current logged-in user badges ────────────────────────────
export function useMyBadges() {
  const { user } = useAuth();
  return useBadges(user?.uid);
}

// ── Award badge to user ──────────────────────────────────────
export async function awardBadge(uid, badgeId) {
  try {
    const ref = doc(db, "badges", uid);

    await setDoc(
      ref,
      {
        list: arrayUnion(badgeId),
      },
      { merge: true }
    );

    return true;
  } catch (err) {
    console.error("Error awarding badge:", err);
    return false;
  }
}
