import { useState, useRef, useEffect } from "react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { validateImageFile, validateStickerUrl } from "../../lib/validation";
import { checkGiphyLimit, formatRetryAfter } from "../../lib/rateLimiter";

const GIPHY_KEY = process.env.REACT_APP_GIPHY_KEY;

const PACKS = [
  { label: "🔥", name: "Trending", query: "trending" },
  { label: "😂", name: "Funny",    query: "funny"    },
  { label: "💜", name: "Vibes",    query: "vibes"    },
  { label: "🐱", name: "Cats",     query: "cat"      },
  { label: "🎉", name: "Party",    query: "party"    },
  { label: "😤", name: "Hype",     query: "hype"     },
  { label: "🥺", name: "Feels",    query: "sad cute" },
  { label: "💀", name: "Chaos",    query: "chaos meme"},
];

export default function StickerPicker({ onSelect, onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("gif");           // "gif" | "upload"
  const [activePack, setActivePack] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [hoverId, setHoverId] = useState(null);
  const fileRef = useRef();
  const searchRef = useRef();
  const gridRef = useRef();

  const search = async (query) => {
    if (!GIPHY_KEY) { setError("Giphy API key not configured."); return; }
    const rl = checkGiphyLimit(user.uid);
    if (!rl.allowed) { setError(`Too many searches. Wait ${formatRetryAfter(rl.retryAfterMs)}.`); return; }
    setLoading(true); setError(""); setGifs([]);
    try {
      const r = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=g`
      );
      if (!r.ok) throw new Error();
      const d = await r.json();
      setGifs(d.data || []);
      gridRef.current?.scrollTo({ top: 0 });
    } catch {
      setError("Could not load GIFs. Try again.");
    }
    setLoading(false);
  };

  // Load initial pack on mount
  useEffect(() => { search(PACKS[0].query); }, []);

  const handlePackClick = (i) => {
    setActivePack(i);
    setSearchVal("");
    search(PACKS[i].query);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) search(searchVal.trim());
  };

  const handleSelect = (url) => {
    const v = validateStickerUrl(url);
    if (!v.ok) { setError(v.error); return; }
    onSelect(v.value);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
    } catch {
      setError("Upload failed. Try again.");
    }
    setUploading(false);
  };

  return (
    <div className="sp-root" style={{ background: "var(--bg-1)", display: "flex", flexDirection: "column", height: "100%", maxHeight: "80vh", borderRadius: "var(--r-xl)", overflow: "hidden" }}>

      {/* ── Header ── */}
      <div className="sp-header">
        <div className="sp-tabs">
          <button className={`sp-tab ${tab === "gif" ? "active" : ""}`} onClick={() => setTab("gif")}>
            <span>GIF</span>
          </button>
          <button className={`sp-tab ${tab === "upload" ? "active" : ""}`} onClick={() => setTab("upload")}>
            <span>Upload</span>
          </button>
        </div>
        <button className="sp-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {tab === "gif" && (
        <>
          {/* ── Search bar ── */}
          <form className="sp-search" onSubmit={handleSearch}>
            <div className="sp-search-inner">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: "var(--text-3)" }}>
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                ref={searchRef}
                className="sp-search-input"
                placeholder="Search GIFs…"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value.slice(0, 50))}
              />
              {searchVal && (
                <button type="button" className="sp-search-clear" onClick={() => { setSearchVal(""); searchRef.current?.focus(); }}>✕</button>
              )}
            </div>
            <button type="submit" className="sp-search-btn">Go</button>
          </form>

          {/* ── Category pills ── */}
          <div className="sp-packs">
            {PACKS.map((p, i) => (
              <button
                key={p.query}
                className={`sp-pack ${activePack === i && !searchVal ? "active" : ""}`}
                onClick={() => handlePackClick(i)}
              >
                <span className="sp-pack-emoji">{p.label}</span>
                <span className="sp-pack-name">{p.name}</span>
              </button>
            ))}
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="sp-error">{error}</div>
          )}

          {/* ── GIF Grid ── */}
          <div className="sp-grid" ref={gridRef}>
            {loading ? (
              <div className="sp-loading">
                <div className="sp-loading-dots">
                  <span/><span/><span/>
                </div>
                <p>Loading GIFs…</p>
              </div>
            ) : gifs.length === 0 && !error ? (
              <div className="sp-empty">
                <span style={{ fontSize: 32 }}>🔍</span>
                <p>No GIFs found</p>
              </div>
            ) : (
              <div className="sp-masonry">
                {gifs.map((g, i) => {
                  const img = g.images.fixed_width;
                  const aspect = parseInt(img.height) / parseInt(img.width);
                  return (
                    <button
                      key={g.id}
                      className={`sp-gif-btn ${hoverId === g.id ? "hovered" : ""}`}
                      style={{ animationDelay: `${i * 20}ms` }}
                      onClick={() => handleSelect(g.images.fixed_height.url)}
                      onMouseEnter={() => setHoverId(g.id)}
                      onMouseLeave={() => setHoverId(null)}
                      title={g.title}
                    >
                      <img
                        src={g.images.fixed_width_small.url}
                        alt={g.title}
                        loading="lazy"
                        style={{ aspectRatio: `1 / ${aspect}` }}
                      />
                      {hoverId === g.id && (
                        <div className="sp-gif-overlay">
                          <span>Send</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Powered by Giphy ── */}
          <div className="sp-giphy-credit">
            <svg viewBox="0 0 63 30" height="12" fill="currentColor" style={{ opacity: .4 }}>
              <path d="M0 2.5v25h5v-25H0zm7.5 0v5h5v-5h-5zm0 7.5v5h5v-5h-5zm0 7.5v7.5h5v-7.5h-5zm7.5-15v25h5v-25h-5z"/>
            </svg>
            <span>Powered by GIPHY</span>
          </div>
        </>
      )}

      {tab === "upload" && (
        <div className="sp-upload-tab">
          {error && <div className="sp-error">{error}</div>}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
          <div className="sp-upload-zone" onClick={() => !uploading && fileRef.current.click()}>
            {uploading ? (
              <>
                <div className="sp-upload-spinner" />
                <p>Uploading…</p>
              </>
            ) : (
              <>
                <div className="sp-upload-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="sp-upload-title">Drop an image or GIF here</p>
                <p className="sp-upload-sub">JPEG, PNG, GIF, WebP · Max 5MB</p>
                <button className="sp-upload-btn" type="button">Browse files</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
