import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../hooks/useUsers";
import { useFeed } from "../hooks/useFeed";
import { useDMRequests } from "../hooks/useDMs";
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

  // Resolve username → uid
  useEffect(() => {
    if (!username) return;
    getDocs(query(collection(db, "users"), where("username", "==", username.toLowerCase())))
      .then(snap => { if (!snap.empty) setTargetUid(snap.docs[0].id); });
  }, [username]);

  const uid = targetUid || user?.uid;
  const isOwnProfile = uid === user?.uid;
  const { profile, online, loading } = useUserProfile(uid);
  const { posts, loading: postsLoading, createPost, likePost, deletePost } = useFeed(uid);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    const sRef = storageRef(storage, `avatars/${user.uid}`);
    const snap = await uploadBytes(sRef, file);
    const url = await getDownloadURL(snap.ref);
    await updateUserProfile({ avatar: url });
    setUploadingAvatar(false);
  };

  const handleSaveBio = async () => {
    await updateUserProfile({ bio });
    setEditingBio(false);
  };

  const handleSendDM = async () => {
    if (!profile) return;
    const result = await sendRequest(profile);
    if (result.exists) navigate(`/dm/${result.id}`);
    else if (result.sent) setDmStatus("sent");
    else if (result.pending) setDmStatus("pending");
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!profile) return <div className="page-empty">User not found</div>;

  return (
    <div className="profile-page">
      <div className="profile-header-card">
        <div className="profile-cover" />
        <div className="profile-header-content">
          <div className="profile-avatar-wrap">
            <Avatar user={profile} size={80} online={online} />
            {isOwnProfile && (
              <>
                <button className="avatar-edit-btn" onClick={() => avatarInputRef.current.click()} disabled={uploadingAvatar}>
                  {uploadingAvatar ? "…" : "✎"}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
              </>
            )}
          </div>
          <div className="profile-info">
            <div className="profile-names">
              <h1>{profile.displayName}</h1>
              <span className="profile-username">@{profile.username}</span>
              {online && <span className="online-badge">● online</span>}
            </div>
            {editingBio ? (
              <div className="bio-edit">
                <textarea className="bio-input" value={bio} onChange={e => setBio(e.target.value)} placeholder="Write something about yourself…" maxLength={160} autoFocus />
                <div className="bio-edit-actions">
                  <button className="btn-ghost-sm" onClick={() => setEditingBio(false)}>Cancel</button>
                  <button className="btn-primary-sm" onClick={handleSaveBio}>Save</button>
                </div>
              </div>
            ) : (
              <p className="profile-bio" onClick={() => { if (isOwnProfile) { setBio(profile.bio || ""); setEditingBio(true); } }}>
                {profile.bio || (isOwnProfile ? <span className="bio-placeholder">+ Add a bio</span> : "")}
              </p>
            )}
            <div className="profile-share">
              <span className="profile-link">nexus.app/u/{profile.username}</span>
              <button className="btn-copy" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username}`)}>Copy link</button>
            </div>
          </div>
          {!isOwnProfile && (
            <div className="profile-actions">
              <button className="btn-dm" onClick={handleSendDM}>
                {dmStatus === "sent" ? "✓ Request sent" : dmStatus === "pending" ? "Request pending" : "💬 Message"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-feed">
        <div className="feed-header">
          <h2>{isOwnProfile ? "Your wall" : `${profile.displayName}'s wall`}</h2>
        </div>
        {(isOwnProfile || true) && (
          <CreatePost wallOwner={uid} onPost={createPost} />
        )}
        {postsLoading
          ? [1,2].map(i => <div key={i} className="skeleton-post" />)
          : posts.length === 0
            ? <div className="feed-empty">No posts yet</div>
            : posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onLike={() => likePost(post.id, post.likes?.includes(user?.uid))}
                  onDelete={post.authorId === user?.uid ? () => deletePost(post.id) : null}
                />
              ))
        }
      </div>
    </div>
  );
}
