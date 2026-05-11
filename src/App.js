import OnboardingTutorial from "./components/shared/OnboardingTutorial";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotifProvider } from "./context/NotifContext";
import { ThemeProvider } from "./context/ThemeContext";
import MainLayout from "./pages/MainLayout";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import DMPage from "./pages/DMPage";
import ProfilePage from "./pages/ProfilePage";
import FeedPage from "./pages/FeedPage";
import NexusLogo from "./components/shared/NexusLogo";



function Guard({ children, require: requireAuth }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="splash">
      <div className="splash-logo">
        <NexusLogo size={64} />
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
    <ThemeProvider>
      <AuthProvider>
        <NotifProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </NotifProvider>
      </AuthProvider>
    </ThemeProvider>
  <OnboardingTutorial />
  );
}
