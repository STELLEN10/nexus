import { createContext, useContext, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

const NotifContext = createContext(null);

export function NotifProvider({ children }) {
  const { user } = useAuth();
  const permissionRef = useRef("default");

  useEffect(() => {
    if ("Notification" in window) {
      permissionRef.current = Notification.permission;
      if (Notification.permission === "default") {
        Notification.requestPermission().then(p => { permissionRef.current = p; });
      }
    }
  }, [user]);

  const notify = (title, body, onClick) => {
    if (!user) return;
    if (!("Notification" in window)) return;
    if (document.visibilityState === "visible") return; // don't notify if tab is active
    if (Notification.permission !== "granted") return;

    const n = new Notification(title, {
      body,
      icon: "/logo192.png",
      badge: "/logo192.png",
    });
    if (onClick) n.onclick = () => { window.focus(); onClick(); n.close(); };
  };

  return <NotifContext.Provider value={{ notify }}>{children}</NotifContext.Provider>;
}

export const useNotif = () => useContext(NotifContext);
