import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useFollowingList, useFollow } from "../hooks/useFollow";
import { usePersonalisedFeed, useFeed } from "../hooks/useFeed";
import { useStories } from "../hooks/useStories";
import { useSuggestedPeople } from "../hooks/useSuggestedPeople";
import { useNavigate } from "react-router-dom";
import PostCard from "../components/social/PostCard";
import CreatePost from "../components/social/CreatePost";
import StoriesBar from "../components/stories/StoriesBar";
import Avatar from "../components/shared/Avatar";

function SuggestedPerson({ person, onNavigate }) {
  const { follow, unfollow, isFollowing } = useFollow(person.id);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 0", borderBottom: "1px solid var(--border)"
    }}>
      <div
        style={{ cursor: "pointer", flexShrink: 0 }}
        onClick={() => onNavigate(`/u/${person.username}`)}
      >
        <Avatar user={person} size={38} />
      </div>
      <div
        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
        onClick={() => onNavigate(`/u/${person.username}`)}
      >
        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {person.displayName}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>@{person.username}</div>
      </div>
      <button
        onClick={() => isFollowing ? unfollow() : follow(person)}
        style={{
          background: isFollowing ? "transparent" : "linear-gradient(135deg, var(--accent), var(--accent-2))",
          border: isFollowing ? "1.5px solid var(--border-2)" : "none",
          borderRadius: "var(--r-md)",
          padding: "5px 12px",
          color: isFollowing ? "var(--text-2)" : "#fff",
          fontFamily: "var(--font)",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          flexShrink: 0,
          transition: "all .15s",
          boxShadow: isFollowing ? "none" : "0 0 10px var(--glow-purple)",
        }}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
}

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { following } = useFollowingList(user?.uid);
  const { posts, loading } = usePersonalisedFeed(following);
  const { createPost, likePost, reactPost, deletePost } = useFeed();
  const { stories, loading: storiesLoading, createStory, markSeen } = useStories(following);
  const { suggested, loading: suggestedLoading } = useSuggestedPeople(following);

  return (
    <div className="page-scroll">
      <div style={{ display: "flex", maxWidth: 900, margin: "0 auto", padding: "24px 20px 48px", gap: 24 }}>

        {/* ── Main feed column ── */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <StoriesBar
            stories={stories}
            loading={storiesLoading}
            onCreateStory={createStory}
            onMarkSeen={markSeen}
          />

          <div className="feed-divider" />

          <div className="feed-header">
            <h1>Home</h1>
            <span>Posts from people you follow</span>
          </div>

          <CreatePost wallOwner={user?.uid} onPost={createPost} />

          {loading
            ? [1, 2, 3].map(i => <div key={i} className="skeleton-card" />)
            : posts.length === 0
              ? (
                <div className="empty-state">
                  <div className="empty-icon">👀</div>
                  <h2>Nothing here yet</h2>
                  <p>Follow people to see their posts</p>
                </div>
              )
              : posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={user}
                    onLike={() => likePost(post.id, post.likes?.includes(user?.uid))}
                    onReact={(emoji) => reactPost(post.id, emoji, post)}
                    onDelete={post.authorId === user?.uid ? () => deletePost(post.id) : null}
                    onAuthorClick={() => navigate(`/u/${post.authorName}`)}
                  />
                ))
          }
        </div>

        {/* ── Suggested people sidebar (desktop only) ── */}
        <div style={{
          width: 260, flexShrink: 0,
          display: "none",
          // shown via media query below — we inline a style tag
        }} className="feed-suggestions-panel">
          <div style={{
            background: "var(--bg-1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-xl)",
            padding: "16px 18px",
            position: "sticky",
            top: 24,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: ".08em",
              textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4
            }}>
              Suggested for you
            </div>

            {suggestedLoading && (
              <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                <div className="spinner" />
              </div>
            )}

            {!suggestedLoading && suggested.length === 0 && (
              <div style={{ fontSize: 13, color: "var(--text-3)", padding: "12px 0" }}>
                No suggestions right now
              </div>
            )}

            {suggested.map(person => (
              <SuggestedPerson
                key={person.id}
                person={person}
                onNavigate={navigate}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Show suggestions panel on wide screens */}
      <style>{`
        @media (min-width: 900px) {
          .feed-suggestions-panel { display: block !important; }
        }
      `}</style>
    </div>
  );
}
