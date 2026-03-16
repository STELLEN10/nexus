import { useState, useEffect, useCallback } from "react";
import {
  collection, doc, addDoc, getDocs, onSnapshot,
  query, where, orderBy, serverTimestamp, updateDoc,
  arrayUnion, Timestamp,
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";

// Stories expire after 24 hours
const STORY_TTL_MS = 24 * 60 * 60 * 1000;

export function useStories(followingList = []) {
  const { user, profile } = useAuth();
  const [stories, setStories] = useState([]); // grouped by user
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Watch all stories from followed users + own
    const uids = [user.uid, ...(followingList || [])].slice(0, 10);
    if (uids.length === 0) { setLoading(false); return; }

    const cutoff = Timestamp.fromMillis(Date.now() - STORY_TTL_MS);

    const q = query(
      collection(db, "stories"),
      where("authorId", "in", uids),
      where("createdAt", ">", cutoff),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, snap => {
      const allStories = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Group by authorId
      const grouped = {};
      allStories.forEach(story => {
        if (!grouped[story.authorId]) {
          grouped[story.authorId] = {
            authorId: story.authorId,
            authorName: story.authorName,
            authorAvatar: story.authorAvatar || "",
            stories: [],
            hasUnread: false,
          };
        }
        grouped[story.authorId].stories.push(story);
        // Mark as unread if current user hasn't seen it
        if (!story.seenBy?.includes(user.uid)) {
          grouped[story.authorId].hasUnread = true;
        }
      });

      // Own stories first, then others
      const sorted = Object.values(grouped).sort((a, b) => {
        if (a.authorId === user.uid) return -1;
        if (b.authorId === user.uid) return 1;
        return b.hasUnread - a.hasUnread;
      });

      setStories(sorted);
      setLoading(false);
    });

    return unsub;
  }, [user, JSON.stringify(followingList)]);

  const createStory = useCallback(async ({ type, text, bgColor, image }) => {
    let mediaUrl = "";

    if (image) {
      const path = `stories/${user.uid}/${Date.now()}.${image.name.split(".").pop()}`;
      const snap = await uploadBytes(storageRef(storage, path), image);
      mediaUrl = await getDownloadURL(snap.ref);
    }

    await addDoc(collection(db, "stories"), {
      type, // "text" | "image"
      text: text || "",
      bgColor: bgColor || "#7c3aed",
      mediaUrl,
      authorId: user.uid,
      authorName: profile?.displayName || "User",
      authorAvatar: profile?.avatar || "",
      seenBy: [user.uid],
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + STORY_TTL_MS),
    });
  }, [user, profile]);

  const markSeen = useCallback(async (storyId) => {
    if (!user) return;
    await updateDoc(doc(db, "stories", storyId), {
      seenBy: arrayUnion(user.uid),
    });
  }, [user]);

  return { stories, loading, createStory, markSeen };
}
