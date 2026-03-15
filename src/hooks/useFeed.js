import { useState, useEffect, useCallback } from "react";
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, where, serverTimestamp,
  getDoc, arrayUnion, arrayRemove, increment,
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNotif } from "../context/NotifContext";

export function useFeed(profileUid = null) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let q;
    if (profileUid) {
      // Wall of a specific user
      q = query(collection(db, "posts"), where("wallOwner", "==", profileUid), orderBy("createdAt", "desc"));
    } else {
      // Global feed
      q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    }
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user, profileUid]);

  const createPost = useCallback(async ({ content, image, wallOwner }) => {
    const post = {
      content: content || "",
      authorId: user.uid,
      authorName: user.profile?.displayName || user.displayName,
      wallOwner: wallOwner || user.uid,
      imageUrl: "",
      likes: [],
      commentCount: 0,
      createdAt: serverTimestamp(),
    };

    if (image) {
      const ext = image.name.split(".").pop();
      const path = `posts/${user.uid}/${Date.now()}.${ext}`;
      const sRef = storageRef(storage, path);
      const snap = await uploadBytes(sRef, image);
      post.imageUrl = await getDownloadURL(snap.ref);
    }

    await addDoc(collection(db, "posts"), post);
  }, [user]);

  const likePost = useCallback(async (postId, liked) => {
    const ref = doc(db, "posts", postId);
    await updateDoc(ref, {
      likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  }, [user]);

  const deletePost = useCallback(async (postId) => {
    await deleteDoc(doc(db, "posts", postId));
  }, []);

  return { posts, loading, createPost, likePost, deletePost };
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
    await addDoc(collection(db, "posts", postId, "comments"), {
      content,
      authorId: user.uid,
      authorName: profile?.displayName || profile?.username || "User",
      authorAvatar: profile?.avatar || "",
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "posts", postId), { commentCount: increment(1) });
  }, [postId, user, profile]);

  const deleteComment = useCallback(async (commentId) => {
    await deleteDoc(doc(db, "posts", postId, "comments", commentId));
    await updateDoc(doc(db, "posts", postId), { commentCount: increment(-1) });
  }, [postId]);

  return { comments, addComment, deleteComment };
}
