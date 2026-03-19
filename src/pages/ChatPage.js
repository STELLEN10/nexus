import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useMessages, useTyping, useRooms } from "../hooks/useChat";
import { useAuth } from "../context/AuthContext";
import MessageBubble from "../components/chat/MessageBubble";
import TypingIndicator from "../components/chat/TypingIndicator";
import StickerPickerModal from "../components/dm/StickerPickerModal";
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
  const handleSend = async (e) => { e.preventDefault(); if (!input.trim()) return; const c = input.trim(); setInput(""); setReplyTo(null); stopTyping(); await sendMessage(c, replyTo); };
  const handleSticker = async (url) => { setShowStickers(false); await sendMessage(`[sticker:${url}]`, replyTo); };
  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } };
  if (!room) return <div className="page-empty"><div style={{ fontSize: 36 }}>💬</div><h2>Select a channel</h2></div>;
  return (
    <div className="chat-window">
      <div className="chat-topbar">
        <div className="chat-topbar-left"><span className="room-hash">{room.type === "private" ? "🔒" : "#"}</span><div><h2>{room.name}</h2>{room.description && <p>{room.description}</p>}</div></div>
        <span className="live-pill"><span className="live-dot" />live</span>
      </div>
      <div className="messages-area">
        {loading && [1,2,3].map(i => <div key={i} className="skeleton-msg" style={{ width: `${50+i*12}%` }} />)}
        {!loading && messages.length === 0 && <div className="messages-empty"><div className="msgs-empty-hash">#</div><h3>Start of #{room.name}</h3><p>Be the first to say something!</p></div>}
        {messages.map((msg, i) => {
          const prev = messages[i-1];
          const isGrouped = prev && prev.senderId === msg.senderId && msg.createdAt - prev.createdAt < 300000;
          const isSticker = msg.content?.startsWith("[sticker:") && msg.content?.endsWith("]");
          return <MessageBubble key={msg.id} message={{ ...msg, isSticker, stickerUrl: isSticker ? msg.content.slice(9,-1) : null }} isOwn={msg.senderId === user?.uid} isGrouped={isGrouped} onReply={() => setReplyTo(msg)} onEdit={c => editMessage(msg.id, c)} onDelete={() => deleteMessage(msg.id)} onReact={e => reactToMessage(msg.id, e)} />;
        })}
        <TypingIndicator typingUsers={typingUsers} />
        <div ref={bottomRef} />
      </div>
      {replyTo && <div className="reply-bar"><div><span className="reply-bar-label">↩ Replying to {replyTo.senderName}</span><span className="reply-bar-preview">{replyTo.content?.substring(0,80)}</span></div><button className="icon-btn" onClick={() => setReplyTo(null)}>✕</button></div>}
      {showStickers && <StickerPicker onSelect={handleSticker} onClose={() => setShowStickers(false)} />}
      <form className="input-bar" onSubmit={handleSend}>
        <div className="input-bar-inner">
          <button type="button" className="sticker-btn" onClick={() => setShowStickers(v => !v)}>🎭</button>
          <textarea ref={inputRef} className="chat-textarea" placeholder={`Message #${room.name}`} value={input} onChange={e => { setInput(e.target.value); if (e.target.value) startTyping(); else stopTyping(); e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,120)+"px"; }} onKeyDown={handleKeyDown} rows={1} />
          <button type="submit" className="send-btn" disabled={!input.trim()}><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 2l3 6-3 6 12-6z" fill="currentColor"/></svg></button>
        </div>
      </form>
    </div>
  );
}
