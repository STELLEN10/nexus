import { useState } from "react";
import { format, isToday } from "date-fns";
import Avatar from "../shared/Avatar";

const REACTIONS = ["👍","❤️","😂","😮","😢","🔥"];

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return isToday(d) ? format(d, "HH:mm") : format(d, "MMM d HH:mm");
}

export default function DMBubble({ message, isOwn, isGrouped, onReply, onReact }) {
  const [hover, setHover] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const isSticker = message.type === "sticker" || (message.content?.startsWith("http") && (message.content?.includes("giphy") || message.content?.includes("firebasestorage")));
  const readByOther = message.readBy && Object.keys(message.readBy).filter(uid => uid !== message.senderId).length > 0;

  const reactionList = Object.entries(message.reactions || {}).map(([emoji, users]) => ({
    emoji, count: Object.keys(users).length,
  })).filter(r => r.count > 0);

  return (
    <div
      className={`dm-bubble-wrap ${isOwn ? "own" : ""} ${isGrouped ? "grouped" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setShowPicker(false); }}
    >
      {!isOwn && !isGrouped && <Avatar user={{ username: message.senderName, avatar: message.senderAvatar }} size={28} />}
      {!isOwn && isGrouped && <div style={{ width: 28, flexShrink: 0 }} />}

      <div className="dm-bubble-body">
        {!isGrouped && (
          <div className="dm-bubble-meta">
            {!isOwn && <span className="dm-bubble-author">{message.senderName}</span>}
            <span className="dm-bubble-time">{formatTime(message.createdAt)}</span>
          </div>
        )}

        {message.replyTo && (
          <div className="dm-reply-ref">
            <span className="reply-ref-author">{message.replyTo.senderName}</span>
            <span className="reply-ref-text">{message.replyTo.type === "sticker" ? "🎭 Sticker" : message.replyTo.content?.substring(0, 60)}</span>
          </div>
        )}

        <div className={`dm-bubble ${isOwn ? "own" : ""}`}>
          {isSticker
            ? <img src={message.content} alt="sticker" className="dm-sticker" />
            : <span className="dm-text">{message.content}</span>
          }
        </div>

        {/* Read receipt */}
        {isOwn && (
          <div className="read-receipt">
            {readByOther ? <span className="read-seen">✓✓ Seen</span> : <span className="read-sent">✓ Sent</span>}
          </div>
        )}

        {reactionList.length > 0 && (
          <div className="reactions-row">
            {reactionList.map(r => (
              <button key={r.emoji} className="reaction-pill" onClick={() => onReact(r.emoji)}>
                {r.emoji} <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {hover && (
        <div className={`dm-actions ${isOwn ? "own" : ""}`}>
          <div className="picker-wrap">
            <button className="action-btn" onClick={() => setShowPicker(v => !v)}>😊</button>
            {showPicker && (
              <div className="emoji-picker">
                {REACTIONS.map(e => <button key={e} className="emoji-opt" onClick={() => { onReact(e); setShowPicker(false); }}>{e}</button>)}
              </div>
            )}
          </div>
          <button className="action-btn" onClick={onReply}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M1 6l5-4v3c5 0 9 3 9 9-2-4-4-5-9-5v3L1 6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
