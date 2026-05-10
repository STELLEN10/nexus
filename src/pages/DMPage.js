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
            onClick={() => {
              setWallpaper(dmId, w.id);
              onClose();
            }}
            style={{
              padding: "10px 8px",
              background: current === w.id ? "var(--accent-bg)" : "var(--bg-2)",
              border: `1.5px solid ${current === w.id ? "var(--accent-2)" : "var(--border)"}`,
              borderRadius: "var(--r-md)",
              color: current === w.id ? "var(--accent-2)" : "var(--text-2)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "all .12s",
              boxShadow: current === w.id ? "0 0 10px var(--glow-purple)" : "none"
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
  const { messages, loading, sendMessage, sendSticker, sendVoice } = useDMMessages(dmId);
  const [text, setText] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [wallpaper, setWallpaperState] = useState(getWallpaper(dmId));
  const scrollRef = useRef();

  const otherUserId = dmId.replace(user?.uid, "").replace("-", "");
  const { online, lastSeen } = useOnlineStatus(otherUserId);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleStorage = () => setWallpaperState(getWallpaper(dmId));
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [dmId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  return (
    <div className="dm-page" style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: wallpaper.type === "color" ? wallpaper.value : `url(${wallpaper.value})`,
      backgroundSize: "cover", backgroundPosition: "center"
    }}>
      {/* Header */}
      <div className="dm-header" style={{
        padding: "12px 20px", background: "rgba(10,10,12,.8)",
        backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0
      }}>
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ marginRight: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <VibeAvatar uid={otherUserId} size={40} showStatus />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Chat
          </div>
          <div style={{ fontSize: 11, color: online ? "var(--green)" : "var(--text-3)", fontWeight: 600 }}>
            {online ? "Online now" : "Offline"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-3)" }}>Loading conversation...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👋</div>
            <div style={{ fontWeight: 700, color: "var(--text-1)" }}>Start a conversation</div>
            <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>Say hello to your friend!</div>
          </div>
        ) : (
          messages.map((m, i) => (
            <DMBubble
              key={m.id}
              message={m}
              isMe={m.senderId === user?.uid}
              showAvatar={i === 0 || messages[i-1].senderId !== m.senderId}
            />
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px 20px", background: "rgba(10,10,12,.8)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--border)" }}>
        <form onSubmit={handleSend} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg-2)", border: "1.5px solid var(--border)", borderRadius: "var(--r-xl)", padding: "4px 8px 4px 16px" }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, background: "none", border: "none", color: "var(--text-1)", fontSize: 14, padding: "8px 0", outline: "none" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ position: "relative" }}>
              <button type="button" className="icon-btn" onClick={() => setShowWallpaper(!showWallpaper)} title="Chat wallpaper">
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
            <button type="button" className="icon-btn" onClick={() => setShowStickers(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </button>
            <VoiceRecorder onStop={sendVoice} />
            <button type="submit" className="icon-btn" style={{ color: "var(--accent-2)" }} disabled={!text.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </form>
      </div>

      {showStickers && (
        <StickerPickerModal
          onSelect={sticker => {
            sendSticker(sticker);
            setShowStickers(false);
          }}
          onClose={() => setShowStickers(false)}
        />
      )}
    </div>
  );
}
