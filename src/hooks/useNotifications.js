import { useState, useEffect, useCallback } from "react";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), where("toUid", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(notifs); setUnreadCount(notifs.filter(n => !n.read).length); setLoading(false);
    });
    return unsub;
  }, [user]);
  const markAllRead = useCallback(async () => {
    if (!user) return;
    const snap = await getDocs(query(collection(db, "notifications"), where("toUid", "==", user.uid), where("read", "==", false)));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  }, [user]);
  const markRead = useCallback(async (id) => { await updateDoc(doc(db, "notifications", id), { read: true }); }, []);
  return { notifications, unreadCount, loading, markAllRead, markRead };
}
