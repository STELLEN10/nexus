import { useState, useEffect } from "react";
import { useUserSearch } from "../../hooks/useUsers";
import { useGroupDMs } from "../../hooks/useGroupDMs";
import { useAuth } from "../../context/AuthContext";
import VibeAvatar from "../vibe/VibeAvatar";

export default function CreateGroupModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [creating, setCreating] = useState(false);
  const { results, searching, search: doSearch, setResults } = useUserSearch();
  const { createGroup } = useGroupDMs();

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, doSearch]);

  const toggleMember = (u) => {
    setSelected(prev =>
      prev.find(m => m.uid === u.uid)
        ? prev.filter(m => m.uid !== u.uid)
        : [...prev, u]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selected.length < 1) return;
    setCreating(true);
    try {
      const id = await createGroup(name.trim(), selected.map(m => m.uid));
      onCreated(id);
      onClose();
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="create-group-modal">
        <div className="modal-header">
          <h3>New group chat</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="group-name-field">
            <label>Group name</label>
            <input
              type="text"
              placeholder="The Squad, Work crew…"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          {selected.length > 0 && (
            <div className="group-selected">
              {selected.map(m => (
                <div key={m.uid} className="group-selected-chip">
                  <VibeAvatar user={m} uid={m.uid} size={20} showVibe={false} />
                  <span>{m.displayName || m.username}</span>
                  <button onClick={() => toggleMember(m)}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="group-search-field">
            <label>Add people</label>
            <input
              type="text"
              placeholder="Search by username…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="group-results">
            {results.filter(r => r.uid !== user?.uid).map(u => {
              const isSelected = selected.find(m => m.uid === u.uid);
              return (
                <div key={u.uid} className={`group-result-row ${isSelected ? "selected" : ""}`} onClick={() => toggleMember(u)}>
                  <VibeAvatar user={u} uid={u.uid} size={32} showVibe={true} />
                  <div className="group-result-info">
                    <span className="group-result-name">{u.displayName}</span>
                    <span className="group-result-handle">@{u.username}</span>
                  </div>
                  <div className={`group-check ${isSelected ? "checked" : ""}`}>
                    {isSelected ? "✓" : "+"}
                  </div>
                </div>
              );
            })}
            {search.length >= 2 && !searching && results.filter(r => r.uid !== user?.uid).length === 0 && (
              <div className="search-empty">No users found for "{search}"</div>
            )}
            {search.length < 2 && <div className="search-hint">Type to search for people</div>}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleCreate}
            disabled={creating || !name.trim() || selected.length < 1}
          >
            {creating ? "Creating…" : `Create group (${selected.length + 1})`}
          </button>
        </div>
      </div>
    </div>
  );
}
