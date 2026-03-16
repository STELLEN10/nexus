import { useState } from "react";
import { useVibe, VIBES } from "../../hooks/useVibe";

export default function VibePicker({ onClose }) {
  const { myVibe, setVibe } = useVibe();
  const [setting, setSetting] = useState(false);

  const handleSelect = async (vibe) => {
    setSetting(true);
    await setVibe(myVibe?.emoji === vibe.emoji ? null : vibe);
    setSetting(false);
    onClose?.();
  };

  const handleClear = async () => {
    setSetting(true);
    await setVibe(null);
    setSetting(false);
    onClose?.();
  };

  return (
    <div className="vibe-picker">
      <div className="vibe-picker-head">
        <span>Set your vibe</span>
        {myVibe && (
          <button className="vibe-clear-btn" onClick={handleClear} disabled={setting}>
            Clear vibe
          </button>
        )}
      </div>
      {myVibe && (
        <div className="vibe-current">
          <span className="vibe-current-label">Current:</span>
          <span className="vibe-current-pill" style={{ background: myVibe.color + "22", color: myVibe.color, borderColor: myVibe.color + "44" }}>
            {myVibe.emoji} {myVibe.label}
          </span>
        </div>
      )}
      <div className="vibe-grid">
        {VIBES.map(v => (
          <button
            key={v.emoji}
            className={`vibe-option ${myVibe?.emoji === v.emoji ? "active" : ""}`}
            style={myVibe?.emoji === v.emoji ? { background: v.color + "22", borderColor: v.color + "66", color: v.color } : {}}
            onClick={() => handleSelect(v)}
            disabled={setting}
          >
            <span className="vibe-emoji">{v.emoji}</span>
            <span className="vibe-label">{v.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
