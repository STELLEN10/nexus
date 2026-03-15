import { useState } from "react";
import { format, isToday } from "date-fns";
import Avatar from "../shared/Avatar";

const REACTIONS = ["👍","❤️","😂","😮","😢","🔥"];

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return isToday(d) ? format(d, "HH:mm") : format(d, "MMM d, HH:mm");
}

export default function MessageBubble({ message, isOwn, isGrouped, onReply, onEdit, onDelete, onReact }) {
  const [hover, setHover] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showPicker, setShowPicker] = useState(false);

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editContent.trim() && editContent !== message.content) onEdit(editContent.trim());
    setEditing(false);
  };

  const reactionList = Object.entries(message.reactions || {}).map(([emoji, users]) => ({
    emoji, count: Object.keys(users).length,
  })).filter(r => r.count > 0);

  return (
    <div
      className={`message ${isGrouped ? "grouped" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setShowPicker(false); }}
    >
      <div className="message-left">
        {!isGrouped
          ? <Avatar user={{ username: message.senderName, avatar: message.senderAvatar }} size={32} />
          : <div className="msg-time-ghost">{hover ? formatTime(message.createdAt) : ""}</div>
        }
      </div>

      <div className="message-body">
        {!isGrouped && (
          <div className="message-meta">
            <span className="msg-author">{message.senderName}</span>
            <span className="msg-time">{formatTime(message.createdAt)}</span>
            {message.edited && <span className="msg-edited">(edited)</span>}
          </div>
        )}

        {message.replyTo && (
          <div className="reply-ref">
            <span className="reply-ref-author">{message.replyTo.senderName}</span>
            <span className="reply-ref-text">{message.replyTo.content?.substring(0, 80)}</span>
          </div>
        )}

        {message.isSticker
          ? <img src={message.stickerUrl} alt="sticker" className="dm-sticker" />
          : editing
            ? (
              <form onSubmit={handleEditSubmit}>
                <textarea className="edit-input" value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSubmit(e); } if (e.key === "Escape") setEditing(false); }}
                  autoFocus />
                <div className="edit-hint">Enter to save · Esc to cancel</div>
              </form>
            )
            : <div className="msg-content">{message.content}</div>
        }

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

      {hover && !editing && (
        <div className="msg-actions">
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
          {isOwn && (
            <>
              <button className="action-btn" onClick={() => setEditing(true)}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              </button>
              <button className="action-btn danger" onClick={onDelete}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
