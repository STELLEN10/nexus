import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { useRooms, usePresence } from "../hooks/useChat";
import { useDMs, useDMRequests } from "../hooks/useDMs";
import { useGroupDMs } from "../hooks/useGroupDMs";
import { useVibe } from "../hooks/useVibe";
import VibeAvatar from "../components/vibe/VibeAvatar";
import VibePicker from "../components/vibe/VibePicker";
import UserSearch from "../components/dm/UserSearch";
import DMRequestsBadge from "../components/dm/DMRequestsBadge";
import CreateGroupModal from "../components/dm/CreateGroupModal";
import NotificationBell from "../components/shared/NotificationBell";
import NexusLogo from "../components/shared/NexusLogo";

export default function MainLayout() {
  const { profile, logout } = useAuth();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [showVibePicker, setShowVibePicker] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { rooms, createRoom } = useRooms();
  const { dms } = useDMs();
  const { groups } = useGroupDMs();
  const { incoming } = useDMRequests();
  const { myVibe } = useVibe();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", description: "", type: "public" });
  const sidebarRef = useRef();
  usePresence();

  const is = (path) => location.pathname.startsWith(path);
  const hasSidebar = is("/chat") || is("/dm") || is("/group");

  useEffect(() => {
    const h = (e) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(e.target))
        setSidebarOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [sidebarOpen]);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.name.trim()) return;
    const id = await createRoom(newRoom.name, newRoom.description, newRoom.type);
    setShowCreateRoom(false);
    setNewRoom({ name: "", description: "", type: "public" });
    navigate(`/chat/${id}`);
  };

  const SidebarContent = () => (
    <>
      {is("/chat") && (
        <>
          <div className="sidebar-head">
            <span>Channels</span>
            <button className="icon-btn" onClick={() => setShowCreateRoom(v => !v)}>
              <svg width="13" height="13" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>
          {showCreateRoom && (
            <form className="create-room-form" onSubmit={handleCreateRoom}>
              <input autoFocus placeholder="Room name" value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} required />
              <input placeholder="Description" value={newRoom.description} onChange={e => setNewRoom({ ...newRoom, description: e.target.value })} />
              <select value={newRoom.type} onChange={e => setNewRoom({ ...newRoom, type: e.target.value })}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <div className="create-room-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowCreateRoom(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          )}
          <nav className="room-list">
            {rooms.map(r => (
              <button key={r.id} className={`room-item ${is(`/chat/${r.id}`) ? "active" : ""}`} onClick={() => navigate(`/chat/${r.id}`)}>
                <span className="room-hash">{r.type === "private" ? "🔒" : "#"}</span>
                <span className="room-name">{r.name}</span>
              </button>
            ))}
          </nav>
        </>
      )}

      {(is("/dm") || is("/group")) && (
        <>
          <div className="sidebar-head">
            <span>Messages</span>
            <div style={{ display: "flex", gap: 2 }}>
              <button className="icon-btn" onClick={() => setShowCreateGroup(true)} title="New group">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M12 8a3 3 0 100-6 3 3 0 000 6zM4 8a3 3 0 100-6 3 3 0 000 6zM0 14c0-2.2 1.8-4 4-4h1M8 14c0-2.2 1.8-4 4-4h0a4 4 0 014 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
              </button>
              <button className="icon-btn" onClick={() => setShowSearch(true)} title="New DM">
                <svg width="13" height="13" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
          </div>
          <DMRequestsBadge />
          {groups.length > 0 && (
            <>
              <div className="sidebar-section-label">Groups</div>
              <nav className="room-list">
                {groups.map(g => (
                  <button key={g.id} className={`room-item ${is(`/group/${g.id}`) ? "active" : ""}`} onClick={() => navigate(`/group/${g.id}`)}>
                    <div className="group-avatar-mini">👥</div>
                    <div className="room-item-info">
                      <span className="room-name">{g.name}</span>
                      {g.lastMessage && <span className="room-preview">{g.lastMessage.content?.substring(0, 24)}</span>}
                    </div>
                  </button>
                ))}
              </nav>
              <div className="sidebar-section-label">Direct</div>
            </>
          )}
          <nav className="room-list">
            {dms.length === 0 && groups.length === 0 ? (
              <div className="sidebar-empty">
                No conversations yet.<br />
                <button className="sidebar-new-dm-btn" onClick={() => setShowSearch(true)}>+ Start a conversation</button>
              </div>
            ) : dms.length === 0 ? (
              <div className="sidebar-empty-small">No direct messages yet.</div>
            ) : (
              dms.map(dm => (
                <button key={dm.id} className={`room-item ${is(`/dm/${dm.id}`) ? "active" : ""}`} onClick={() => navigate(`/dm/${dm.id}`)}>
                  <VibeAvatar user={dm.otherUser} uid={dm.otherUser?.uid} size={26} showVibe={true} />
                  <div className="room-item-info">
                    <span className="room-name">{dm.otherUser?.displayName || "User"}</span>
                    {dm.lastMessage && <span className="room-preview">{dm.lastMessage.content?.substring(0, 28) || "📎 Attachment"}</span>}
                  </div>
                  {dm.unread?.[profile?.uid] > 0 && <span className="unread-badge">{dm.unread[profile.uid]}</span>}
                </button>
              ))
            )}
          </nav>
        </>
      )}
    </>
  );

  return (
    <div className="shell">
      {/* ── Rail ── */}
      <nav className="rail">
        <div className="rail-top">
          <div className="rail-logo">
            <NexusLogo size={36} />
          </div>
          <button className={`rail-btn ${is("/feed") ? "active" : ""}`} onClick={() => navigate("/feed")} title="Home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button className={`rail-btn ${is("/chat") ? "active" : ""}`} onClick={() => { navigate("/chat"); setSidebarOpen(true); }} title="Channels">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
          <button className={`rail-btn ${is("/dm") || is("/group") ? "active" : ""}`} onClick={() => { navigate("/dm"); setSidebarOpen(true); }} title="Messages">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {incoming.length > 0 && <span className="rail-badge">{incoming.length}</span>}
          </button>
          <button className={`rail-btn ${is("/u/") ? "active" : ""}`} onClick={() => navigate(`/u/${profile?.username}`)} title="Profile">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
          <button className="rail-btn" onClick={() => setShowSearch(true)} title="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
          <NotificationBell />
        </div>

        <div className="rail-bottom">
          {/* Vibe button — opens portal-based centered modal */}
          <button
            className="rail-btn vibe-rail-btn"
            onClick={() => setShowVibePicker(v => !v)}
            title="Set your vibe"
          >
            {myVibe
              ? <span style={{ fontSize: 18 }}>{myVibe.emoji}</span>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            }
            {myVibe && <span className="vibe-rail-dot" style={{ background: myVibe.color }} />}
          </button>

          <button className="rail-btn" onClick={() => navigate(`/u/${profile?.username}`)}>
            <VibeAvatar user={profile} uid={user?.uid} size={28} showVibe={false} />
          </button>
          <button className="rail-btn" onClick={logout} title="Sign out">
            <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </nav>

      {/* ── Desktop Sidebar — only on chat/dm/group ── */}
      {hasSidebar && (
        <aside className="sidebar desktop-sidebar">
          <SidebarContent />
        </aside>
      )}

      {/* ── Tablet/Mobile Drawer ── */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside ref={sidebarRef} className={`sidebar drawer-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="drawer-sidebar-head">
          <button className="icon-btn" onClick={() => setSidebarOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* ── Main content ── */}
      <main className="main-area"><Outlet /></main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="bottom-tab-bar">
        <button className={`bottom-tab ${is("/feed") ? "active" : ""}`} onClick={() => navigate("/feed")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span>Home</span>
        </button>
        <button className={`bottom-tab ${is("/chat") ? "active" : ""}`} onClick={() => { navigate("/chat"); setSidebarOpen(true); }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          <span>Channels</span>
        </button>
        <button className={`bottom-tab ${is("/dm") || is("/group") ? "active" : ""}`} onClick={() => { navigate("/dm"); setSidebarOpen(true); }}>
          <div style={{ position: "relative" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {incoming.length > 0 && <span className="bottom-tab-badge">{incoming.length}</span>}
          </div>
          <span>Messages</span>
        </button>
        <button className="bottom-tab" onClick={() => setShowSearch(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          <span>Search</span>
        </button>
        <button className={`bottom-tab ${is("/u/") ? "active" : ""}`} onClick={() => navigate(`/u/${profile?.username}`)}>
          <VibeAvatar user={profile} uid={user?.uid} size={24} showVibe={false} />
          <span>Profile</span>
        </button>
      </nav>

      {/* ── Portals — rendered directly into document.body ── */}

      {/* Vibe picker — centered modal via portal */}
      {showVibePicker && createPortal(
        <div className="modal-bg" onClick={() => setShowVibePicker(false)}>
          <div className="vibe-modal" onClick={e => e.stopPropagation()}>
            <div className="vibe-modal-head">
              <span>Set your vibe</span>
              <button className="icon-btn" onClick={() => setShowVibePicker(false)}>✕</button>
            </div>
            <VibePicker onClose={() => setShowVibePicker(false)} />
          </div>
        </div>,
        document.body
      )}

      {showSearch && <UserSearch onClose={() => setShowSearch(false)} />}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} onCreated={(id) => navigate(`/group/${id}`)} />}
    </div>
  );
}
