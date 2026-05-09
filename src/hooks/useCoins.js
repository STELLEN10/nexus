import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc, updateDoc, increment,
         addDoc, collection, onSnapshot, query,
         where, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export const COIN_AMOUNTS = [10, 50, 100, 500];
export const STARTING_COINS = 100; // every new user gets 100 coins

export function useCoins() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "coins", user.uid);
    const unsub = onSnapshot(ref, async snap => {
      if (snap.exists()) {
        setBalance(snap.data().balance || 0);
      } else {
        // New user — give starting coins
        await setDoc(ref, { balance: STARTING_COINS, uid: user.uid });
        setBalance(STARTING_COINS);
      }
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const tip = useCallback(async (toUid, toUsername, amount) => {
    if (!user || balance < amount) throw new Error("Not enough coins.");
    if (toUid === user.uid) throw new Error("Can't tip yourself.");
    if (!COIN_AMOUNTS.includes(amount)) throw new Error("Invalid amount.");

    // Deduct from sender
    await updateDoc(doc(db, "coins", user.uid), { balance: increment(-amount) });
    // Add to receiver
    const receiverRef = doc(db, "coins", toUid);
    const receiverSnap = await getDoc(receiverRef);
    if (receiverSnap.exists()) {
      await updateDoc(receiverRef, { balance: increment(amount) });
    } else {
      await setDoc(receiverRef, { balance: amount, uid: toUid });
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

    // Send notification
    await addDoc(collection(db, "notifications"), {
      type: "tip",
      fromUid: user.uid,
      fromUsername: user.displayName || "Someone",
      toUid,
      message: `tipped you ${amount} coins 🪙`,
      read: false,
      createdAt: serverTimestamp(),
    });
  }, [user, balance]);

  return { balance, loading, tip };
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
