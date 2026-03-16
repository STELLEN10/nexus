import { useState, useRef } from "react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
const GIPHY_KEY = "dc6zaTOxFJmzC";
const PACKS = [{ label: "😄 Funny", query: "funny" },{ label: "🔥 Hype", query: "hype excited" },{ label: "🐱 Cats", query: "cat" },{ label: "💯 Vibes", query: "vibes" },{ label: "🎉 Party", query: "party" }];
export default function StickerPicker({ onSelect, onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("giphy");
  const [q, setQ] = useState("funny");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const search = async (query) => { setLoading(true); try { const r = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=18&rating=g`); const d = await r.json(); setGifs(d.data || []); } catch {} setLoading(false); };
  useState(() => { search(q); }, []);
  const handleUpload = async (e) => { const file = e.target.files[0]; if (!file) return; setUploading(true); const snap = await uploadBytes(storageRef(storage, `stickers/${user.uid}/${Date.now()}_${file.name}`), file); const url = await getDownloadURL(snap.ref); setUploading(false); onSelect(url); };
  return (
    <div className="sticker-panel">
      <div className="sticker-panel-head">
        <div className="sticker-tabs"><button className={`sticker-tab ${tab === "giphy" ? "active" : ""}`} onClick={() => setTab("giphy")}>GIFs</button><button className={`sticker-tab ${tab === "upload" ? "active" : ""}`} onClick={() => setTab("upload")}>Upload</button></div>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>
      {tab === "giphy" && (
        <>
          <div className="sticker-packs">{PACKS.map(p => <button key={p.query} className="pack-btn" onClick={() => { setQ(p.query); search(p.query); }}>{p.label}</button>)}</div>
          <div className="sticker-search-row"><input placeholder="Search GIFs…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search(q)} /><button className="btn-primary-sm" onClick={() => search(q)}>Go</button></div>
          {loading ? <div className="sticker-loading"><div className="spinner" /></div> : <div className="gif-grid">{gifs.map(g => <button key={g.id} className="gif-btn" onClick={() => onSelect(g.images.fixed_height.url)}><img src={g.images.fixed_height_small.url} alt={g.title} loading="lazy" /></button>)}</div>}
        </>
      )}
      {tab === "upload" && (
        <div className="upload-zone-wrap">
          <input ref={fileRef} type="file" accept="image/*,image/gif" style={{ display: "none" }} onChange={handleUpload} />
          <div className="upload-zone" onClick={() => fileRef.current.click()}>{uploading ? <div className="spinner" /> : <><div style={{ fontSize: 28 }}>📁</div><p>Click to upload image or GIF</p></>}</div>
        </div>
      )}
    </div>
  );
}
