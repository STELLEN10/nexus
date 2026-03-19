// src/hooks/useChat.js — hardened version
import { useState, useEffect, useCallback, useRef } from "react";
import { collection, doc, setDoc, getDoc, onSnapshot, query, orderBy,
         serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, push, onChildAdded, onChildChanged, onChildRemoved,
         update, remove, off, set, onValue, onDisconnect,
         query as rtdbQuery, orderByChild, limitToLast } from "firebase/database";
import { db, rtdb } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  validateMessage, validateRoomName, sanitizeText,
  validateImageFile, LIMITS
} from "../lib/validation";
import {
  checkMessageLimit, checkRoomCreateLimit, formatRetryAfter
} from "../lib/rateLimiter";

async function ensureGeneralRoom(uid) {
  const r = doc(db, "rooms", "general");
  const s = await getDoc(r);
  if (!s.exists()) await setDoc(r, {
    id: "general", name: "general",
    description: "Welcome to Nexus!", type: "public",
    createdBy: uid, createdAt: serverTimestamp(), lastActivity: serverTimestamp()
  });
}

export function useRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    ensureGeneralRoom(user.uid);
    const q = query(collection(db, "rooms"), orderBy("lastActivity", "desc"));
    const unsub = onSnapshot(q, snap => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const createRoom = async (name, description = "", type = "public") => {
    // Rate limit
    const rl = checkRoomCreateLimit(user.uid);
    if (!rl.allowed) throw new Error(`Too many rooms created. Try again in ${formatRetryAfter(rl.retryAfterMs)}.`);
    // Validate
    const nameResult = validateRoomName(name);
    if (!nameResult.ok) throw new Error(nameResult.error);
    const descResult = { ok: true, value: sanitizeText(description).slice(0, LIMITS.ROOM_DESC_MAX) };
    if (!["public", "private"].includes(type)) throw new Error("Invalid room type.");

    const id = `${nameResult.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${Date.now()}`;
    await setDoc(doc(db, "rooms", id), {
      id, name: nameResult.value, description: descResult.value,
      type, createdBy: user.uid,
      createdAt: serverTimestamp(), lastActivity: serverTimestamp()
    });
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
    const h1 = onChildAdded(msgsRef, snap => {
      const msg = { id: snap.key, ...snap.val() };
      setMessages(prev => prev.find(m => m.id === snap.key) ? prev : [...prev, msg]);
      setLoading(false);
      if (initialDone.current) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    const h2 = onChildChanged(msgsRef, snap => setMessages(prev => prev.map(m => m.id === snap.key ? { id: snap.key, ...snap.val() } : m)));
    const h3 = onChildRemoved(msgsRef, snap => setMessages(prev => prev.filter(m => m.id !== snap.key)));
    const t = setTimeout(() => { initialDone.current = true; setLoading(false); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 100); }, 800);
    return () => { off(msgsRef, "child_added", h1); off(msgsRef, "child_changed", h2); off(msgsRef, "child_removed", h3); clearTimeout(t); };
  }, [roomId, user]);

  const sendMessage = useCallback(async (content, replyTo = null) => {
    // Rate limit
    const rl = checkMessageLimit(user.uid);
    if (!rl.allowed) throw new Error(`Slow down! Try again in ${formatRetryAfter(rl.retryAfterMs)}.`);
    // Validate
    const v = validateMessage(content);
    if (!v.ok) throw new Error(v.error);

    const payload = {
      content: v.value,
      senderId: user.uid,
      senderName: sanitizeText(profile?.displayName || "User").slice(0, 32),
      senderAvatar: profile?.avatar || "",
      replyTo: replyTo ? {
        id: replyTo.id,
        content: sanitizeText(replyTo.content || "").slice(0, 200),
        senderName: sanitizeText(replyTo.senderName || "").slice(0, 32)
      } : null,
      createdAt: Date.now(),
      edited: false,
      reactions: {}
    };
    await push(ref(rtdb, `messages/${roomId}`), payload);
    await updateDoc(doc(db, "rooms", roomId), { lastActivity: serverTimestamp() });
  }, [roomId, user, profile]);

  const editMessage = useCallback(async (msgId, content) => {
    const v = validateMessage(content);
    if (!v.ok) throw new Error(v.error);
    await update(ref(rtdb, `messages/${roomId}/${msgId}`), { content: v.value, edited: true, editedAt: Date.now() });
  }, [roomId]);

  const deleteMessage = useCallback(async (msgId) => {
    await remove(ref(rtdb, `messages/${roomId}/${msgId}`));
  }, [roomId]);

  const reactToMessage = useCallback(async (msgId, emoji) => {
    // Validate emoji is from allowed set
    const ALLOWED_REACTIONS = ["👍","❤️","😂","😮","😢","🔥"];
    if (!ALLOWED_REACTIONS.includes(emoji)) return;
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
    const handleValue = (snap) => {
      const d = snap.val() || {};
      setTypingUsers(Object.entries(d).filter(([uid]) => uid !== user.uid).map(([, v]) => sanitizeText(v.username || "").slice(0, 32)));
    };
    onValue(typRef, handleValue);
    return () => { off(typRef, "value", handleValue); remove(ref(rtdb, `typing/${roomId}/${user.uid}`)); };
  }, [roomId, user]);

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      set(ref(rtdb, `typing/${roomId}/${user.uid}`), { username: sanitizeText(profile?.displayName || "User").slice(0, 32) });
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { isTypingRef.current = false; remove(ref(rtdb, `typing/${roomId}/${user.uid}`)); }, 2000);
  }, [roomId, user, profile]);

  const stopTyping = useCallback(() => {
    clearTimeout(timerRef.current);
    isTypingRef.current = false;
    remove(ref(rtdb, `typing/${roomId}/${user.uid}`));
  }, [roomId, user]);

  return { typingUsers, startTyping, stopTyping };
}

export function usePresence() {
  const { user, profile } = useAuth();
  useEffect(() => {
    if (!user) return;
    const presRef = ref(rtdb, `presence/${user.uid}`);
    set(presRef, { username: sanitizeText(profile?.displayName || "User").slice(0, 32), online: true, lastSeen: Date.now() });
    onDisconnect(presRef).set({ online: false, lastSeen: Date.now() });
    return () => remove(presRef);
  }, [user, profile]);
}
