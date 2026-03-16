import { useState, useRef } from "react";

export default function VoiceMessage({ url, isOwn }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
  };

  const handleEnded = () => { setPlaying(false); setProgress(0); };
  const handleLoadedMetadata = () => { setDuration(Math.round(audioRef.current?.duration || 0)); };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const currentTime = audioRef.current ? Math.round(audioRef.current.currentTime) : 0;

  return (
    <div className={`voice-msg-bubble ${isOwn ? "own" : ""}`}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        style={{ display: "none" }}
      />
      <button className="voice-play-btn" onClick={togglePlay}>
        {playing
          ? <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="1" width="4" height="14" rx="1"/><rect x="10" y="1" width="4" height="14" rx="1"/></svg>
          : <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2l11 6-11 6V2z"/></svg>
        }
      </button>
      <div className="voice-msg-content">
        <div className="voice-progress-bar" onClick={handleSeek}>
          <div className="voice-progress-fill" style={{ width: `${progress}%` }} />
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="voice-progress-spike" style={{ height: `${30 + Math.sin(i * 0.8) * 20 + Math.cos(i * 0.3) * 10}%`, opacity: i / 24 < progress / 100 ? 1 : 0.35 }} />
          ))}
        </div>
        <span className="voice-msg-time">{playing ? fmt(currentTime) : fmt(duration)}</span>
      </div>
      <span className="voice-mic-icon-sm">🎙</span>
    </div>
  );
}
