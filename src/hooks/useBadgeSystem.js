// src/hooks/useBadgeSystem.js
import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, addDoc,
         collection, serverTimestamp, onSnapshot, increment } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// ── Badge definitions with benefits & shop prices ──────────
export const BADGES = {
  early_adopter: {
    id: "early_adopter",
    label: "Early Adopter",
    icon: "🌟",
    color: "#f59e0b",
    glow: "#f59e0b66",
    desc: "One of the first to join Nexus",
    coinReward: 200,
    shopPrice: null, // awarded only
    benefits: [
      "Gold animated profile border",
      "200 bonus coins",
      "Exclusive Early Adopter badge forever",
      "Priority support",
    ],
    borderStyle: "linear-gradient(135deg, #f59e0b, #fbbf24, #f97316)",
  },
  founder: {
    id: "founder",
    label: "Founder",
    icon: "👑",
    color: "#a855f7",
    glow: "#a855f766",
    desc: "Nexus founding member",
    coinReward: 500,
    shopPrice: null, // awarded only
    benefits: [
      "Crown animated profile border",
      "500 bonus coins",
      "Exclusive Founder purple theme",
      "Name shown in Founders Hall",
      "Beta feature access",
    ],
    borderStyle: "linear-gradient(135deg, #a855f7, #7c3aed, #ec4899)",
  },
  verified: {
    id: "verified",
    label: "Verified",
    icon: "✓",
    color: "#06b6d4",
    glow: "#06b6d466",
    desc: "Verified Nexus account",
    coinReward: 300,
    shopPrice: 800,
    benefits: [
      "Blue checkmark on all posts & messages",
      "300 bonus coins",
      "Priority in people search",
      "Verified badge in DMs",
    ],
    borderStyle: "linear-gradient(135deg, #06b6d4, #0891b2, #22d3ee)",
  },
  creator: {
    id: "creator",
    label: "Creator",
    icon: "🎨",
    color: "#ec4899",
    glow: "#ec489966",
    desc: "Content creator on Nexus",
    coinReward: 250,
    shopPrice: 500,
    benefits: [
      "Animated gradient profile border",
      "250 bonus coins",
      "Creator analytics dashboard",
      "Extended post character limit",
      "GIF profile picture support",
    ],
    borderStyle: "linear-gradient(135deg, #ec4899, #f43f5e, #a855f7)",
  },
  og: {
    id: "og",
    label: "OG",
    icon: "🔥",
    color: "#ef4444",
    glow: "#ef444466",
    desc: "Original Gangster — been here from day one",
    coinReward: 400,
    shopPrice: null, // awarded only
    benefits: [
      "Animated fire profile border",
      "400 bonus coins",
      "OG exclusive red theme",
      "Double reactions on posts",
      "OG chat color scheme",
    ],
    borderStyle: "linear-gradient(135deg, #ef4444, #f97316, #eab308)",
  },
  social_butterfly: {
    id: "social_butterfly",
    label: "Social",
    icon: "🦋",
    color: "#22c55e",
    glow: "#22c55e66",
    desc: "The life of the party",
    coinReward: 150,
    shopPrice: 300,
    benefits: [
      "Green shimmer profile border",
      "150 bonus coins",
      "5 extra DM conversation slots",
      "Friend suggestions priority",
    ],
    borderStyle: "linear-gradient(135deg, #22c55e, #06b6d4, #a855f7)",
  },
  storyteller: {
    id: "storyteller",
    label: "Storyteller",
    icon: "📖",
    color: "#8b5cf6",
    glow: "#8b5cf666",
    desc: "Master of stories",
    coinReward: 100,
    shopPrice: 200,
    benefits: [
      "Purple glow profile border",
      "100 bonus coins",
      "48-hour stories (double normal)",
      "Story analytics & view counts",
      "Custom story backgrounds",
    ],
    borderStyle: "linear-gradient(135deg, #8b5cf6, #a855f7, #06b6d4)",
  },
  whale: {
    id: "whale",
    label: "Whale",
    icon: "🐳",
    color: "#0ea5e9",
    glow: "#0ea5e966",
    desc: "Big tipper — sent 1000+ coins",
    coinReward: 350,
    shopPrice: null, // earned by tipping
    benefits: [
      "Ocean wave profile border",
      "350 bonus coins",
      "Whale badge on all tips",
      "Featured in Top Tippers list",
      "Exclusive whale emoji reactions",
    ],
    borderStyle: "linear-gradient(135deg, #0ea5e9, #06b6d4, #22d3ee)",
  },
  nightowl: {
    id: "nightowl",
    label: "Night Owl",
    icon: "🦉",
    color: "#6366f1",
    glow: "#6366f166",
    desc: "Always online after midnight",
    coinReward: 75,
    shopPrice: 150,
    benefits: [
      "Dark starfield profile border",
      "75 bonus coins",
      "Night mode auto-activates",
      "Exclusive dark themes",
    ],
    borderStyle: "linear-gradient(135deg, #6366f1, #7c3aed, #06060a)",
  },
  legend: {
    id: "legend",
    label: "Legend",
    icon: "⚡",
    color: "#eab308",
    glow: "#eab30866",
    desc: "A true Nexus legend",
    coinReward: 1000,
    shopPrice: 2500,
    benefits: [
      "Electric gold animated border",
      "1000 bonus coins",
      "LEGEND title under username",
      "All exclusive themes unlocked",
      "Custom chat bubble colors",
      "Permanent top of Explore page",
    ],
    borderStyle: "linear-gradient(135deg, #eab308, #f59e0b, #ef4444, #eab308)",
  },
};

