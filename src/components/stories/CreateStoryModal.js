import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

const BG_COLORS = [
  "#7c3aed", "#a855f7", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#1e1e2e", "#0f172a", "#18181b",
];

export default function CreateStoryModal({ onClose, onCreate }) {
  const { profile } = useAuth();
  const [tab, setTab] = useState("text"); // "text" | "image"
  const [text, setText] = useState("");
  const [bgColor, setBgColor] = useState("#7c3aed");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef();

  const handleImageChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
  };

  const handlePost = async () => {
    if (tab === "text" && !text.trim()) return;
    if (tab === "image" && !image) return;
    setPosting(true);
    try {
      await onCreate({
        type: tab,
        text: text.trim(),
        bgColor,
        image: tab === "image" ? image : null,
      });
      onClose();
    } catch (err) { console.error(err); }
    finally { setPosting(false); }
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="create-story-modal">
        <div className="create-story-header">
          <h3>Create story</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tab switcher */}
        <div className="story-type-tabs">
          <button className={`story-type-tab ${tab === "text" ? "active" : ""}`} onClick={() => setTab("text")}>✏️ Text</button>
          <button className={`story-type-tab ${tab === "image" ? "active" : ""}`} onClick={() => setTab("image")}>📷 Photo</button>
        </div>

        {/* Preview */}
        <div className="story-preview-wrap">
          {tab === "text" ? (
            <div className="story-preview-card" style={{ background: bgColor }}>
              <p className="story-preview-text">{text || "What's on your mind?"}</p>
            </div>
          ) : (
            <div className="story-preview-card dark">
              {preview
                ? <img src={preview} alt="preview" className="story-preview-img" />
                : (
                  <div className="story-preview-upload-prompt" onClick={() => fileRef.current.click()}>
                    <span style={{ fontSize: 32 }}>📷</span>
                    <p>Tap to add a photo</p>
                  </div>
                )
              }
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
            </div>
          )}
        </div>

        {/* Text input */}
        {tab === "text" && (
          <textarea
            className="story-text-input"
            placeholder="Type something…"
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={200}
            autoFocus
          />
        )}

        {/* Background colour picker (text only) */}
        {tab === "text" && (
          <div className="story-bg-picker">
            <span className="story-bg-label">Background</span>
            <div className="story-bg-swatches">
              {BG_COLORS.map(c => (
                <button
                  key={c}
                  className={`story-bg-swatch ${bgColor === c ? "selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => setBgColor(c)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Photo change button */}
        {tab === "image" && preview && (
          <button className="btn-ghost" style={{ margin: "0 20px" }} onClick={() => fileRef.current.click()}>Change photo</button>
        )}

        <div className="create-story-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handlePost}
            disabled={posting || (tab === "text" && !text.trim()) || (tab === "image" && !image)}
          >
            {posting ? "Posting…" : "Share story"}
          </button>
        </div>
      </div>
    </div>
  );
}
