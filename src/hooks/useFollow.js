import { useState, useEffect, useCallback } from "react";
import { doc, setDoc, deleteDoc, getDoc, collection, query, where, onSnapshot, serverTimestamp, increment, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export function useFollow(targetUid) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user || !targetUid || user.uid === targetUid) { setLoading(false); return; }
    getDoc(doc(db, "follows", `${user.uid}_${targetUid}`)).then(snap => { setIsFollowing(snap.exists()); setLoading(false); });
  }, [user, targetUid]);
  const follow = useCallback(async (targetProfile) => {
    if (!user || !targetUid) return;
    await setDoc(doc(db, "follows", `${user.uid}_${targetUid}`), { followerId: user.uid, followingId: targetUid, createdAt: serverTimestamp() });
    await updateDoc(doc(db, "users", user.uid), { followingCount: increment(1) });
    await updateDoc(doc(db, "users", targetUid), { followersCount: increment(1) });
    await addDoc(collection(db, "notifications"), { type: "follow", fromUid: user.uid, fromUsername: user.displayName || "Someone", toUid: targetUid, message: "started following you", read: false, createdAt: serverTimestamp() });
    setIsFollowing(true);
  }, [user, targetUid]);
  const unfollow = useCallback(async () => {
    if (!user || !targetUid) return;
    await deleteDoc(doc(db, "follows", `${user.uid}_${targetUid}`));
    await updateDoc(doc(db, "users", user.uid), { followingCount: increment(-1) });
    await updateDoc(doc(db, "users", targetUid), { followersCount: increment(-1) });
    setIsFollowing(false);
  }, [user, targetUid]);
  return { isFollowing, loading, follow, unfollow };
}

export function useFollowCounts(uid) {
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), snap => { if (snap.exists()) setCounts({ followers: snap.data().followersCount || 0, following: snap.data().followingCount || 0 }); });
    return unsub;
  }, [uid]);
  return counts;
}

export function useFollowingList(uid) {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "follows"), where("followerId", "==", uid));
    const unsub = onSnapshot(q, snap => { setFollowing(snap.docs.map(d => d.data().followingId)); setLoading(false); });
    return unsub;
  }, [uid]);
  return { following, loading };
}