// ── Hook: user badges ───────────────────────────────────────
export function useBadges(uid) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "badges", uid);
    const unsub = onSnapshot(ref, async snap => {
      if (snap.exists()) {
        setBadges(snap.data().list || []);
      } else {
        // Auto-award early_adopter + coins to new users
        await awardBadge(uid, "early_adopter", true);
        setBadges(["early_adopter"]);
      }
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return { badges, loading };
}

export function useMyBadges() {
  const { user } = useAuth();
  return useBadges(user?.uid);
}

// ── Award a badge (with coins + notification) ───────────────
export async function awardBadge(uid, badgeId, silent = false) {
  const badge = BADGES[badgeId];
  if (!badge) return;

  const ref = doc(db, "badges", uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? (snap.data().list || []) : [];

  if (existing.includes(badgeId)) return; // already has it

  // Award badge
  await setDoc(ref, { list: arrayUnion(badgeId) }, { merge: true });

  // Award coins
  if (badge.coinReward > 0) {
    const coinRef = doc(db, "coins", uid);
    const coinSnap = await getDoc(coinRef);
    if (coinSnap.exists()) {
      await updateDoc(coinRef, { balance: increment(badge.coinReward) });
    } else {
      await setDoc(coinRef, { balance: badge.coinReward + 100, uid });
    }

    // Record transaction
    await addDoc(collection(db, "transactions"), {
      fromUid: "system",
      fromUsername: "Nexus",
      toUid: uid,
      toUsername: "User",
      amount: badge.coinReward,
      type: "badge_reward",
      badgeId,
      createdAt: serverTimestamp(),
    });
  }

  // Send notification
  if (!silent) {
    await addDoc(collection(db, "notifications"), {
      type: "badge_awarded",
      fromUid: "system",
      fromUsername: "Nexus",
      toUid: uid,
      badgeId,
      badgeLabel: badge.label,
      badgeIcon: badge.icon,
      coinReward: badge.coinReward,
      message: `awarded you the ${badge.icon} ${badge.label} badge! (+${badge.coinReward} coins)`,
      read: false,
      createdAt: serverTimestamp(),
    });
  }
}

// ── Hook: badge shop ─────────────────────────────────────────
export function useBadgeShop() {
  const { user } = useAuth();
  const { badges } = useBadges(user?.uid);
  const [buying, setBuying] = useState(null);
  const [error, setError] = useState("");

  const purchaseBadge = useCallback(async (badgeId, currentBalance) => {
    const badge = BADGES[badgeId];
    if (!badge || !badge.shopPrice) { setError("This badge can't be purchased."); return false; }
    if (badges.includes(badgeId)) { setError("You already have this badge."); return false; }
    if (currentBalance < badge.shopPrice) { setError("Not enough coins."); return false; }

    setBuying(badgeId);
    setError("");
    try {
      // Deduct coins
      await updateDoc(doc(db, "coins", user.uid), { balance: increment(-badge.shopPrice) });
      // Award badge + notification
      await awardBadge(user.uid, badgeId, false);
      return true;
    } catch (err) {
      setError("Purchase failed. Try again.");
      return false;
    } finally { setBuying(null); }
  }, [user, badges]);

  const shopBadges = Object.values(BADGES).filter(b => b.shopPrice !== null);

  return { shopBadges, badges, buying, error, purchaseBadge };
}
