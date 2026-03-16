import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotifProvider } from "./context/NotifContext";
import MainLayout from "./pages/MainLayout";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import DMPage from "./pages/DMPage";
import ProfilePage from "./pages/ProfilePage";
import FeedPage from "./pages/FeedPage";

function Guard({ children, require: requireAuth }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="splash">
      <div className="splash-logo">
        <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
          <path d="M14 2C7.373 2 2 7.373 2 14c0 2.09.536 4.052 1.474 5.762L2 26l6.48-1.448A11.952 11.952 0 0014 26c6.627 0 12-5.373 12-12S20.627 2 14 2z" fill="currentColor"/>
        </svg>
      </div>
      <span>Nexus</span>
    </div>
  );
  if (requireAuth && !user) return <Navigate to="/auth" replace />;
  if (!requireAuth && user) return <Navigate to="/feed" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Guard require={false}><AuthPage /></Guard>} />
      <Route element={<Guard require={true}><MainLayout /></Guard>}>
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:roomId" element={<ChatPage />} />
        <Route path="/dm" element={<div className="page-empty"><div style={{ fontSize: 32 }}>💬</div><h2>Your Messages</h2><p>Select a conversation or find someone</p></div>} />
        <Route path="/dm/:dmId" element={<DMPage />} />
        <Route path="/u/:username" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotifProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </NotifProvider>
    </AuthProvider>
  );
}
