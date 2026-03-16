import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB1zMjktXWn8_JvkiHkUjjEWhDPgRZ4u0k",
  authDomain: "nexus-chat-10.firebaseapp.com",
  projectId: "nexus-chat-10",
  storageBucket: "nexus-chat-10.firebasestorage.app",
  messagingSenderId: "656064150551",
  appId: "1:656064150551:web:77f16668f5baf4d48f7052",
  measurementId: "G-6N1RB6LRL1",
  databaseURL: "https://nexus-chat-10-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export default app;
