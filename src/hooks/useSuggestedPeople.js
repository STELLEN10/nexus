import { useState, useEffect } from "react";
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export function useSuggestedPeople(followingList = []) {
  const { user } = useAuth();
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const alreadyKnown = new Set([user.uid, ...followingList]);
        let candidates = [];

        // Strategy 1: Friends of friends
        if (followingList.length > 0) {
          const sample = followingList.slice(0, 5);
          for (const fid of sample) {
            const snap = await getDocs(
              query(collection(db, "follows"), where("followerId", "==", fid), limit(10))
            );
            snap.docs.forEach(d => {
              const uid = d.data().followingId;
              if (!alreadyKnown.has(uid)) candidates.push(uid);
            });
          }
        }

        // Strategy 2: Popular users (most followers) if not enough candidates
        if (candidates.length < 6) {
          const snap = await getDocs(
            query(collection(db, "users"), where("followersCount", ">", 0), limit(20))
          );
          snap.docs.forEach(d => {
            if (!alreadyKnown.has(d.id)) candidates.push(d.id);
          });
        }

        // Strategy 3: Random users as fallback
        if (candidates.length < 3) {
          const snap = await getDocs(query(collection(db, "users"), limit(20)));
          snap.docs.forEach(d => {
            if (!alreadyKnown.has(d.id)) candidates.push(d.id);
          });
        }

        // Deduplicate and limit
        const uniqueIds = [...new Set(candidates)].slice(0, 8);

        // Fetch profiles
        const profiles = await Promise.all(
          uniqueIds.map(id => getDoc(doc(db, "users", id)))
        );

        setSuggested(
          profiles
            .filter(s => s.exists())
            .map(s => ({ id: s.id, ...s.data() }))
            .slice(0, 6)
        );
      } catch (err) {
        console.error("Suggestions error:", err);
      }
      setLoading(false);
    };

    fetch();
  }, [user, JSON.stringify(followingList)]);

  return { suggested, loading };
}
