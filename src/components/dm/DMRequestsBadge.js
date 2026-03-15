import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDMRequests } from "../../hooks/useDMs";
import Avatar from "../shared/Avatar";

export default function DMRequestsBadge() {
  const { incoming, acceptRequest, declineRequest } = useDMRequests();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (incoming.length === 0) return null;

  return (
    <div className="dm-requests-section">
      <button className="dm-requests-btn" onClick={() => setOpen(v => !v)}>
        <span className="req-badge">{incoming.length}</span>
        Message requests
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="dm-requests-list">
          {incoming.map(req => (
            <div key={req.id} className="dm-request-item">
              <Avatar user={{ username: req.fromUsername }} size={30} />
              <span className="dm-request-name">{req.fromUsername}</span>
              <button className="req-decline" onClick={() => declineRequest(req.id)}>✕</button>
              <button className="req-accept" onClick={async () => {
                const id = await acceptRequest(req);
                navigate(`/dm/${id}`);
              }}>✓</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
