import { useState, useRef } from "react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

const GIPHY_KEY = "dc6zaTOxFJmzC"; // public beta key

const STICKER_PACKS = [
  { label: "😄 Faces", query: "funny face" },
  { label: "🔥 Hype", query: "hype excited" },
  { label: "🐱 Cats", query: "cat" },
  { label: "💯 Vibes", query: "vibes mood" },
  { label: "🎉 Party", query: "party celebrate" },
];

export default function StickerPicker({ onSelect, onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("giphy");
  const [query, setQuery] = useState("funny");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const searchGiphy = async (q) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=18&rating=g`);
      const data = await res.json();
      setGifs(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useState(() => { searchGiphy(query); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const path = `stickers/${user.uid}/${Date.now()}_${file.name}`;
    const snap = await uploadBytes(storageRef(storage, path), file);
    const url = await getDownloadURL(snap.ref);
    setUploading(false);
    onSelect(url);
  };

  return (
    <div className="sticker-picker">
      <div className="sticker-picker-header">
        <div className="sticker-tabs">
          <button className={`sticker-tab ${tab === "giphy" ? "active" : ""}`} onClick={() => setTab("giphy")}>GIFs & Memes</button>
          <button className={`sticker-tab ${tab === "upload" ? "active" : ""}`} onClick={() => setTab("upload")}>Upload</button>
        </div>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>

      {tab === "giphy" && (
        <>
          <div className="sticker-packs">
            {STICKER_PACKS.map(p => (
              <button key={p.query} className="sticker-pack-btn" onClick={() => { setQuery(p.query); searchGiphy(p.query); }}>{p.label}</button>
            ))}
          </div>
          <div className="sticker-search">
            <input placeholder="Search GIFs…" value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchGiphy(query)} />
            <button className="btn-primary-sm" onClick={() => searchGiphy(query)}>Go</button>
          </div>
          {loading
            ? <div className="sticker-loading"><div className="spinner" /></div>
            : <div className="gif-grid">
                {gifs.map(g => (
                  <button key={g.id} className="gif-item" onClick={() => onSelect(g.images.fixed_height.url)}>
                    <img src={g.images.fixed_height_small.url} alt={g.title} loading="lazy" />
                  </button>
                ))}
              </div>
          }
        </>
      )}

      {tab === "upload" && (
        <div className="sticker-upload">
          <input ref={fileRef} type="file" accept="image/*,image/gif" style={{ display: "none" }} onChange={handleUpload} />
          <div className="upload-zone" onClick={() => fileRef.current.click()}>
            {uploading ? <div className="spinner" /> : (
              <>
                <div className="upload-icon">📁</div>
                <p>Click to upload an image or GIF</p>
                <span>Stored in Firebase Storage</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
