import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotifProvider } from "./context/NotifContext";
import MainLayout from "./pages/MainLayout";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import DMPage from "./pages/DMPage";
import ProfilePage from "./pages/ProfilePage";

function Guard({ children, require: requireAuth }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-screen">
      <div className="loading-inner">
        <div className="spinner" />
        <span>Loading Nexus…</span>
      </div>
    </div>
  );
  if (requireAuth && !user) return <Navigate to="/auth" replace />;
  if (!requireAuth && user) return <Navigate to="/chat" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Guard require={false}><AuthPage /></Guard>} />
      <Route element={<Guard require={true}><MainLayout /></Guard>}>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:roomId" element={<ChatPage />} />
        <Route path="/dm" element={
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <h2>Your Messages</h2>
            <p>Select a conversation or search for someone</p>
          </div>
        } />
        <Route path="/dm/:dmId" element={<DMPage />} />
        <Route path="/u/:username" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/chat" replace />} />
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
