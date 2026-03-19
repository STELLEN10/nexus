
import { useState, useRef } from "react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { validateImageFile, validateStickerUrl } from "../../lib/validation";
import { checkGiphyLimit, formatRetryAfter } from "../../lib/rateLimiter";

// Key from environment variable — never hardcoded
const GIPHY_KEY = process.env.REACT_APP_GIPHY_KEY;

const PACKS = [
  { label: "😄 Funny",  query: "funny"          },
  { label: "🔥 Hype",   query: "hype excited"   },
  { label: "🐱 Cats",   query: "cat"             },
  { label: "💯 Vibes",  query: "vibes"           },
  { label: "🎉 Party",  query: "party"           },
];

export default function StickerPicker({ onSelect, onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("giphy");
  const [q, setQ] = useState("funny");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const search = async (query) => {
    if (!GIPHY_KEY) { setError("Giphy not configured."); return; }

    // Rate limit Giphy requests
    const rl = checkGiphyLimit(user.uid);
    if (!rl.allowed) { setError(`Too many searches. Wait ${formatRetryAfter(rl.retryAfterMs)}.`); return; }

    setLoading(true); setError("");
    try {
      const r = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=18&rating=g`
      );
      if (!r.ok) throw new Error("Giphy request failed");
      const d = await r.json();
      setGifs(d.data || []);
    } catch (err) {
      setError("Could not load GIFs. Try again.");
    }
    setLoading(false);
  };

  // Load initial pack
  useState(() => { search(q); }, []);

  const handleSelect = (url) => {
    // Validate URL before passing upstream
    const v = validateStickerUrl(url);
    if (!v.ok) { setError(v.error); return; }
    onSelect(v.value);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file before upload
    const fv = validateImageFile(file);
    if (!fv.ok) { setError(fv.error); return; }

    setUploading(true); setError("");
    try {
      const snap = await uploadBytes(
        storageRef(storage, `stickers/${user.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`),
        fv.value
      );
      const url = await getDownloadURL(snap.ref);
      const uv = validateStickerUrl(url);
      if (!uv.ok) throw new Error(uv.error);
      onSelect(uv.value);
    } catch (err) {
      setError("Upload failed. Try again.");
    }
    setUploading(false);
  };

  return (
    <div className="sticker-panel">
      <div className="sticker-panel-head">
        <div className="sticker-tabs">
          <button className={`sticker-tab ${tab==="giphy"?"active":""}`} onClick={() => setTab("giphy")}>GIFs</button>
          <button className={`sticker-tab ${tab==="upload"?"active":""}`} onClick={() => setTab("upload")}>Upload</button>
        </div>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>

      {error && <div style={{ padding:"6px 12px", fontSize:12, color:"#fca5a5", background:"rgba(239,68,68,.1)" }}>{error}</div>}

      {tab === "giphy" && (
        <>
          <div className="sticker-packs">
            {PACKS.map(p => (
              <button key={p.query} className="pack-btn" onClick={() => { setQ(p.query); search(p.query); }}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="sticker-search-row">
            <input
              placeholder="Search GIFs…"
              value={q}
              onChange={e => setQ(e.target.value.slice(0, 50))}
              onKeyDown={e => e.key === "Enter" && search(q)}
            />
            <button className="btn-primary-sm" onClick={() => search(q)}>Go</button>
          </div>
          {loading
            ? <div className="sticker-loading"><div className="spinner"/></div>
            : <div className="gif-grid">
                {gifs.map(g => (
                  <button key={g.id} className="gif-btn" onClick={() => handleSelect(g.images.fixed_height.url)}>
                    <img src={g.images.fixed_height_small.url} alt={g.title} loading="lazy"/>
                  </button>
                ))}
              </div>
          }
        </>
      )}

      {tab === "upload" && (
        <div className="upload-zone-wrap">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display:"none" }} onChange={handleUpload}/>
          <div className="upload-zone" onClick={() => fileRef.current.click()}>
            {uploading
              ? <div className="spinner"/>
              : <><div style={{ fontSize:28 }}>📁</div><p>Click to upload image or GIF (max 5MB)</p></>
            }
          </div>
        </div>
      )}
    </div>
  );
}
