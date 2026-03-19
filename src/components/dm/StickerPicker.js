import { useState, useRef, useEffect } from "react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

const GIPHY_KEY = process.env.REACT_APP_GIPHY_KEY;

const PACKS = [
  { label: "🔥 Trending", query: "trending"  },
  { label: "😂 Funny",    query: "funny"     },
  { label: "💜 Vibes",    query: "vibes"     },
  { label: "🐱 Cats",     query: "cat"       },
  { label: "🎉 Party",    query: "party"     },
  { label: "😤 Hype",     query: "hype"      },
  { label: "🥺 Feels",    query: "sad cute"  },
  { label: "💀 Chaos",    query: "chaos meme"},
];

export default function StickerPicker({ onSelect, onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("gif");
  const [activePack, setActivePack] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const search = async (query) => {
    if (!GIPHY_KEY) { setError("Giphy API key not configured."); return; }
    setLoading(true); setError(""); setGifs([]);
    try {
      const r = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=g`
      );
      if (!r.ok) throw new Error();
      const d = await r.json();
      setGifs(d.data || []);
    } catch {
      setError("Could not load GIFs. Try again.");
    }
    setLoading(false);
  };

  useEffect(() => { search(PACKS[0].query); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("File too large (max 5MB)."); return; }
    const allowed = ["image/jpeg","image/png","image/gif","image/webp"];
    if (!allowed.includes(file.type)) { setError("Only JPEG, PNG, GIF, WebP allowed."); return; }
    setUploading(true); setError("");
    try {
      const snap = await uploadBytes(storageRef(storage, `stickers/${user.uid}/${Date.now()}_${file.name}`), file);
      const url = await getDownloadURL(snap.ref);
      onSelect(url);
    } catch { setError("Upload failed."); }
    setUploading(false);
  };

  // ── Styles (all inline — zero CSS dependency) ────────────
  const S = {
    root: {
      width: "100%",
      maxWidth: 460,
      maxHeight: "75vh",
      background: "#0d0d14",
      border: "1.5px solid rgba(124,58,237,.35)",
      borderRadius: 18,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 0 40px rgba(124,58,237,.4), 0 24px 60px rgba(0,0,0,.8)",
    },
    header: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,.07)", flexShrink: 0,
    },
    tabWrap: { display: "flex", gap: 4, background: "#14141f", borderRadius: 10, padding: 3 },
    tab: (active) => ({
      padding: "6px 18px", border: "none", borderRadius: 8, cursor: "pointer",
      fontFamily: "var(--font)", fontSize: 13, fontWeight: 700, transition: "all .15s",
      background: active ? "#7c3aed" : "transparent",
      color: active ? "#fff" : "#9090b8",
      boxShadow: active ? "0 0 12px rgba(124,58,237,.5)" : "none",
    }),
    closeBtn: {
      width: 30, height: 30, border: "1.5px solid rgba(255,255,255,.1)",
      borderRadius: "50%", background: "#14141f", color: "#9090b8",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13,
    },
    searchWrap: {
      display: "flex", gap: 8, padding: "10px 14px 8px", flexShrink: 0,
    },
    searchInner: {
      flex: 1, display: "flex", alignItems: "center", gap: 8,
      background: "#14141f", border: "1.5px solid rgba(255,255,255,.08)",
      borderRadius: 12, padding: "8px 12px",
    },
    searchInput: {
      flex: 1, background: "transparent", border: "none", outline: "none",
      color: "#f0f0ff", fontFamily: "var(--font)", fontSize: 13,
    },
    goBtn: {
      background: "#7c3aed", border: "none", borderRadius: 10,
      padding: "8px 16px", color: "#fff", fontFamily: "var(--font)",
      fontSize: 12, fontWeight: 700, cursor: "pointer",
      boxShadow: "0 0 10px rgba(124,58,237,.5)",
    },
    packsWrap: {
      display: "flex", gap: 6, padding: "0 14px 10px",
      overflowX: "auto", flexShrink: 0,
    },
    pack: (active) => ({
      padding: "5px 12px", border: `1.5px solid ${active ? "rgba(124,58,237,.5)" : "rgba(255,255,255,.08)"}`,
      borderRadius: 20, background: active ? "rgba(124,58,237,.15)" : "#14141f",
      color: active ? "#a855f7" : "#9090b8", fontFamily: "var(--font)",
      fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
      flexShrink: 0, transition: "all .15s",
    }),
    gridWrap: {
      flex: 1, overflowY: "auto", padding: "0 14px 10px", minHeight: 0,
    },
    masonry: {
      columns: 2, columnGap: 8,
    },
    gifBtn: {
      display: "block", width: "100%", background: "#14141f",
      border: "none", borderRadius: 10, padding: 0, cursor: "pointer",
      overflow: "hidden", marginBottom: 8, breakInside: "avoid",
      transition: "transform .15s, box-shadow .15s",
    },
    gifImg: { width: "100%", height: "auto", display: "block", borderRadius: 10 },
    loadWrap: {
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "48px 20px", gap: 12, color: "#9090b8", fontSize: 13,
    },
    error: {
      margin: "0 14px 8px", padding: "8px 12px",
      background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)",
      borderRadius: 10, fontSize: 12, color: "#fca5a5",
    },
    credit: {
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 6, padding: "8px", color: "#48486a", fontSize: 10,
      fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
      borderTop: "1px solid rgba(255,255,255,.05)", flexShrink: 0,
    },
    uploadZone: {
      flex: 1, minHeight: 220, border: "2px dashed rgba(124,58,237,.3)",
      borderRadius: 16, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 10,
      cursor: "pointer", background: "#14141f", padding: 32, margin: 14,
      transition: "all .2s",
    },
    uploadBtn: {
      marginTop: 8, background: "#7c3aed", border: "none",
      borderRadius: 10, padding: "9px 24px", color: "#fff",
      fontFamily: "var(--font)", fontSize: 13, fontWeight: 700,
      cursor: "pointer", boxShadow: "0 0 14px rgba(124,58,237,.5)",
    },
  };

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.tabWrap}>
          <button style={S.tab(tab==="gif")}    onClick={() => setTab("gif")}>GIFs</button>
          <button style={S.tab(tab==="upload")} onClick={() => setTab("upload")}>Upload</button>
        </div>
        <button style={S.closeBtn} onClick={onClose}>✕</button>
      </div>

      {tab === "gif" && (
        <>
          {/* Search */}
          <div style={S.searchWrap}>
            <div style={S.searchInner}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, color:"#9090b8" }}>
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                style={S.searchInput}
                placeholder="Search GIFs…"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value.slice(0,50))}
                onKeyDown={e => e.key==="Enter" && search(searchVal.trim()||PACKS[activePack].query)}
              />
            </div>
            <button style={S.goBtn} onClick={() => search(searchVal.trim()||PACKS[activePack].query)}>Go</button>
          </div>

          {/* Packs */}
          <div style={S.packsWrap}>
            {PACKS.map((p,i) => (
              <button key={p.query} style={S.pack(activePack===i && !searchVal)}
                onClick={() => { setActivePack(i); setSearchVal(""); search(p.query); }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && <div style={S.error}>{error}</div>}

          {/* Grid */}
          <div style={S.gridWrap}>
            {loading ? (
              <div style={S.loadWrap}>
                <div style={{ display:"flex", gap:6 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width:8, height:8, borderRadius:"50%",
                      background: i===0?"#7c3aed":i===1?"#a855f7":"#06b6d4",
                      animation: `sp-bounce .9s ease-in-out ${i*0.15}s infinite`,
                    }}/>
                  ))}
                </div>
                <p>Loading GIFs…</p>
              </div>
            ) : gifs.length === 0 ? (
              <div style={S.loadWrap}><span style={{fontSize:32}}>🔍</span><p>No GIFs found</p></div>
            ) : (
              <div style={S.masonry}>
                {gifs.map(g => (
                  <button key={g.id} style={S.gifBtn}
                    onClick={() => onSelect(g.images.fixed_height.url)}
                    onMouseEnter={e => { e.currentTarget.style.transform="scale(1.03)"; e.currentTarget.style.boxShadow="0 4px 20px rgba(124,58,237,.4)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow="none"; }}
                  >
                    <img src={g.images.fixed_width_small.url} alt={g.title} loading="lazy" style={S.gifImg}/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Credit */}
          <div style={S.credit}>Powered by GIPHY</div>
        </>
      )}

      {tab === "upload" && (
        <>
          {error && <div style={{...S.error, margin:"14px 14px 0"}}>{error}</div>}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
            style={{display:"none"}} onChange={handleUpload}/>
          <div style={S.uploadZone} onClick={() => !uploading && fileRef.current.click()}
            onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(124,58,237,.6)"; e.currentTarget.style.background="rgba(124,58,237,.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(124,58,237,.3)"; e.currentTarget.style.background="#14141f"; }}
          >
            {uploading ? (
              <>
                <div className="spinner"/>
                <p style={{color:"#9090b8",fontSize:13}}>Uploading…</p>
              </>
            ) : (
              <>
                <div style={{fontSize:36}}>📁</div>
                <p style={{color:"#f0f0ff",fontSize:14,fontWeight:700}}>Drop an image or GIF here</p>
                <p style={{color:"#9090b8",fontSize:12}}>JPEG, PNG, GIF, WebP · Max 5MB</p>
                <button style={S.uploadBtn} type="button">Browse files</button>
              </>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes sp-bounce{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-8px);opacity:1}}`}</style>
    </div>
  );
}
