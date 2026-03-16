import { useState, useEffect, useCallback } from "react";
import {
  collection, doc, addDoc, setDoc, getDoc, updateDoc,
  onSnapshot, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import {
  ref, push, onChildAdded, onChildChanged, off, update, remove,
} from "firebase/database";
import { db, rtdb } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNotif } from "../context/NotifContext";

export function useGroupDMs() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "groupDMs"),
      where("members", "array-contains", user.uid),
      orderBy("lastActivity", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const createGroup = useCallback(async (name, memberUids) => {
    const allMembers = [...new Set([user.uid, ...memberUids])];
    const ref = await addDoc(collection(db, "groupDMs"), {
      name,
      members: allMembers,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      lastMessage: null,
      avatar: "",
    });
    return ref.id;
  }, [user]);

  return { groups, loading, createGroup };
}

export function useGroupMessages(groupId) {
  const { user, profile } = useAuth();
  const { notify } = useNotif();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId || !user) return;
    setMessages([]); setLoading(true);
    let initialDone = false;
    const msgsRef = ref(rtdb, `groupDMs/${groupId}/messages`);

    const u1 = onChildAdded(msgsRef, snap => {
      const msg = { id: snap.key, ...snap.val() };
      setMessages(prev => prev.find(m => m.id === snap.key) ? prev : [...prev, msg]);
      setLoading(false);
      if (initialDone && msg.senderId !== user.uid) {
        notify(msg.senderName, msg.type === "voice" ? "🎙 Voice message" : msg.type === "sticker" ? "🎭 Sticker" : msg.content);
        updateDoc(doc(db, "groupDMs", groupId), { [`unread.${user.uid}`]: 0 }).catch(() => {});
      }
    });
    const u2 = onChildChanged(msgsRef, snap => {
      setMessages(prev => prev.map(m => m.id === snap.key ? { id: snap.key, ...snap.val() } : m));
    });
    const t = setTimeout(() => { initialDone = true; setLoading(false); updateDoc(doc(db, "groupDMs", groupId), { [`unread.${user.uid}`]: 0 }).catch(() => {}); }, 600);

    return () => { off(msgsRef, "child_added", u1); off(msgsRef, "child_changed", u2); clearTimeout(t); };
  }, [groupId, user]);

  const sendMessage = useCallback(async (content, type = "text") => {
    if (!content?.trim() && type === "text") return;
    await push(ref(rtdb, `groupDMs/${groupId}/messages`), {
      content: content || "",
      type,
      senderId: user.uid,
      senderName: profile?.displayName || "User",
      senderAvatar: profile?.avatar || "",
      createdAt: Date.now(),
      reactions: {},
    });
    await updateDoc(doc(db, "groupDMs", groupId), {
      lastMessage: { content: type === "voice" ? "🎙 Voice message" : type === "sticker" ? "🎭 Sticker" : content, senderId: user.uid },
      lastActivity: serverTimestamp(),
    });
  }, [groupId, user, profile]);

  const reactToMessage = useCallback(async (msgId, emoji) => {
    const msg = messages.find(m => m.id === msgId);
    const has = msg?.reactions?.[emoji]?.[user.uid];
    if (has) await remove(ref(rtdb, `groupDMs/${groupId}/messages/${msgId}/reactions/${emoji}/${user.uid}`));
    else await update(ref(rtdb, `groupDMs/${groupId}/messages/${msgId}/reactions/${emoji}`), { [user.uid]: true });
  }, [groupId, user, messages]);

  return { messages, loading, sendMessage, reactToMessage };
}
