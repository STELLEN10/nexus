import { useState, useRef, useEffect } from "react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

export default function VoiceRecorder({ onSend, onClose }) {
  const { user } = useAuth();
  const [state, setState] = useState("idle"); // idle | recording | recorded | uploading
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState("recorded");
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start();
      setState("recording");
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch (err) {
      alert("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setState("uploading");
    try {
      const path = `voice/${user.uid}/${Date.now()}.webm`;
      const snap = await uploadBytes(storageRef(storage, path), audioBlob);
      const url = await getDownloadURL(snap.ref);
      onSend(url);
    } catch (err) {
      console.error(err);
      setState("recorded");
    }
  };

  const handleDiscard = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setState("idle");
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="voice-recorder">
      <div className="voice-recorder-head">
        <span>Voice message</span>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>

      <div className="voice-recorder-body">
        {state === "idle" && (
          <div className="voice-idle">
            <div className="voice-mic-icon">🎙</div>
            <p>Tap to start recording</p>
            <button className="voice-record-btn" onClick={startRecording}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="11" r="4" fill="currentColor"/><path d="M19 11a7 7 0 01-14 0M12 18v4M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
        )}

        {state === "recording" && (
          <div className="voice-recording">
            <div className="voice-waveform">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="voice-bar" style={{ animationDelay: `${i * 0.05}s` }} />
              ))}
            </div>
            <div className="voice-timer">{formatTime(duration)}</div>
            <div className="voice-recording-indicator">
              <div className="voice-rec-dot" /> Recording…
            </div>
            <button className="voice-stop-btn" onClick={stopRecording}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="12" height="12" rx="2"/></svg>
              Stop
            </button>
          </div>
        )}

        {state === "recorded" && audioUrl && (
          <div className="voice-recorded">
            <audio src={audioUrl} controls className="voice-audio-player" />
            <div className="voice-duration">Duration: {formatTime(duration)}</div>
            <div className="voice-recorded-actions">
              <button className="btn-ghost" onClick={handleDiscard}>🗑 Discard</button>
              <button className="btn-primary" onClick={handleSend}>Send 🎙</button>
            </div>
          </div>
        )}

        {state === "uploading" && (
          <div className="voice-uploading">
            <div className="spinner" />
            <p>Sending voice message…</p>
          </div>
        )}
      </div>
    </div>
  );
}
