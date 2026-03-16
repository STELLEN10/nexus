import { useState, useEffect, useCallback, useRef } from "react";
import { collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, push, onChildAdded, onChildChanged, onChildRemoved, update, remove, off, set, onValue, onDisconnect, query as rtdbQuery, orderByChild, limitToLast } from "firebase/database";
import { db, rtdb } from "../firebase";
import { useAuth } from "../context/AuthContext";

async function ensureGeneralRoom(uid) {
  const r = doc(db, "rooms", "general");
  const s = await getDoc(r);
  if (!s.exists()) await setDoc(r, { id: "general", name: "general", description: "Welcome to Nexus!", type: "public", createdBy: uid, createdAt: serverTimestamp(), lastActivity: serverTimestamp() });
}

export function useRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    ensureGeneralRoom(user.uid);
    const q = query(collection(db, "rooms"), orderBy("lastActivity", "desc"));
    const unsub = onSnapshot(q, snap => { setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    return unsub;
  }, [user]);
  const createRoom = async (name, description = "", type = "public") => {
    const id = `${name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${Date.now()}`;
    await setDoc(doc(db, "rooms", id), { id, name, description, type, createdBy: user.uid, createdAt: serverTimestamp(), lastActivity: serverTimestamp() });
    return id;
  };
  return { rooms, loading, createRoom };
}

export function useMessages(roomId) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const initialDone = useRef(false);
  useEffect(() => {
    if (!roomId || !user) return;
    setMessages([]); setLoading(true); initialDone.current = false;
    const msgsRef = rtdbQuery(ref(rtdb, `messages/${roomId}`), orderByChild("createdAt"), limitToLast(60));
    const h1 = onChildAdded(msgsRef, snap => { const msg = { id: snap.key, ...snap.val() }; setMessages(prev => prev.find(m => m.id === snap.key) ? prev : [...prev, msg]); setLoading(false); if (initialDone.current) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50); });
    const h2 = onChildChanged(msgsRef, snap => setMessages(prev => prev.map(m => m.id === snap.key ? { id: snap.key, ...snap.val() } : m)));
    const h3 = onChildRemoved(msgsRef, snap => setMessages(prev => prev.filter(m => m.id !== snap.key)));
    const t = setTimeout(() => { initialDone.current = true; setLoading(false); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 100); }, 800);
    return () => { off(msgsRef, "child_added", h1); off(msgsRef, "child_changed", h2); off(msgsRef, "child_removed", h3); clearTimeout(t); };
  }, [roomId, user]);
  const sendMessage = useCallback(async (content, replyTo = null) => {
    if (!content.trim()) return;
    await push(ref(rtdb, `messages/${roomId}`), { content: content.trim(), senderId: user.uid, senderName: profile?.displayName || "User", senderAvatar: profile?.avatar || "", replyTo: replyTo ? { id: replyTo.id, content: replyTo.content, senderName: replyTo.senderName } : null, createdAt: Date.now(), edited: false, reactions: {} });
    await updateDoc(doc(db, "rooms", roomId), { lastActivity: serverTimestamp() });
  }, [roomId, user, profile]);
  const editMessage = useCallback(async (msgId, content) => { await update(ref(rtdb, `messages/${roomId}/${msgId}`), { content, edited: true, editedAt: Date.now() }); }, [roomId]);
  const deleteMessage = useCallback(async (msgId) => { await remove(ref(rtdb, `messages/${roomId}/${msgId}`)); }, [roomId]);
  const reactToMessage = useCallback(async (msgId, emoji) => {
    const msg = messages.find(m => m.id === msgId);
    const has = msg?.reactions?.[emoji]?.[user.uid];
    if (has) await remove(ref(rtdb, `messages/${roomId}/${msgId}/reactions/${emoji}/${user.uid}`));
    else await update(ref(rtdb, `messages/${roomId}/${msgId}/reactions/${emoji}`), { [user.uid]: true });
  }, [roomId, user, messages]);
  return { messages, loading, sendMessage, editMessage, deleteMessage, reactToMessage, bottomRef };
}

export function useTyping(roomId) {
  const { user, profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState([]);
  const timerRef = useRef(null);
  const isTypingRef = useRef(false);
  useEffect(() => {
    if (!roomId || !user) return;
    const typRef = ref(rtdb, `typing/${roomId}`);
    const handleValue = (snap) => { const d = snap.val() || {}; setTypingUsers(Object.entries(d).filter(([uid]) => uid !== user.uid).map(([, v]) => v.username)); };
    onValue(typRef, handleValue);
    return () => { off(typRef, "value", handleValue); remove(ref(rtdb, `typing/${roomId}/${user.uid}`)); };
  }, [roomId, user]);
  const startTyping = useCallback(() => {
    if (!isTypingRef.current) { isTypingRef.current = true; set(ref(rtdb, `typing/${roomId}/${user.uid}`), { username: profile?.displayName || "User" }); }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { isTypingRef.current = false; remove(ref(rtdb, `typing/${roomId}/${user.uid}`)); }, 2000);
  }, [roomId, user, profile]);
  const stopTyping = useCallback(() => { clearTimeout(timerRef.current); isTypingRef.current = false; remove(ref(rtdb, `typing/${roomId}/${user.uid}`)); }, [roomId, user]);
  return { typingUsers, startTyping, stopTyping };
}

export function usePresence() {
  const { user, profile } = useAuth();
  useEffect(() => {
    if (!user) return;
    const presRef = ref(rtdb, `presence/${user.uid}`);
    set(presRef, { username: profile?.displayName || "User", online: true, lastSeen: Date.now() });
    onDisconnect(presRef).set({ online: false, lastSeen: Date.now() });
    return () => remove(presRef);
  }, [user, profile]);
}
