import { useState } from "react";
import { format } from "date-fns";
import { useComments } from "../../hooks/useFeed";
import Avatar from "../shared/Avatar";
const POST_REACTIONS = ["❤️","😂","🔥","😮","👏","😢"];
function ReactionBar({ reactions, currentUid, onReact }) {
  const [show, setShow] = useState(false);
  const userReaction = reactions?.[currentUid];
  const counts = {};
  Object.values(reactions || {}).forEach(e => { if (e) counts[e] = (counts[e] || 0) + 1; });
  return (
    <div className="post-rxn-bar">
      <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} style={{ position: "relative" }}>
        <button className={`post-rxn-trigger ${userReaction ? "active" : ""}`}>{userReaction || "❤️"} <span>{userReaction ? "Reacted" : "React"}</span></button>
        {show && <div className="post-rxn-picker">{POST_REACTIONS.map(e => <button key={e} className={`post-rxn-opt ${userReaction === e ? "selected" : ""}`} onClick={() => onReact(e)}>{e}</button>)}</div>}
      </div>
      {Object.entries(counts).map(([emoji, count]) => <button key={emoji} className="rxn-count-pill" onClick={() => onReact(emoji)}>{emoji} {count}</button>)}
    </div>
  );
}
export default function PostCard({ post, currentUser, onLike, onReact, onDelete, onAuthorClick }) {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const { comments, addComment, deleteComment } = useComments(showComments ? post.id : null);
  const liked = post.likes?.includes(currentUser?.uid);
  const ts = post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt || Date.now());
  const handleComment = async (e) => { e.preventDefault(); if (!commentInput.trim()) return; await addComment(commentInput.trim()); setCommentInput(""); };
  return (
    <div className="post-card">
      <div className="post-head">
        <div className="post-author" onClick={onAuthorClick} style={{ cursor: onAuthorClick ? "pointer" : "default" }}>
          <Avatar user={{ username: post.authorName, avatar: post.authorAvatar }} size={38} />
          <div><span className="post-author-name">{post.authorName}</span><span className="post-ts">{format(ts, "MMM d 'at' HH:mm")}</span></div>
        </div>
        {onDelete && <button className="post-del-btn" onClick={onDelete}><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>}
      </div>
      {post.content && <p className="post-body">{post.content}</p>}
      {post.imageUrl && <img src={post.imageUrl} alt="post" className="post-img" />}
      <ReactionBar reactions={post.reactions} currentUid={currentUser?.uid} onReact={onReact} />
      <div className="post-actions">
        <button className={`post-act-btn ${liked ? "liked" : ""}`} onClick={onLike}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill={liked ? "currentColor" : "none"}><path d="M8 14s-6-3.5-6-8a4 4 0 018 0 4 4 0 018 0c0 4.5-6 8-6 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {post.likes?.length || 0}
        </button>
        <button className="post-act-btn" onClick={() => setShowComments(v => !v)}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M14 9a2 2 0 01-2 2H5l-3 3V4a2 2 0 012-2h8a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {post.commentCount || 0}
        </button>
        <button className="post-act-btn" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/u/${post.authorName}`)}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M10 3h3v3M9 7l4-4M7 6H4a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Share
        </button>
      </div>
      {showComments && (
        <div className="post-comments">
          {comments.map(c => (
            <div key={c.id} className="comment-row">
              <Avatar user={{ username: c.authorName, avatar: c.authorAvatar }} size={24} />
              <div className="comment-bubble"><span className="comment-name">{c.authorName}</span><span className="comment-txt">{c.content}</span></div>
              {c.authorId === currentUser?.uid && <button className="comment-del" onClick={() => deleteComment(c.id)}>✕</button>}
            </div>
          ))}
          <form className="comment-form" onSubmit={handleComment}>
            <input placeholder="Write a comment…" value={commentInput} onChange={e => setCommentInput(e.target.value)} />
            <button type="submit" className="btn-primary-sm" disabled={!commentInput.trim()}>Post</button>
          </form>
        </div>
      )}
    </div>
  );
}
