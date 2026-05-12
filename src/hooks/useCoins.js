// src/hooks/useCoins.js
import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc, updateDoc, increment,
         addDoc, collection, onSnapshot, query,
         where, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export const COIN_AMOUNTS = [10, 50, 100, 500];
export const STARTING_COINS = 100;
export const OWNER_UID_KEY = "nexus_owner_uid"; // stored after first owner login

// Check if a uid is the owner (has unlimited coins)
export function isOwnerUid(uid) {
  return localStorage.getItem(OWNER_UID_KEY) === uid;
}

export function useCoins() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const isOwner = user ? isOwnerUid(user.uid) : false;

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "coins", user.uid);

    const unsub = onSnapshot(ref, async snap => {
      if (snap.exists()) {
        setBalance(snap.data().balance ?? 0);
      } else {
        // Create wallet for new user
        await setDoc(ref, { balance: STARTING_COINS, uid: user.uid });
        setBalance(STARTING_COINS);
      }
      setLoading(false);
    }, err => {
      console.error("Coins listener error:", err);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const tip = useCallback(async (toUid, toUsername, amount) => {
    if (!user) throw new Error("Not logged in.");
    if (toUid === user.uid) throw new Error("Can't tip yourself.");
    if (!COIN_AMOUNTS.includes(amount)) throw new Error("Invalid amount.");

    // Owner has unlimited coins — skip balance check
    if (!isOwner && balance < amount) throw new Error("Not enough coins.");

    // Deduct from sender (owner still deducts from their balance but it's cosmetic)
    const senderRef = doc(db, "coins", user.uid);
    const senderSnap = await getDoc(senderRef);
    if (senderSnap.exists()) {
      await updateDoc(senderRef, { balance: increment(-amount) });
    }

    // ── Add to receiver ──────────────────────────────────────
    const receiverRef = doc(db, "coins", toUid);
    const receiverSnap = await getDoc(receiverRef);

    if (receiverSnap.exists()) {
      // Wallet exists — just increment
      await updateDoc(receiverRef, { balance: increment(amount) });
    } else {
      // Wallet doesn't exist yet — create it with the tipped amount + starting coins
      await setDoc(receiverRef, {
        balance: STARTING_COINS + amount,
        uid: toUid,
        createdAt: serverTimestamp(),
      });
    }

    // Record transaction
    await addDoc(collection(db, "transactions"), {
      fromUid: user.uid,
      fromUsername: user.displayName || "User",
      toUid,
      toUsername,
      amount,
      createdAt: serverTimestamp(),
    });

    // Notify receiver
    await addDoc(collection(db, "notifications"), {
      type: "tip",
      fromUid: user.uid,
      fromUsername: user.displayName || "Someone",
      toUid,
      amount,
      message: `tipped you ${amount} coins 🪙`,
      read: false,
      createdAt: serverTimestamp(),
    });
  }, [user, balance, isOwner]);

  // Owner function: add coins to self back to unlimited-ish
  const refillOwner = useCallback(async () => {
    if (!isOwner || !user) return;
    const ref = doc(db, "coins", user.uid);
    await setDoc(ref, { balance: 999999, uid: user.uid }, { merge: true });
  }, [user, isOwner]);

  // Display balance — owner sees ∞
  const displayBalance = isOwner ? "∞" : balance;

  return { balance, displayBalance, loading, tip, isOwner, refillOwner };
}

export function useTransactions(uid) {
  const [transactions, setTransactions] = useState([]);
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "transactions"),
      where("toUid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, snap =>
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [uid]);
  return transactions;
}

// ── Give coins to any user (owner action) ───────────────────
export async function giveCoinsToUser(toUid, amount, fromUsername = "Nexus Owner", reason = "") {
  const ref = doc(db, "coins", toUid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await updateDoc(ref, { balance: increment(amount) });
  } else {
    await setDoc(ref, { balance: amount, uid: toUid, createdAt: serverTimestamp() });
  }

  await addDoc(collection(db, "notifications"), {
    type: "tip",
    fromUid: "system",
    fromUsername,
    toUid,
    amount,
    message: `gifted you ${amount} coins 🪙${reason ? ` — "${reason}"` : ""}`,
    read: false,
    createdAt: serverTimestamp(),
  });
}
