import { useState, useEffect, useCallback } from "react";
import {
  collection, doc, setDoc, getDoc, getDocs, updateDoc,
  query, where, onSnapshot, orderBy, serverTimestamp,
  deleteDoc, addDoc,
} from "firebase/firestore";
import {
  ref, push, onChildAdded, onChildChanged, off,
  update, remove,
} from "firebase/database";
import { db, rtdb } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNotif } from "../context/NotifContext";

// Generate a consistent DM room ID from two uids
export function dmId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

export function useDMRequests() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);

  useEffect(() => {
    if (!user) return;
    const inQ = query(collection(db, "dmRequests"), where("to", "==", user.uid), where("status", "==", "pending"));
    const outQ = query(collection(db, "dmRequests"), where("from", "==", user.uid), where("status", "==", "pending"));
    const u1 = onSnapshot(inQ, s => setIncoming(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(outQ, s => setOutgoing(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); };
  }, [user]);

  const sendRequest = async (toUser) => {
    const id = dmId(user.uid, toUser.uid);
    // Check if DM already exists
    const dmSnap = await getDoc(doc(db, "dms", id));
    if (dmSnap.exists()) return { exists: true, id };
    // Check if request already sent
    const existing = query(collection(db, "dmRequests"),
      where("from", "==", user.uid), where("to", "==", toUser.uid));
    const snap = await getDocs(existing);
    if (!snap.empty) return { pending: true };

    await addDoc(collection(db, "dmRequests"), {
      from: user.uid,
      fromUsername: user.displayName || user.email,
      to: toUser.uid,
      toUsername: toUser.displayName,
      status: "pending",
      createdAt: serverTimestamp(),
    });
    return { sent: true };
  };

  const acceptRequest = async (request) => {
    const id = dmId(request.from, request.to);
    await setDoc(doc(db, "dms", id), {
      id,
      members: [request.from, request.to],
      memberNames: { [request.from]: request.fromUsername, [request.to]: request.toUsername },
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
    });
    await updateDoc(doc(db, "dmRequests", request.id), { status: "accepted" });
    return id;
  };

  const declineRequest = async (requestId) => {
    await updateDoc(doc(db, "dmRequests", requestId), { status: "declined" });
  };

  return { incoming, outgoing, sendRequest, acceptRequest, declineRequest };
}

export function useDMs() {
  const { user } = useAuth();
  const [dms, setDms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "dms"), where("members", "array-contains", user.uid), orderBy("lastActivity", "desc"));
    const unsub = onSnapshot(q, async (snap) => {
      const list = await Promise.all(snap.docs.map(async d => {
        const data = { id: d.id, ...d.data() };
        const otherId = data.members.find(m => m !== user.uid);
        const otherSnap = await getDoc(doc(db, "users", otherId));
        return { ...data, otherUser: otherSnap.exists() ? otherSnap.data() : null };
      }));
      setDms(list);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { dms, loading };
}

export function useDMMessages(dmRoomId) {
  const { user, profile } = useAuth();
  const { notify } = useNotif();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dmRoomId || !user) return;
    setMessages([]);
    setLoading(true);
    let initialDone = false;

    const msgsRef = ref(rtdb, `dms/${dmRoomId}/messages`);
    const unsub = onChildAdded(msgsRef, (snap) => {
      const msg = { id: snap.key, ...snap.val() };
      setMessages(prev => prev.find(m => m.id === snap.key) ? prev : [...prev, msg]);
      setLoading(false);
      // Mark as read & notify
      if (initialDone && msg.senderId !== user.uid) {
        update(ref(rtdb, `dms/${dmRoomId}/messages/${snap.key}`), { [`readBy/${user.uid}`]: true });
        notify(`${msg.senderName}`, msg.type === "sticker" ? "Sent a sticker" : msg.content);
        // Update unread count
        updateDoc(doc(db, "dms", dmRoomId), { [`unread.${user.uid}`]: 0 });
      }
    });

    const unsub2 = onChildChanged(msgsRef, (snap) => {
      setMessages(prev => prev.map(m => m.id === snap.key ? { id: snap.key, ...snap.val() } : m));
    });

    const timer = setTimeout(() => {
      initialDone = true;
      setLoading(false);
      // Mark all as read on open
      updateDoc(doc(db, "dms", dmRoomId), { [`unread.${user.uid}`]: 0 }).catch(() => {});
    }, 600);

    return () => {
      off(msgsRef, "child_added", unsub);
      off(msgsRef, "child_changed", unsub2);
      clearTimeout(timer);
    };
  }, [dmRoomId, user]);

  const sendDM = useCallback(async (content, type = "text", replyTo = null) => {
    if (!content?.trim() && type === "text") return;
    const msgsRef = ref(rtdb, `dms/${dmRoomId}/messages`);
    const msg = {
      content: content || "",
      type,
      senderId: user.uid,
      senderName: profile?.displayName || profile?.username || "User",
      senderAvatar: profile?.avatar || "",
      replyTo: replyTo ? { id: replyTo.id, content: replyTo.content, senderName: replyTo.senderName } : null,
      createdAt: Date.now(),
      readBy: { [user.uid]: true },
      reactions: {},
    };
    await push(msgsRef, msg);
    await updateDoc(doc(db, "dms", dmRoomId), {
      lastMessage: { content: type === "sticker" ? "🎭 Sticker" : content, senderId: user.uid },
      lastActivity: serverTimestamp(),
    });
  }, [dmRoomId, user, profile]);

  const reactToDM = useCallback(async (msgId, emoji) => {
    const msg = messages.find(m => m.id === msgId);
    const hasReacted = msg?.reactions?.[emoji]?.[user.uid];
    const path = ref(rtdb, `dms/${dmRoomId}/messages/${msgId}/reactions/${emoji}/${user.uid}`);
    if (hasReacted) await remove(path);
    else await update(ref(rtdb, `dms/${dmRoomId}/messages/${msgId}/reactions/${emoji}`), { [user.uid]: true });
  }, [dmRoomId, user, messages]);

  return { messages, loading, sendDM, reactToDM };
}
