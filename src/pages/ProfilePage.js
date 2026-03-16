import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../hooks/useUsers";
import { useFeed } from "../hooks/useFeed";
import { useDMRequests } from "../hooks/useDMs";
import { useFollow, useFollowCounts } from "../hooks/useFollow";
import Avatar from "../components/shared/Avatar";
import PostCard from "../components/social/PostCard";
import CreatePost from "../components/social/CreatePost";

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, profile: myProfile, updateUserProfile } = useAuth();
  const [targetUid, setTargetUid] = useState(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [dmStatus, setDmStatus] = useState(null);
  const avatarInputRef = useRef();
  const { sendRequest } = useDMRequests();

  useEffect(() => {
    if (!username) return;
    getDocs(query(collection(db, "users"), where("username", "==", username.toLowerCase())))
      .then(snap => { if (!snap.empty) setTargetUid(snap.docs[0].id); });
  }, [username]);

  const uid = targetUid || user?.uid;
  const isOwnProfile = uid === user?.uid;
  const { profile, online, loading } = useUserProfile(uid);
  const { posts, loading: postsLoading, createPost, likePost, reactPost, deletePost } = useFeed(uid);
  const { isFollowing, follow, unfollow } = useFollow(isOwnProfile ? null : uid);
  const counts = useFollowCounts(uid);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    const snap = await uploadBytes(storageRef(storage, `avatars/${user.uid}`), file);
    const url = await getDownloadURL(snap.ref);
    await updateUserProfile({ avatar: url });
    setUploadingAvatar(false);
  };

  const handleSendDM = async () => {
    if (!profile) return;
    const result = await sendRequest(profile);
    if (result.exists) navigate(`/dm/${result.id}`);
    else setDmStatus(result.sent ? "sent" : "pending");
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!profile) return <div className="page-empty">User not found</div>;

  return (
    <div className="page-scroll">
      <div className="profile-card">
        <div className="profile-cover" />
        <div className="profile-card-body">
          <div className="profile-avatar-row">
            <div style={{ position: "relative" }}>
              <Avatar user={profile} size={80} online={online} />
              {isOwnProfile && (
                <>
                  <button className="avatar-edit-btn" onClick={() => avatarInputRef.current.click()} disabled={uploadingAvatar}>{uploadingAvatar ? "…" : "✎"}</button>
                  <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                </>
              )}
            </div>
            {!isOwnProfile && (
              <div className="profile-cta-row">
                <button className={`btn-follow ${isFollowing ? "following" : ""}`} onClick={() => isFollowing ? unfollow() : follow(profile)}>
                  {isFollowing ? "✓ Following" : "+ Follow"}
                </button>
                <button className="btn-msg" onClick={handleSendDM}>
                  {dmStatus === "sent" ? "✓ Sent" : "💬 Message"}
                </button>
              </div>
            )}
          </div>

          <div className="profile-meta">
            <h1 className="profile-display">{profile.displayName}</h1>
            <span className="profile-handle">@{profile.username}</span>
            {online && <span className="profile-online">● online</span>}
          </div>

          <div className="profile-counts">
            <div className="profile-count"><strong>{counts.followers}</strong><span>followers</span></div>
            <div className="profile-count"><strong>{counts.following}</strong><span>following</span></div>
            <div className="profile-count"><strong>{posts.length}</strong><span>posts</span></div>
          </div>

          {editingBio ? (
            <div className="bio-edit">
              <textarea className="bio-textarea" value={bio} onChange={e => setBio(e.target.value)} placeholder="Write something about yourself…" maxLength={160} autoFocus />
              <div className="bio-edit-actions">
                <button className="btn-ghost-sm" onClick={() => setEditingBio(false)}>Cancel</button>
                <button className="btn-primary-sm" onClick={async () => { await updateUserProfile({ bio }); setEditingBio(false); }}>Save</button>
              </div>
            </div>
          ) : (
            <p className="profile-bio" onClick={() => { if (isOwnProfile) { setBio(profile.bio || ""); setEditingBio(true); } }}>
              {profile.bio || (isOwnProfile ? <span className="bio-placeholder">+ Add a bio</span> : "")}
            </p>
          )}

          <div className="profile-link-row">
            <span className="profile-link">nexus.app/u/{profile.username}</span>
            <button className="btn-copy" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username}`)}>Copy</button>
          </div>
        </div>
      </div>

      <div className="feed-wrap" style={{ marginTop: 16 }}>
        <CreatePost wallOwner={uid} onPost={createPost} />
        {postsLoading ? [1,2].map(i => <div key={i} className="skeleton-card" />) : posts.length === 0
          ? <div className="empty-state"><p>No posts yet</p></div>
          : posts.map(post => (
            <PostCard key={post.id} post={post} currentUser={user}
              onLike={() => likePost(post.id, post.likes?.includes(user?.uid))}
              onReact={(emoji) => reactPost(post.id, emoji, post)}
              onDelete={post.authorId === user?.uid ? () => deletePost(post.id) : null}
              onAuthorClick={() => navigate(`/u/${post.authorName}`)} />
          ))
        }
      </div>
    </div>
  );
}
