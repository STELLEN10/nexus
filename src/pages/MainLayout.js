import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRooms } from "../hooks/useChat";
import { useDMs, useDMRequests } from "../hooks/useDMs";
import { usePresence } from "../hooks/useChat";
import Avatar from "../components/shared/Avatar";
import UserSearch from "../components/dm/UserSearch";
import DMRequestsBadge from "../components/dm/DMRequestsBadge";

export default function MainLayout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("rooms");
  const [showSearch, setShowSearch] = useState(false);
  const { rooms, loading: roomsLoading, createRoom } = useRooms();
  const { dms, loading: dmsLoading } = useDMs();
  const { incoming } = useDMRequests();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", description: "", type: "public" });
  usePresence();

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.name.trim()) return;
    const id = await createRoom(newRoom.name, newRoom.description, newRoom.type);
    setShowCreateRoom(false);
    setNewRoom({ name: "", description: "", type: "public" });
    navigate(`/chat/${id}`);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="app-shell">
      {/* Nav rail */}
      <nav className="nav-rail">
        <div className="nav-rail-top">
          <div className="nav-logo">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M14 2C7.373 2 2 7.373 2 14c0 2.09.536 4.052 1.474 5.762L2 26l6.48-1.448A11.952 11.952 0 0014 26c6.627 0 12-5.373 12-12S20.627 2 14 2z" fill="currentColor"/>
            </svg>
          </div>
          <button className={`nav-btn ${isActive("/chat") ? "active" : ""}`} onClick={() => { setActiveTab("rooms"); navigate("/chat"); }} title="Channels">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
          <button className={`nav-btn ${isActive("/dm") ? "active" : ""}`} onClick={() => { setActiveTab("dms"); navigate("/dm"); }} title="Direct Messages">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {incoming.length > 0 && <span className="nav-badge">{incoming.length}</span>}
          </button>
          <button className={`nav-btn ${isActive("/u/") || isActive("/profile") ? "active" : ""}`} onClick={() => navigate(`/u/${profile?.username}`)} title="Profile">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
          <button className="nav-btn" onClick={() => setShowSearch(true)} title="Find people">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="nav-rail-bottom">
          <button className="nav-btn" onClick={() => navigate(`/u/${profile?.username}`)}>
            <Avatar user={profile} size={28} />
          </button>
          <button className="nav-btn" onClick={logout} title="Sign out">
            <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="sidebar">
        {isActive("/chat") && (
          <>
            <div className="sidebar-header">
              <span className="sidebar-title">Channels</span>
              <button className="icon-btn" onClick={() => setShowCreateRoom(v => !v)}>
                <svg width="13" height="13" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            {showCreateRoom && (
              <form className="create-room-form" onSubmit={handleCreateRoom}>
                <input autoFocus placeholder="Room name" value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} required />
                <input placeholder="Description (optional)" value={newRoom.description} onChange={e => setNewRoom({ ...newRoom, description: e.target.value })} />
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
              {rooms.map(room => (
                <button key={room.id} className={`room-item ${isActive(`/chat/${room.id}`) ? "active" : ""}`} onClick={() => navigate(`/chat/${room.id}`)}>
                  <span className="room-hash">{room.type === "private" ? "🔒" : "#"}</span>
                  <span className="room-item-name">{room.name}</span>
                </button>
              ))}
            </nav>
          </>
        )}

        {(isActive("/dm") || isActive("/dm/")) && (
          <>
            <div className="sidebar-header">
              <span className="sidebar-title">Messages</span>
              <button className="icon-btn" onClick={() => setShowSearch(true)} title="New DM">
                <svg width="13" height="13" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <DMRequestsBadge />
            <nav className="room-list">
              {dms.map(dm => (
                <button key={dm.id} className={`room-item ${isActive(`/dm/${dm.id}`) ? "active" : ""}`} onClick={() => navigate(`/dm/${dm.id}`)}>
                  <Avatar user={dm.otherUser} size={26} online={false} />
                  <div className="room-item-info">
                    <span className="room-item-name">{dm.otherUser?.displayName || dm.otherUser?.username || "User"}</span>
                    {dm.lastMessage && <span className="room-item-desc">{dm.lastMessage.content?.substring(0, 28)}</span>}
                  </div>
                  {dm.unread?.[profile?.uid] > 0 && <span className="unread-dot">{dm.unread[profile.uid]}</span>}
                </button>
              ))}
              {!dmsLoading && dms.length === 0 && <div className="sidebar-empty">No messages yet.<br />Search for someone to chat!</div>}
            </nav>
          </>
        )}
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>

      {showSearch && <UserSearch onClose={() => setShowSearch(false)} />}
    </div>
  );
}
