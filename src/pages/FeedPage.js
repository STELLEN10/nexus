import { useAuth } from "../context/AuthContext";
import { useFollowingList } from "../hooks/useFollow";
import { usePersonalisedFeed, useFeed } from "../hooks/useFeed";
import { useStories } from "../hooks/useStories";
import { useNavigate } from "react-router-dom";
import PostCard from "../components/social/PostCard";
import CreatePost from "../components/social/CreatePost";
import StoriesBar from "../components/stories/StoriesBar";

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { following } = useFollowingList(user?.uid);
  const { posts, loading } = usePersonalisedFeed(following);
  const { createPost, likePost, reactPost, deletePost } = useFeed();
  const { stories, loading: storiesLoading, createStory, markSeen } = useStories(following);

  return (
    <div className="page-scroll">
      <div className="feed-wrap">
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
          ? [1,2,3].map(i => <div key={i} className="skeleton-card" />)
          : posts.length === 0
            ? (
              <div className="empty-state">
                <div className="empty-icon">👀</div>
                <h2>Nothing here yet</h2>
                <p>Follow people to see their posts</p>
                <button className="btn-primary" onClick={() => navigate("/explore")}>Find people</button>
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
    </div>
  );
}
