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
    <div className="dm-reqs-wrap">
      <button className="dm-reqs-btn" onClick={() => setOpen(v => !v)}>
        <span className="req-count">{incoming.length}</span> Message requests
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", marginLeft: "auto" }}><path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open && (
        <div className="dm-reqs-list">
          {incoming.map(req => (
            <div key={req.id} className="dm-req-row">
              <Avatar user={{ username: req.fromUsername }} size={28} />
              <span className="dm-req-name">{req.fromUsername}</span>
              <button className="req-x" onClick={() => declineRequest(req.id)}>✕</button>
              <button className="req-check" onClick={async () => { const id = await acceptRequest(req); navigate(`/dm/${id}`); }}>✓</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
