import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp,
  collection, query, where, getDocs,
} from "firebase/firestore";
import { ref, set, remove, onDisconnect } from "firebase/database";
import { auth, db, rtdb } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          setProfile(snap.data());
          // Set presence
          const presRef = ref(rtdb, `presence/${u.uid}`);
          set(presRef, { online: true, lastSeen: Date.now() });
          onDisconnect(presRef).set({ online: false, lastSeen: Date.now() });
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const register = async (username, email, password) => {
    // Check username uniqueness
    const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
    const snap = await getDocs(q);
    if (!snap.empty) throw { code: "username-taken" };

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: username });

    const userProfile = {
      uid: cred.user.uid,
      username: username.toLowerCase(),
      displayName: username,
      email,
      avatar: "",
      bio: "",
      status: "online",
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", cred.user.uid), userProfile);
    // Also create a username lookup doc for fast search
    await setDoc(doc(db, "usernames", username.toLowerCase()), { uid: cred.user.uid });
    setProfile(userProfile);
  };

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await updateDoc(doc(db, "users", cred.user.uid), { status: "online" });
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    setProfile(snap.data());
  };

  const logout = async () => {
    if (user) {
      await updateDoc(doc(db, "users", user.uid), { status: "offline", lastSeen: serverTimestamp() });
      remove(ref(rtdb, `presence/${user.uid}`));
    }
    await signOut(auth);
  };

  const updateUserProfile = async (updates) => {
    await updateDoc(doc(db, "users", user.uid), updates);
    setProfile(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
