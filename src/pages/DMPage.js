import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDMMessages } from "../hooks/useDMs";
import { useOnlineStatus } from "../hooks/useUsers";
import { getWallpaper, setWallpaper, WALLPAPERS } from "../hooks/useWallpaper";
import VibeAvatar from "../components/vibe/VibeAvatar";
import DMBubble from "../components/dm/DMBubble";
import StickerPickerModal from "../components/dm/StickerPickerModal";
import VoiceRecorder from "../components/dm/VoiceRecorder";

function WallpaperPicker({ dmId, current, onClose }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div style={{
        position: "relative",
        background: "var(--bg-1)", border: "1.5px solid var(--border-2)",
        borderRadius: "var(--r-xl)", padding: 16, zIndex: 50,
        boxShadow: "0 8px 32px rgba(0,0,0,.7), 0 0 20px var(--glow-purple)",
        width: 280,
      }} onClick={e => e.stopPropagation()}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>
        Chat wallpaper
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {WALLPAPERS.map(w => (
          <button
            key={w.id}
            onClick={() => { setWallpaper(dmId, w.id); onClose(); }}
            style={{
              height: 56, borderRadius: "var(--r-md)", cursor: "pointer",
              border: current === w.id ? "2.5px solid var(--accent)" : "1.5px solid var(--border)",
              background: w.style.background || "var(--bg-2)",
              backgroundImage: w.style.backgroundImage || "none",
              backgroundSize: w.style.backgroundSize || "auto",
              backgroundColor: w.style.backgroundColor || "var(--bg-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700,
              color: w.id === "none" ? "var(--text-2)" : "rgba(255,255,255,.85)",
              transition: "border-color .15s",
              boxShadow: current === w.id ? "0 0 10px var(--glow-purple)" : "none",
            }}
          >
            {w.label}
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}

export default function DMPage() {
  const { dmId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [showStickers, setShowStickers] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [wallpaper, setWallpaperState] = useState(() => getWallpaper(dmId));
  const inputRef = useRef();
  const bottomRef = useRef();
  const { messages, loading, sendDM, deleteDM, reactToDM } = useDMMessages(dmId);

  const otherMsg = messages.find(m => m.senderId !== user?.uid);
  const otherUser = otherMsg
    ? { username: otherMsg.senderName, displayName: otherMsg.senderName, avatar: otherMsg.senderAvatar }
    : null;
  const online = useOnlineStatus(otherMsg?.senderId);

  // Listen for wallpaper changes
  useEffect(() => {
    const handler = (e) => {
      if (e.detail.roomId === dmId) {
        setWallpaperState(getWallpaper(dmId));
      }
    };
    window.addEventListener("wallpaper-change", handler);
    return () => window.removeEventListener("wallpaper-change", handler);
  }, [dmId]);

  // Reset wallpaper when room changes
  useEffect(() => {
    setWallpaperState(getWallpaper(dmId));
  }, [dmId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);
  useEffect(() => {
    inputRef.current?.focus();
    const handleResize = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => window.visualViewport?.removeEventListener("resize", handleResize);
  }, [dmId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const c = input.trim();
    setInput("");
    setReplyTo(null);
    await sendDM(c, "text", replyTo);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  };

  const handleSticker = async (url) => {
    setShowStickers(false);
    await sendDM(url, "sticker");
  };

  const handleVoice = async (url) => {
    setShowVoice(false);
    await sendDM(url, "voice");
  };

  return (
    <>
      <div className="chat-window">
        {/* Topbar */}
        <div className="chat-topbar">
          <button className="icon-btn" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <VibeAvatar user={otherUser} uid={otherMsg?.senderId} size={32} online={online} showVibe={true} tappable={true} />
          <div style={{ flex: 1 }}>
            <span className="dm-topbar-name">{otherUser?.displayName || "User"}</span>
            <span className={`dm-topbar-status ${online ? "on" : ""}`}>{online ? "● online" : "offline"}</span>
          </div>
          {/* Wallpaper picker trigger */}
          <div style={{ position: "relative" }}>
            <button
              className="icon-btn"
              onClick={() => setShowWallpaper(v => !v)}
              title="Chat wallpaper"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showWallpaper && (
              createPortal(
                <WallpaperPicker
                  dmId={dmId}
                  current={wallpaper.id}
                  onClose={() => setShowWallpaper(false)}
                />,
                document.body
              )
            )}
          </div>
        </div>

        {/* Messages area with wallpaper applied */}
        <div
          className="messages-area"
          style={{
            ...wallpaper.style,
            backgroundAttachment: "local",
          }}
        >
          {loading && [1, 2, 3].map(i => <div key={i} className="skeleton-msg" style={{ width: `${50 + i * 12}%` }} />)}
          {!loading && messages.length === 0 && (
            <div className="messages-empty">
              <div style={{ fontSize: 32 }}>💬</div>
              <p>Start a conversation with {otherUser?.displayName || "User"}</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const prev = messages[i - 1];
            return (
              <DMBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === user?.uid}
                isGrouped={prev && prev.senderId === msg.senderId && msg.createdAt - prev.createdAt < 300000}
                onReply={() => !msg.deleted && setReplyTo(msg)}
                onReact={e => reactToDM(msg.id, e)}
                onDelete={() => deleteDM && deleteDM(msg.id)}
              />
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply bar */}
        {replyTo && (
          <div className="reply-bar">
            <div>
              <span className="reply-bar-label">↩ Replying to {replyTo.senderName}</span>
              <span className="reply-bar-preview">
                {replyTo.type === "sticker" ? "🎭 Sticker" : replyTo.type === "voice" ? "🎙 Voice" : replyTo.content?.substring(0, 80)}
              </span>
            </div>
            <button className="icon-btn" onClick={() => setReplyTo(null)}>✕</button>
          </div>
        )}

        {showVoice && <VoiceRecorder onSend={handleVoice} onClose={() => setShowVoice(false)} />}

        {/* Input bar */}
        <form className="input-bar" onSubmit={handleSend}>
          <div className="input-bar-inner">
            <button type="button" className="sticker-btn" onClick={() => setShowStickers(true)}>🎭</button>
            <button type="button" className="sticker-btn" onClick={() => setShowVoice(v => !v)}>🎙</button>
            <textarea
              ref={inputRef}
              className="chat-textarea"
              placeholder={`Message ${otherUser?.displayName || "User"}`}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onFocus={() => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 300)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button type="submit" className="send-btn" disabled={!input.trim()}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 2l3 6-3 6 12-6z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {showStickers && (
        <StickerPickerModal
          onSelect={handleSticker}
          onClose={() => setShowStickers(false)}
        />
      )}
    </>
  );
}
