import { useState, useCallback } from "react";
import { collection, query, where, getDocs, orderBy, startAt, endAt, getDoc, doc } from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { db, rtdb } from "../firebase";
import { useEffect } from "react";

export function useUserSearch() {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (term) => {
    if (!term || term.length < 2) { setResults([]); return; }
    setSearching(true);
    const lower = term.toLowerCase();
    const q = query(
      collection(db, "users"),
      orderBy("username"),
      startAt(lower),
      endAt(lower + "\uf8ff")
    );
    const snap = await getDocs(q);
    setResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setSearching(false);
  }, []);

  return { results, searching, search, setResults };
}

export function useUserProfile(uid) {
  const [profile, setProfile] = useState(null);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then(snap => {
      if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
      setLoading(false);
    });

    const presRef = ref(rtdb, `presence/${uid}`);
    const unsub = onValue(presRef, snap => setOnline(snap.val()?.online || false));
    return () => off(presRef, "value", unsub);
  }, [uid]);

  return { profile, online, loading };
}

export function useOnlineStatus(uid) {
  const [online, setOnline] = useState(false);
  useEffect(() => {
    if (!uid) return;
    const presRef = ref(rtdb, `presence/${uid}`);
    const unsub = onValue(presRef, snap => setOnline(snap.val()?.online || false));
    return () => off(presRef, "value", unsub);
  }, [uid]);
  return online;
}
