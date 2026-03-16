import { createContext, useContext, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
const NotifContext = createContext(null);
export function NotifProvider({ children }) {
  const { user } = useAuth();
  const permRef = useRef("default");
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(p => { permRef.current = p; });
    }
  }, [user]);
  const notify = (title, body, onClick) => {
    if (!user || !("Notification" in window) || document.visibilityState === "visible" || Notification.permission !== "granted") return;
    const n = new Notification(title, { body, icon: "/logo192.png" });
    if (onClick) n.onclick = () => { window.focus(); onClick(); n.close(); };
  };
  return <NotifContext.Provider value={{ notify }}>{children}</NotifContext.Provider>;
}
export const useNotif = () => useContext(NotifContext);
