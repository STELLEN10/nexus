import { useState } from "react";
import { format, isToday } from "date-fns";
import VibeAvatar from "../vibe/VibeAvatar";
import VoiceMessage from "./VoiceMessage";
const REACTIONS = ["👍","❤️","😂","😮","😢","🔥"];
const fmt = (ts) => { try { const d = new Date(ts); return isToday(d) ? format(d, "HH:mm") : format(d, "MMM d HH:mm"); } catch { return ""; } };
export default function DMBubble({ message, isOwn, isGrouped, onReply, onReact, showName }) {
  const [hover, setHover] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const isSticker = message.type === "sticker" || (message.content?.startsWith("http") && (message.content?.includes("giphy") || message.content?.includes("firebasestorage")));
  const isVoice = message.type === "voice";
  const readByOther = message.readBy && Object.keys(message.readBy).filter(u => u !== message.senderId).length > 0;
  const reactionList = Object.entries(message.reactions || {}).map(([e, u]) => ({ emoji: e, count: Object.keys(u).length })).filter(r => r.count > 0);
  return (
    <div className={`dm-row ${isOwn ? "own" : ""} ${isGrouped ? "grouped" : ""}`} onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setShowPicker(false); }}>
      {!isOwn && (!isGrouped ? <VibeAvatar user={{ username: message.senderName, avatar: message.senderAvatar }} uid={message.senderId} size={28} showVibe={true} /> : <div style={{ width: 28, flexShrink: 0 }} />)}
      <div className="dm-bubble-col">
        {(showName || (!isGrouped && !isOwn)) && <div className="dm-meta"><span className="dm-name">{message.senderName}</span><span className="dm-ts">{fmt(message.createdAt)}</span></div>}
        {message.replyTo && <div className="dm-reply-ref"><span>{message.replyTo.senderName}</span><span>{message.replyTo.type === "sticker" ? "🎭 Sticker" : message.replyTo.type === "voice" ? "🎙 Voice" : message.replyTo.content?.substring(0, 60)}</span></div>}
        <div className={`dm-bubble ${isOwn ? "own" : ""}`}>
          {isVoice ? <VoiceMessage url={message.content} isOwn={isOwn} />
            : isSticker ? <img src={message.content} alt="sticker" className="msg-sticker" />
            : <span className="dm-txt">{message.content}</span>}
        </div>
        {isOwn && !isVoice && <div className="dm-receipt">{readByOther ? <span className="seen">✓✓ Seen</span> : <span className="sent">✓ Sent</span>}</div>}
        {reactionList.length > 0 && <div className="msg-reactions">{reactionList.map(r => <button key={r.emoji} className="rxn-pill" onClick={() => onReact(r.emoji)}>{r.emoji} <span>{r.count}</span></button>)}</div>}
      </div>
      {hover && (
        <div className={`dm-actions ${isOwn ? "own" : ""}`}>
          <div className="rxn-wrap"><button className="act-btn" onClick={() => setShowPicker(v => !v)}>😊</button>{showPicker && <div className="rxn-picker">{REACTIONS.map(e => <button key={e} className="rxn-opt" onClick={() => { onReact(e); setShowPicker(false); }}>{e}</button>)}</div>}</div>
          <button className="act-btn" onClick={onReply}><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M1 6l5-4v3c5 0 9 3 9 9-2-4-4-5-9-5v3L1 6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg></button>
        </div>
      )}
    </div>
  );
}
