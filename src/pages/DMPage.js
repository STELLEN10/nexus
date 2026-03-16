import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDMMessages } from "../hooks/useDMs";
import { useOnlineStatus } from "../hooks/useUsers";
import VibeAvatar from "../components/vibe/VibeAvatar";
import DMBubble from "../components/dm/DMBubble";
import StickerPicker from "../components/dm/StickerPicker";
import VoiceRecorder from "../components/dm/VoiceRecorder";

export default function DMPage() {
  const { dmId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [showStickers, setShowStickers] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const inputRef = useRef();
  const bottomRef = useRef();
  const { messages, loading, sendDM, reactToDM } = useDMMessages(dmId);
  const otherMsg = messages.find(m => m.senderId !== user?.uid);
  const otherName = otherMsg?.senderName || "User";
  const online = useOnlineStatus(otherMsg?.senderId);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);
  useEffect(() => { inputRef.current?.focus(); }, [dmId]);
  const handleSend = async (e) => { e.preventDefault(); if (!input.trim()) return; const c = input.trim(); setInput(""); setReplyTo(null); await sendDM(c, "text", replyTo); };
  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } };
  const handleSticker = async (url) => { setShowStickers(false); await sendDM(url, "sticker"); };
  const handleVoice = async (url) => { setShowVoice(false); await sendDM(url, "voice"); };
  return (
    <div className="chat-window">
      <div className="chat-topbar">
        <button className="icon-btn" onClick={() => navigate(-1)}><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        <VibeAvatar user={{ username: otherName }} uid={otherMsg?.senderId} size={32} online={online} showVibe={true} />
        <div><span className="dm-topbar-name">{otherName}</span><span className={`dm-topbar-status ${online ? "on" : ""}`}>{online ? "● online" : "offline"}</span></div>
      </div>
      <div className="messages-area">
        {loading && [1,2,3].map(i => <div key={i} className="skeleton-msg" style={{ width: `${50+i*12}%` }} />)}
        {!loading && messages.length === 0 && <div className="messages-empty"><div style={{ fontSize: 32 }}>💬</div><p>Start a conversation with {otherName}</p></div>}
        {messages.map((msg, i) => {
          const prev = messages[i-1];
          return <DMBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.uid} isGrouped={prev && prev.senderId === msg.senderId && msg.createdAt - prev.createdAt < 300000} onReply={() => setReplyTo(msg)} onReact={e => reactToDM(msg.id, e)} />;
        })}
        <div ref={bottomRef} />
      </div>
      {replyTo && <div className="reply-bar"><div><span className="reply-bar-label">↩ Replying to {replyTo.senderName}</span><span className="reply-bar-preview">{replyTo.type === "sticker" ? "🎭 Sticker" : replyTo.type === "voice" ? "🎙 Voice" : replyTo.content?.substring(0,80)}</span></div><button className="icon-btn" onClick={() => setReplyTo(null)}>✕</button></div>}
      {showStickers && <StickerPicker onSelect={handleSticker} onClose={() => setShowStickers(false)} />}
      {showVoice && <VoiceRecorder onSend={handleVoice} onClose={() => setShowVoice(false)} />}
      <form className="input-bar" onSubmit={handleSend}>
        <div className="input-bar-inner">
          <button type="button" className="sticker-btn" onClick={() => setShowStickers(v => !v)}>🎭</button>
          <button type="button" className="sticker-btn" onClick={() => setShowVoice(v => !v)}>🎙</button>
          <textarea ref={inputRef} className="chat-textarea" placeholder={`Message ${otherName}`} value={input} onChange={e => { setInput(e.target.value); e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,120)+"px"; }} onKeyDown={handleKeyDown} rows={1} />
          <button type="submit" className="send-btn" disabled={!input.trim()}><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 2l3 6-3 6 12-6z" fill="currentColor"/></svg></button>
        </div>
      </form>
    </div>
  );
}
