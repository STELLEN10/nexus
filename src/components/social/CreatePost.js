import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../shared/Avatar";

export default function CreatePost({ wallOwner, onPost }) {
  const { profile } = useAuth();
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef();

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    setPosting(true);
    try {
      // Pass the current profile avatar so useFeed can store it
      await onPost({ content, image, wallOwner, authorAvatar: profile?.avatar || "" });
      setContent("");
      setImage(null);
      setPreview(null);
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="create-post">
      <div className="create-post-row">
        {/* Show the real profile avatar in the compose box */}
        <Avatar user={profile} size={36} />
        <textarea
          className="create-post-textarea"
          placeholder="What's on your mind?"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={2}
        />
      </div>

      {preview && (
        <div className="create-post-preview">
          <img src={preview} alt="preview" />
          <button className="remove-preview" onClick={() => { setImage(null); setPreview(null); }}>✕</button>
        </div>
      )}

      <div className="create-post-footer">
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
        <button type="button" className="media-btn" onClick={() => fileRef.current.click()}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="5.5" cy="7" r="1.5" fill="currentColor"/>
            <path d="M1 11l3.5-3.5L8 11l2.5-2 4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Photo
        </button>
        <button
          className="btn-primary"
          onClick={handlePost}
          disabled={posting || (!content.trim() && !image)}
        >
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}
