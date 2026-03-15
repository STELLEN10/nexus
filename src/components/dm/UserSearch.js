import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUserSearch } from "../../hooks/useUsers";
import { useDMRequests, dmId } from "../../hooks/useDMs";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../shared/Avatar";

export default function UserSearch({ onClose }) {
  const [term, setTerm] = useState("");
  const { results, searching, search, setResults } = useUserSearch();
  const { sendRequest } = useDMRequests();
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef();
  const [statuses, setStatuses] = useState({});

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const t = setTimeout(() => search(term), 300);
    return () => clearTimeout(t);
  }, [term, search]);

  const handleStart = async (targetUser) => {
    const result = await sendRequest(targetUser);
    if (result.exists) { navigate(`/dm/${result.id}`); onClose(); }
    else setStatuses(s => ({ ...s, [targetUser.uid]: result.sent ? "sent" : "pending" }));
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="search-modal">
        <div className="search-modal-header">
          <h3>Find people</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="search-input-wrap">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input ref={inputRef} placeholder="Search by username…" value={term} onChange={e => setTerm(e.target.value)} />
          {searching && <div className="spinner-sm" />}
        </div>
        <div className="search-results">
          {results.filter(r => r.uid !== user.uid).map(u => (
            <div key={u.uid} className="search-result-item">
              <Avatar user={u} size={36} />
              <div className="search-result-info">
                <span className="search-result-name">{u.displayName}</span>
                <span className="search-result-username">@{u.username}</span>
              </div>
              <div className="search-result-actions">
                <button className="btn-ghost-sm" onClick={() => { navigate(`/u/${u.username}`); onClose(); }}>Profile</button>
                <button className="btn-primary-sm" onClick={() => handleStart(u)} disabled={!!statuses[u.uid]}>
                  {statuses[u.uid] === "sent" ? "✓ Sent" : statuses[u.uid] === "pending" ? "Pending" : "Message"}
                </button>
              </div>
            </div>
          ))}
          {term.length >= 2 && !searching && results.filter(r => r.uid !== user.uid).length === 0 && (
            <div className="search-empty">No users found for "{term}"</div>
          )}
          {term.length < 2 && <div className="search-hint">Type at least 2 characters to search</div>}
        </div>
      </div>
    </div>
  );
}
