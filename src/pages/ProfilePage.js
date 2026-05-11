import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, deleteDoc, setDoc, getDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../hooks/useUsers";
import { useFeed } from "../hooks/useFeed";
import { useDMRequests } from "../hooks/useDMs";
import { useFollow, useFollowCounts } from "../hooks/useFollow";
import { useBadges, awardBadge, BADGES } from "../hooks/useBadges";
import Avatar from "../components/shared/Avatar";
import BadgeDisplay from "../components/shared/BadgeDisplay";
import TipModal from "../components/shared/TipModal";
import PostCard from "../components/social/PostCard";
import CreatePost from "../components/social/CreatePost";
import SettingsModal from "../components/settings/SettingsModal";
import CoinWallet from "../components/shared/CoinWallet";

// ── Followers / Following modal ────────────────────────────
function FollowListModal({ uid, mode, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const filterField = mode === "followers" ? "followingId" : "followerId";
    const targetField = mode === "followers" ? "followerId"  : "followingId";
    getDocs(query(collection(db, "follows"), where(filterField, "==", uid)))
      .then(async snap => {
        const ids = snap.docs.map(d => d.data()[targetField]);
        if (!ids.length) { setUsers([]); setLoading(false); return; }
        const profiles = await Promise.all(ids.map(id => getDoc(doc(db, "users", id))));
        setUsers(profiles.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() })));
        setLoading(false);
      });
  }, [uid, mode]);

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="follow-list-modal">
        <div className="follow-list-header">
          <h3>{mode === "followers" ? "Followers" : "Following"}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="follow-list-body">
          {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
              <div className="spinner" />
            </div>
          )}
          {!loading && users.length === 0 && (
            <div className="follow-list-empty">
              {mode === "followers" ? "No followers yet" : "Not following anyone yet"}
            </div>
          )}
          {users.map(u => (
            <div
              key={u.id}
              className="follow-list-row"
              onClick={() => { navigate(`/u/${u.username}`); onClose(); }}
            >
              <Avatar user={u} size={40} tappable={true} />
              <div className="follow-list-info">
                <span className="follow-list-name">{u.displayName}</span>
                <span className="follow-list-handle">@{u.username}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Profile page ───────────────────────────────────────────
export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, profile: myProfile, updateUserProfile } = useAuth();

  // Resolve username → uid
  const [targetUid, setTargetUid] = useState(null);
  useEffect(() => {
    if (!username) return;
    setTargetUid(null);
    getDocs(query(collection(db, "users"), where("username", "==", username.toLowerCase())))
      .then(snap => { if (!snap.empty) setTargetUid(snap.docs[0].id); });
  }, [username]);

  const uid = targetUid || user?.uid;
  const isOwnProfile = uid === user?.uid;

  // Data hooks
  const { profile, online, loading } = useUserProfile(uid);
  const { posts, loading: postsLoading, createPost, likePost, reactPost, deletePost } = useFeed(uid);
  const { isFollowing, follow, unfollow } = useFollow(isOwnProfile ? null : uid);
  const counts = useFollowCounts(uid);
  const { sendRequest } = useDMRequests();
  const { badges } = useBadges(uid);

  // UI state
  const [editingBio, setEditingBio]           = useState(false);
  const [bio, setBio]                         = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [dmStatus, setDmStatus]               = useState(null);
  const [followModal, setFollowModal]         = useState(null);
  const [showSettings, setShowSettings]       = useState(false);
  const [showTip, setShowTip]                 = useState(false);
  const [showAwardBadge, setShowAwardBadge]   = useState(false);

  // Username editing state
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername]         = useState("");
  const [usernameError, setUsernameError]     = useState("");
  const [savingUsername, setSavingUsername]   = useState(false);

  const avatarInputRef   = useRef();
  const usernameInputRef = useRef();

  // ── Avatar upload ────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    const snap = await uploadBytes(storageRef(storage, `avatars/${user.uid}`), file);
    const url  = await getDownloadURL(snap.ref);
    await updateUserProfile({ avatar: url });
    setUploadingAvatar(false);
  };

  // ── Send DM ──────────────────────────────────────────────
  const handleSendDM = async () => {
    if (!profile) return;
    const result = await sendRequest(profile);
    if (result.exists) navigate(`/dm/${result.id}`);
    else setDmStatus(result.sent ? "sent" : "pending");
  };

  // ── Username change ──────────────────────────────────────
  const startEditingUsername = () => {
    setNewUsername(profile.username || "");
    setUsernameError("");
    setEditingUsername(true);
    setTimeout(() => usernameInputRef.current?.focus(), 50);
  };

  const handleUsernameChange = async () => {
    const trimmed = newUsername.trim().toLowerCase();
    if (!trimmed)                       { setUsernameError("Username can't be empty.");              return; }
    if (trimmed.length < 3)             { setUsernameError("Must be at least 3 characters.");        return; }
    if (trimmed.length > 20)            { setUsernameError("Max 20 characters.");                    return; }
    if (!/^[a-z0-9_]+$/.test(trimmed)) { setUsernameError("Letters, numbers, underscores only.");   return; }
    if (trimmed === profile.username)   { setEditingUsername(false); return; }

    setSavingUsername(true);
    setUsernameError("");
    try {
      const snap = await getDocs(query(collection(db, "users"), where("username", "==", trimmed)));
      if (!snap.empty) { setUsernameError("Username already taken."); setSavingUsername(false); return; }
      await deleteDoc(doc(db, "usernames", profile.username));
      await setDoc(doc(db, "usernames", trimmed), { uid: user.uid });
      await updateUserProfile({ username: trimmed, displayName: trimmed });
      setEditingUsername(false);
      navigate(`/u/${trimmed}`, { replace: true });
    } catch (err) {
      console.error(err);
      setUsernameError("Something went wrong.");
    } finally { setSavingUsername(false); }
  };

  const cancelUsernameEdit = () => {
    setEditingUsername(false);
    setUsernameError("");
    setNewUsername("");
  };

  // ── Create post ──────────────────────────────────────────
  const handleCreatePost = useCallback(async (data) => {
    await createPost({ ...data, wallOwner: uid });
  }, [createPost, uid]);

  // ── Render guards ────────────────────────────────────────
  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!profile) return <div className="page-empty">User not found</div>;

  return (
    <div className="page-scroll">

      {/* ═══ Profile card ═══ */}
      <div className="profile-card">
        <div className="profile-cover" />
        <div className="profile-card-body">

          {/* Avatar + CTA row */}
          <div className="profile-avatar-row">
            <div style={{ position: "relative" }}>
              <Avatar user={profile} size={80} online={online} tappable={true} />
              {isOwnProfile && (
                <>
                  <button
                    className="avatar-edit-btn"
                    onClick={() => avatarInputRef.current.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? "…" : "✎"}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>

            <div className="profile-cta-row">
              {!isOwnProfile ? (
                <>
                  <button
                    className={`btn-follow ${isFollowing ? "following" : ""}`}
                    onClick={() => isFollowing ? unfollow() : follow(profile)}
                  >
                    {isFollowing ? "✓ Following" : "+ Follow"}
                  </button>
                  <button className="btn-msg" onClick={handleSendDM}>
                    {dmStatus === "sent" ? "✓ Sent" : "💬 Message"}
                  </button>
                  <button className="btn-msg" onClick={() => setShowTip(true)} title="Send coins">
                    🪙 Tip
                  </button>
                  {/* Owner-only Award Badge button */}
                  {myProfile?.username === "STELLEN10" && (
                    <button className="btn-msg" onClick={() => setShowAwardBadge(true)} title="Award Badge">
                      🏅 Award
                    </button>
                  )}
                </>
              ) : (
                <button
                  className="profile-settings-btn"
                  onClick={() => setShowSettings(true)}
                  title="Settings"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Settings
                </button>
              )}
            </div>
          </div>

          {/* Display name + username */}
          <div className="profile-meta">
            <h1 className="profile-display">{profile.displayName}</h1>

            {editingUsername && isOwnProfile ? (
              <div className="username-edit-wrap">
                <span className="username-at-prefix">@</span>
                <input
                  ref={usernameInputRef}
                  className="username-edit-input"
                  value={newUsername}
                  onChange={e => { setNewUsername(e.target.value); setUsernameError(""); }}
                  onKeyDown={e => {
                    if (e.key === "Enter")  handleUsernameChange();
                    if (e.key === "Escape") cancelUsernameEdit();
                  }}
                  maxLength={20}
                  placeholder="newusername"
                  disabled={savingUsername}
                />
                <button className="username-save-btn" onClick={handleUsernameChange} disabled={savingUsername}>
                  {savingUsername ? <span className="spinner-sm" /> : "✓"}
                </button>
                <button className="username-cancel-btn" onClick={cancelUsernameEdit} disabled={savingUsername}>✕</button>
                {usernameError && <span className="username-error">{usernameError}</span>}
              </div>
            ) : (
              <div className="username-display-row">
                <span className="profile-handle">@{profile.username}</span>
                {online && <span className="profile-online">● online</span>}
                {isOwnProfile && (
                  <button
                    className="username-edit-trigger"
                    onClick={startEditingUsername}
                    title="Change username"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <BadgeDisplay badgeIds={badges} size="md" />
            </div>
          )}

          {/* Follower / following counts */}
          <div className="profile-counts">
            <div
              className={`profile-count ${isOwnProfile ? "clickable" : ""}`}
              onClick={() => isOwnProfile && setFollowModal("followers")}
            >
              <strong>{counts.followers}</strong>
              <span>followers</span>
            </div>
            <div
              className={`profile-count ${isOwnProfile ? "clickable" : ""}`}
              onClick={() => isOwnProfile && setFollowModal("following")}
            >
              <strong>{counts.following}</strong>
              <span>following</span>
            </div>
            <div className="profile-count">
              <strong>{posts.length}</strong>
              <span>posts</span>
            </div>
          </div>

          {/* Bio */}
          {editingBio ? (
            <div className="bio-edit">
              <textarea
                className="bio-textarea"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Write something about yourself…"
                maxLength={160}
                autoFocus
              />
              <div className="bio-edit-actions">
                <button className="btn-ghost-sm" onClick={() => setEditingBio(false)}>Cancel</button>
                <button
                  className="btn-primary-sm"
                  onClick={async () => { await updateUserProfile({ bio }); setEditingBio(false); }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p
              className="profile-bio"
              onClick={() => { if (isOwnProfile) { setBio(profile.bio || ""); setEditingBio(true); } }}
            >
              {profile.bio || (isOwnProfile ? <span className="bio-placeholder">+ Add a bio</span> : "")}
            </p>
          )}
        </div>
      </div>

      {/* ═══ Posts feed ═══ */}
      <div className="feed-wrap" style={{ marginTop: 16 }}>
        <CreatePost wallOwner={uid} onPost={handleCreatePost} />

        {postsLoading
          ? [1, 2].map(i => <div key={i} className="skeleton-card" />)
          : posts.length === 0
            ? <div className="empty-state"><p>No posts yet</p></div>
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

      {/* ═══ Modals ═══ */}
      {followModal && (
        <FollowListModal
          uid={uid}
          mode={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
      {showTip && profile && (
        <TipModal
          toUser={{ uid, displayName: profile.displayName, username: profile.username, avatar: profile.avatar }}
          onClose={() => setShowTip(false)}
        />
      )}

      {/* Award Badge Modal */}
      {showAwardBadge && (
        <div className="modal-bg" onClick={() => setShowAwardBadge(false)}>
          <div className="notif-modal" style={{ width: 320, padding: 20 }} onClick={e => e.stopPropagation()}>
            <div className="notif-panel-head" style={{ marginBottom: 16 }}>
              <span>Award Badge to {profile.displayName}</span>
              <button className="icon-btn" onClick={() => setShowAwardBadge(false)}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
              {Object.values(BADGES).map(b => (
                <button
                  key={b.id}
                  className="notif-row"
                  style={{ justifyContent: "flex-start", gap: 12, padding: 12, border: "1.5px solid var(--border)", borderRadius: "var(--r-md)" }}
                  onClick={async () => {
                    await awardBadge(uid, b.id);
                    setShowAwardBadge(false);
                  }}
                >
                  <span style={{ fontSize: 20 }}>{b.icon}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{b.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>{b.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
