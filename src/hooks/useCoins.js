import { useState, useEffect, useCallback } from "react";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export const COIN_AMOUNTS = [10, 50, 100, 500];
export const STARTING_COINS = 100;
export const OWNER_BALANCE = 999999999;
export const OWNER_UID_KEY = "nexus_owner_uid";

export function isOwnerUid(uid) {
  return Boolean(uid && localStorage.getItem(OWNER_UID_KEY) === uid);
}

async function ensureWallet(uid, initialBalance = STARTING_COINS) {
  const ref = doc(db, "coins", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      balance: initialBalance,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  return ref;
}

export function useCoins() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const isOwner = user ? isOwnerUid(user.uid) : false;

  useEffect(() => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, "coins", user.uid);

    const unsub = onSnapshot(
      ref,
      async snap => {
        if (snap.exists()) {
          setBalance(snap.data().balance ?? 0);
        } else {
          const startingBalance = isOwnerUid(user.uid) ? OWNER_BALANCE : STARTING_COINS;
          await setDoc(ref, {
            balance: startingBalance,
            uid: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setBalance(startingBalance);
        }
        setLoading(false);
      },
      err => {
        console.error("Coins listener error:", err);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  const tip = useCallback(async (toUid, toUsername, amount) => {
    if (!user) throw new Error("Not logged in.");
    if (toUid === user.uid) throw new Error("Can't tip yourself.");
    if (!COIN_AMOUNTS.includes(amount)) throw new Error("Invalid amount.");
    if (!isOwner && balance < amount) throw new Error("Not enough coins.");

    const senderRef = await ensureWallet(user.uid, isOwner ? OWNER_BALANCE : STARTING_COINS);
    if (isOwner) {
      await setDoc(senderRef, {
        balance: OWNER_BALANCE,
        uid: user.uid,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } else {
      await updateDoc(senderRef, {
        balance: increment(-amount),
        updatedAt: serverTimestamp(),
      });
    }

    const receiverRef = await ensureWallet(toUid, STARTING_COINS);
    await updateDoc(receiverRef, {
      balance: increment(amount),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "transactions"), {
      fromUid: user.uid,
      fromUsername: user.displayName || "User",
      toUid,
      toUsername,
      amount,
      type: "tip",
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, "notifications"), {
      type: "tip",
      fromUid: user.uid,
      fromUsername: user.displayName || "Someone",
      toUid,
      amount,
      message: `tipped you ${amount} coins`,
      read: false,
      createdAt: serverTimestamp(),
    });
  }, [user, balance, isOwner]);

  const refillOwner = useCallback(async () => {
    if (!isOwner || !user) return;
    await setDoc(doc(db, "coins", user.uid), {
      balance: OWNER_BALANCE,
      uid: user.uid,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }, [user, isOwner]);

  const displayBalance = isOwner ? "Unlimited" : balance;

  return { balance, displayBalance, loading, tip, isOwner, refillOwner };
}

export function useTransactions(uid) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!uid) {
      setTransactions([]);
      return;
    }

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

export async function giveCoinsToUser(toUid, amount, fromUsername = "Nexus Owner", reason = "") {
  if (!toUid) throw new Error("Missing recipient.");
  if (!Number.isFinite(amount) || amount < 1) throw new Error("Invalid amount.");

  const receiverRef = await ensureWallet(toUid, STARTING_COINS);
  await updateDoc(receiverRef, {
    balance: increment(amount),
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, "transactions"), {
    fromUid: "system",
    fromUsername,
    toUid,
    toUsername: "User",
    amount,
    type: "owner_gift",
    reason,
    createdAt: serverTimestamp(),
  });

  await addDoc(collection(db, "notifications"), {
    type: "tip",
    fromUid: "system",
    fromUsername,
    toUid,
    amount,
    message: `gifted you ${amount} coins${reason ? ` - ${reason}` : ""}`,
    read: false,
    createdAt: serverTimestamp(),
  });
}
