import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useMessages, useTyping } from "../hooks/useChat";
import { useAuth } from "../context/AuthContext";
import MessageBubble from "../components/chat/MessageBubble";
import TypingIndicator from "../components/chat/TypingIndicator";
import StickerPicker from "../components/dm/StickerPicker";
import { useRooms } from "../hooks/useChat";

export default function ChatPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { rooms } = useRooms();
  const room = rooms.find(r => r.id === roomId);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [showStickers, setShowStickers] = useState(false);
  const inputRef = useRef();
  const { messages, loading, sendMessage, editMessage, deleteMessage, reactToMessage, bottomRef } = useMessages(roomId);
  const { typingUsers, startTyping, stopTyping } = useTyping(roomId);

  useEffect(() => { inputRef.current?.focus(); }, [roomId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const content = input.trim();
    setInput(""); setReplyTo(null); stopTyping();
    await sendMessage(content, replyTo);
  };

  const handleSticker = async (url) => {
    setShowStickers(false);
    await sendMessage(`[sticker:${url}]`, replyTo);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  };

  if (!room) return <div className="chat-empty"><div className="chat-empty-icon">💬</div><h2>Select a channel</h2></div>;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-hash">{room.type === "private" ? "🔒" : "#"}</span>
          <div><h2>{room.name}</h2>{room.description && <p className="chat-room-desc">{room.description}</p>}</div>
        </div>
        <span className="realtime-badge"><span className="realtime-dot" />live</span>
      </div>

      <div className="messages-container">
        {loading && [1,2,3].map(i => <div key={i} className="skeleton-msg" style={{ width: `${50 + i * 12}%` }} />)}
        {!loading && messages.length === 0 && (
          <div className="messages-empty">
            <div className="messages-empty-icon">#</div>
            <h3>Start of #{room.name}</h3><p>Be the first to say something!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const isGrouped = prev && prev.senderId === msg.senderId && msg.createdAt - prev.createdAt < 5 * 60 * 1000;
          const content = msg.content;
          const isSticker = content?.startsWith("[sticker:") && content?.endsWith("]");
          return (
            <MessageBubble key={msg.id} message={{ ...msg, isSticker, stickerUrl: isSticker ? content.slice(9, -1) : null }}
              isOwn={msg.senderId === user?.uid} isGrouped={isGrouped}
              onReply={() => setReplyTo(msg)} onEdit={(c) => editMessage(msg.id, c)}
              onDelete={() => deleteMessage(msg.id)} onReact={(e) => reactToMessage(msg.id, e)} />
          );
        })}
        <TypingIndicator typingUsers={typingUsers} />
        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div className="reply-preview">
          <div className="reply-preview-inner">
            <span className="reply-preview-label">↩ Replying to {replyTo.senderName}</span>
            <span className="reply-preview-text">{replyTo.content?.substring(0, 80)}</span>
          </div>
          <button className="icon-btn" onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      {showStickers && <StickerPicker onSelect={handleSticker} onClose={() => setShowStickers(false)} />}

      <form className="chat-input-form" onSubmit={handleSend}>
        <div className="chat-input-wrapper">
          <button type="button" className="sticker-btn" onClick={() => setShowStickers(v => !v)}>🎭</button>
          <textarea ref={inputRef} className="chat-input" placeholder={`Message #${room.name}`} value={input}
            onChange={e => { setInput(e.target.value); if (e.target.value) startTyping(); else stopTyping(); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
            onKeyDown={handleKeyDown} rows={1} />
          <button type="submit" className="send-btn" disabled={!input.trim()}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 2l3 6-3 6 12-6z" fill="currentColor"/></svg>
          </button>
        </div>
      </form>
    </div>
  );
}
