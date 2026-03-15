import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { useComments } from "../../hooks/useFeed";
import Avatar from "../shared/Avatar";

export function PostCard({ post, currentUser, onLike, onDelete }) {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const { comments, addComment, deleteComment } = useComments(showComments ? post.id : null);
  const liked = post.likes?.includes(currentUser?.uid);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    await addComment(commentInput.trim());
    setCommentInput("");
  };

  const ts = post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt || Date.now());

  return (
    <div className="post-card">
      <div className="post-header">
        <Avatar user={{ username: post.authorName, avatar: post.authorAvatar }} size={36} />
        <div className="post-author-info">
          <span className="post-author-name">{post.authorName}</span>
          <span className="post-time">{format(ts, "MMM d 'at' HH:mm")}</span>
        </div>
        {onDelete && (
          <button className="icon-btn post-delete" onClick={onDelete} title="Delete post">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        )}
      </div>

      {post.content && <p className="post-content">{post.content}</p>}
      {post.imageUrl && <img src={post.imageUrl} alt="post" className="post-image" />}

      <div className="post-actions">
        <button className={`post-action-btn ${liked ? "liked" : ""}`} onClick={onLike}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill={liked ? "currentColor" : "none"}><path d="M8 14s-6-3.5-6-8a4 4 0 018 0 4 4 0 018 0c0 4.5-6 8-6 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>{post.likes?.length || 0}</span>
        </button>
        <button className="post-action-btn" onClick={() => setShowComments(v => !v)}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M14 9a2 2 0 01-2 2H5l-3 3V4a2 2 0 012-2h8a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>{post.commentCount || 0}</span>
        </button>
        <button className="post-action-btn" onClick={() => navigator.clipboard.writeText(window.location.href)}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M10 3h3v3M9 7l4-4M7 6H4a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Share
        </button>
      </div>

      {showComments && (
        <div className="post-comments">
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <Avatar user={{ username: c.authorName, avatar: c.authorAvatar }} size={24} />
              <div className="comment-body">
                <span className="comment-author">{c.authorName}</span>
                <span className="comment-text">{c.content}</span>
              </div>
              {c.authorId === currentUser?.uid && (
                <button className="icon-btn" style={{ opacity: .5, fontSize: 11 }} onClick={() => deleteComment(c.id)}>✕</button>
              )}
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

export default PostCard;
