import { useState, useEffect, useCallback } from "react";
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where, serverTimestamp, arrayUnion, arrayRemove, increment, limit } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";

export function useFeed(profileUid = null) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    const q = profileUid
      ? query(collection(db, "posts"), where("wallOwner", "==", profileUid), orderBy("createdAt", "desc"))
      : query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(40));
    const unsub = onSnapshot(q, snap => { setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    return unsub;
  }, [user, profileUid]);

  const createPost = useCallback(async ({ content, image, wallOwner }) => {
    const post = { content: content || "", authorId: user.uid, authorName: user.displayName || "User", authorAvatar: "", wallOwner: wallOwner || user.uid, imageUrl: "", likes: [], reactions: {}, commentCount: 0, createdAt: serverTimestamp() };
    if (image) { const path = `posts/${user.uid}/${Date.now()}.${image.name.split(".").pop()}`; const snap = await uploadBytes(storageRef(storage, path), image); post.imageUrl = await getDownloadURL(snap.ref); }
    const postRef = await addDoc(collection(db, "posts"), post);
    if (wallOwner && wallOwner !== user.uid) {
      await addDoc(collection(db, "notifications"), { type: "wall_post", fromUid: user.uid, fromUsername: user.displayName || "Someone", toUid: wallOwner, postId: postRef.id, message: "posted on your wall", read: false, createdAt: serverTimestamp() });
    }
  }, [user]);

  const likePost = useCallback(async (postId, liked) => {
    await updateDoc(doc(db, "posts", postId), { likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid) });
  }, [user]);

  const reactPost = useCallback(async (postId, emoji, post) => {
    const userReaction = post.reactions?.[user.uid];
    await updateDoc(doc(db, "posts", postId), { [`reactions.${user.uid}`]: userReaction === emoji ? null : emoji });
  }, [user]);

  const deletePost = useCallback(async (postId) => { await deleteDoc(doc(db, "posts", postId)); }, []);
  return { posts, loading, createPost, likePost, reactPost, deletePost };
}

export function usePersonalisedFeed(followingList) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    const uids = [user.uid, ...(followingList || [])].slice(0, 10);
    if (uids.length === 0) { setLoading(false); return; }
    const q = query(collection(db, "posts"), where("authorId", "in", uids), orderBy("createdAt", "desc"), limit(50));
    const unsub = onSnapshot(q, snap => { setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    return unsub;
  }, [user, JSON.stringify(followingList)]);
  return { posts, loading };
}

export function useComments(postId) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState([]);
  useEffect(() => {
    if (!postId) return;
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => setComments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [postId]);
  const addComment = useCallback(async (content) => {
    await addDoc(collection(db, "posts", postId, "comments"), { content, authorId: user.uid, authorName: profile?.displayName || "User", authorAvatar: profile?.avatar || "", createdAt: serverTimestamp() });
    await updateDoc(doc(db, "posts", postId), { commentCount: increment(1) });
  }, [postId, user, profile]);
  const deleteComment = useCallback(async (commentId) => {
    await deleteDoc(doc(db, "posts", postId, "comments", commentId));
    await updateDoc(doc(db, "posts", postId), { commentCount: increment(-1) });
  }, [postId]);
  return { comments, addComment, deleteComment };
}
