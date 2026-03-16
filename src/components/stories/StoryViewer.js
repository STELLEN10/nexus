import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { formatDistanceToNow } from "date-fns";

const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewer({ stories, authorName, onClose, onMarkSeen }) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedRef = useRef(0);

  const currentStory = stories[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(i => i + 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setProgress(0);
      elapsedRef.current = 0;
    }
  };

  // Mark as seen
  useEffect(() => {
    if (currentStory && !currentStory.seenBy?.includes(user?.uid)) {
      onMarkSeen(currentStory.id);
    }
  }, [currentIndex, currentStory]);

  // Progress timer
  useEffect(() => {
    if (paused) { clearInterval(intervalRef.current); return; }

    startTimeRef.current = Date.now() - elapsedRef.current;
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (elapsed >= STORY_DURATION) {
        clearInterval(intervalRef.current);
        goNext();
      }
    }, 50);

    return () => clearInterval(intervalRef.current);
  }, [currentIndex, paused, goNext]);

  // Pause on hold
  const handleMouseDown = () => {
    elapsedRef.current = Date.now() - startTimeRef.current;
    setPaused(true);
  };
  const handleMouseUp = () => setPaused(false);

  const seenCount = (currentStory?.seenBy?.length || 1) - 1;
  const timeAgo = (ts) => {
    try { return formatDistanceToNow(ts?.toDate ? ts.toDate() : new Date(ts), { addSuffix: true }); }
    catch { return ""; }
  };

  if (!currentStory) return null;

  return (
    <div className="story-viewer-overlay" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onTouchStart={handleMouseDown} onTouchEnd={handleMouseUp}>
      {/* Progress bars */}
      <div className="story-progress-bars">
        {stories.map((_, i) => (
          <div key={i} className="story-progress-track">
            <div
              className="story-progress-fill"
              style={{ width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="story-header">
        <div className="story-author-info">
          <div className="story-author-avatar">
            {currentStory.authorAvatar
              ? <img src={currentStory.authorAvatar} alt={authorName} />
              : <div className="story-author-initial">{authorName?.[0]?.toUpperCase()}</div>
            }
          </div>
          <div>
            <span className="story-author-name">{authorName}</span>
            <span className="story-author-time">{timeAgo(currentStory.createdAt)}</span>
          </div>
        </div>
        <button className="story-close-btn" onClick={(e) => { e.stopPropagation(); onClose(); }}>✕</button>
      </div>

      {/* Story content */}
      <div className="story-content">
        {currentStory.type === "image" && currentStory.mediaUrl ? (
          <img src={currentStory.mediaUrl} alt="story" className="story-image" draggable={false} />
        ) : (
          <div className="story-text-card" style={{ background: currentStory.bgColor || "#7c3aed" }}>
            <p className="story-text-content">{currentStory.text}</p>
          </div>
        )}
      </div>

      {/* Tap zones */}
      <button
        className="story-tap-zone left"
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
      />
      <button
        className="story-tap-zone right"
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
      />

      {/* Footer — seen by */}
      {currentStory.authorId === user?.uid && (
        <div className="story-footer">
          <span className="story-seen-count">👁 {seenCount} {seenCount === 1 ? "view" : "views"}</span>
        </div>
      )}

      {paused && <div className="story-paused-badge">⏸ Hold</div>}
    </div>
  );
}
