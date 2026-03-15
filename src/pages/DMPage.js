import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDMMessages } from "../hooks/useDMs";
import { useOnlineStatus } from "../hooks/useUsers";
import Avatar from "../components/shared/Avatar";
import DMBubble from "../components/dm/DMBubble";
import StickerPicker from "../components/dm/StickerPicker";

export default function DMPage() {
  const { dmId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [showStickers, setShowStickers] = useState(false);
  const inputRef = useRef();
  const bottomRef = useRef();

  const { messages, loading, sendDM, reactToDM } = useDMMessages(dmId);

  // Get other user info from DM members
  const otherMsg = messages.find(m => m.senderId !== user?.uid);
  const otherName = otherMsg?.senderName || "User";
  const online = useOnlineStatus(otherMsg?.senderId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => { inputRef.current?.focus(); }, [dmId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const content = input.trim();
    setInput(""); setReplyTo(null);
    await sendDM(content, "text", replyTo);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  };

  const handleSticker = async (url) => {
    setShowStickers(false);
    await sendDM(url, "sticker");
  };

  return (
    <div className="dm-page">
      <div className="dm-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="dm-header-user">
          <Avatar user={{ username: otherName }} size={32} online={online} />
          <div>
            <span className="dm-header-name">{otherName}</span>
            <span className="dm-header-status">{online ? "● online" : "offline"}</span>
          </div>
        </div>
      </div>

      <div className="dm-messages">
        {loading && [1,2,3].map(i => <div key={i} className="skeleton-msg" style={{ width: `${50 + i * 12}%` }} />)}
        {!loading && messages.length === 0 && (
          <div className="dm-empty">
            <div className="dm-empty-icon">💬</div>
            <p>Start a conversation with {otherName}</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.senderId === user?.uid;
          const prev = messages[i - 1];
          const isGrouped = prev && prev.senderId === msg.senderId && msg.createdAt - prev.createdAt < 5 * 60 * 1000;
          return (
            <DMBubble
              key={msg.id}
              message={msg}
              isOwn={isOwn}
              isGrouped={isGrouped}
              onReply={() => setReplyTo(msg)}
              onReact={(emoji) => reactToDM(msg.id, emoji)}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div className="reply-preview">
          <div className="reply-preview-inner">
            <span className="reply-preview-label">↩ Replying to {replyTo.senderName}</span>
            <span className="reply-preview-text">{replyTo.type === "sticker" ? "🎭 Sticker" : replyTo.content?.substring(0, 80)}</span>
          </div>
          <button className="icon-btn" onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      {showStickers && <StickerPicker onSelect={handleSticker} onClose={() => setShowStickers(false)} />}

      <form className="dm-input-form" onSubmit={handleSend}>
        <div className="dm-input-wrapper">
          <button type="button" className="sticker-btn" onClick={() => setShowStickers(v => !v)} title="Stickers & Memes">
            🎭
          </button>
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder={`Message ${otherName}`}
            value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button type="submit" className="send-btn" disabled={!input.trim()}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 2l3 6-3 6 12-6z" fill="currentColor"/></svg>
          </button>
        </div>
      </form>
    </div>
  );
}
