// src/context/AuthContext.js — hardened version
import { createContext, useContext, useEffect, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword,
         signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp,
         collection, query, where, getDocs } from "firebase/firestore";
import { ref, set, remove, onDisconnect } from "firebase/database";
import { auth, db, rtdb } from "../firebase";
import {
  validateUsername, validateEmail, validatePassword,
  validateBio, sanitizeText, validateImageFile, LIMITS
} from "../lib/validation";
import {
  checkAuthLimit, clearRateLimit, formatRetryAfter
} from "../lib/rateLimiter";

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
          const presRef = ref(rtdb, `presence/${u.uid}`);
          set(presRef, { online: true, lastSeen: Date.now() });
          onDisconnect(presRef).set({ online: false, lastSeen: Date.now() });
        }
      } else { setUser(null); setProfile(null); }
      setLoading(false);
    });
    return unsub;
  }, []);

  const register = async (username, email, password) => {
    // Rate limit by email
    const rl = checkAuthLimit(email.toLowerCase());
    if (!rl.allowed) throw { code: "auth/too-many-requests", message: `Too many attempts. Try again in ${formatRetryAfter(rl.retryAfterMs)}.` };

    // Validate all fields
    const uResult = validateUsername(username);
    if (!uResult.ok) throw { code: "validation-error", message: uResult.error };

    const eResult = validateEmail(email);
    if (!eResult.ok) throw { code: "validation-error", message: eResult.error };

    const pResult = validatePassword(password);
    if (!pResult.ok) throw { code: "validation-error", message: pResult.error };

    // Check username uniqueness
    const q = query(collection(db, "users"), where("username", "==", uResult.value));
    const snap = await getDocs(q);
    if (!snap.empty) throw { code: "username-taken" };

    const cred = await createUserWithEmailAndPassword(auth, eResult.value, pResult.value);
    await updateProfile(cred.user, { displayName: uResult.value });

    const userProfile = {
      uid: cred.user.uid,
      username: uResult.value,
      displayName: uResult.value,
      email: eResult.value,
      avatar: "",
      bio: "",
      status: "online",
      followersCount: 0,
      followingCount: 0,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, "users", cred.user.uid), userProfile);
    await setDoc(doc(db, "usernames", uResult.value), { uid: cred.user.uid });
    clearRateLimit(`auth:${eResult.value}`);
    setProfile(userProfile);
  };

  const login = async (email, password) => {
    const eResult = validateEmail(email);
    if (!eResult.ok) throw { code: "validation-error", message: eResult.error };

    // Rate limit by email
    const rl = checkAuthLimit(eResult.value);
    if (!rl.allowed) throw { code: "auth/too-many-requests", message: `Too many attempts. Try again in ${formatRetryAfter(rl.retryAfterMs)}.` };

    const cred = await signInWithEmailAndPassword(auth, eResult.value, password);
    clearRateLimit(`auth:${eResult.value}`);
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
    if (!user) return;

    // Only allow safe fields
    const ALLOWED_UPDATE_FIELDS = ["username", "displayName", "avatar", "bio", "status", "email"];
    const safe = {};

    if ("bio" in updates) {
      const v = validateBio(updates.bio);
      if (!v.ok) throw new Error(v.error);
      safe.bio = v.value;
    }
    if ("displayName" in updates) {
      safe.displayName = sanitizeText(updates.displayName).slice(0, LIMITS.DISPLAY_NAME_MAX);
    }
    if ("username" in updates) {
      const v = validateUsername(updates.username);
      if (!v.ok) throw new Error(v.error);
      safe.username = v.value;
    }
    if ("avatar" in updates) {
      // Only allow Firebase Storage URLs
      if (typeof updates.avatar === "string" &&
          updates.avatar.startsWith("https://firebasestorage.googleapis.com")) {
        safe.avatar = updates.avatar;
      } else if (updates.avatar === "") {
        safe.avatar = "";
      }
    }
    if ("email" in updates) {
      const v = validateEmail(updates.email);
      if (!v.ok) throw new Error(v.error);
      safe.email = v.value;
    }
    if ("status" in updates && ["online","offline","away"].includes(updates.status)) {
      safe.status = updates.status;
    }

    if (Object.keys(safe).length === 0) return;

    await updateDoc(doc(db, "users", user.uid), safe);
    if (safe.displayName || safe.avatar) {
      await updateProfile(user, {
        ...(safe.displayName ? { displayName: safe.displayName } : {}),
        ...(safe.avatar ? { photoURL: safe.avatar } : {}),
      });
    }
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) setProfile(snap.data());
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
