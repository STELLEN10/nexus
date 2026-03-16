import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import StoryViewer from "./StoryViewer";
import CreateStoryModal from "./CreateStoryModal";

export default function StoriesBar({ stories, loading, onCreateStory, onMarkSeen }) {
  const { user } = useAuth();
  const [viewingGroup, setViewingGroup] = useState(null); // { stories, startIndex }
  const [showCreate, setShowCreate] = useState(false);

  const ownGroup = stories.find(g => g.authorId === user?.uid);
  const othersGroups = stories.filter(g => g.authorId !== user?.uid);

  const handleViewGroup = (group) => {
    setViewingGroup({ stories: group.stories, authorName: group.authorName });
  };

  return (
    <>
      <div className="stories-bar">
        {/* Add story button */}
        <div className="story-item" onClick={() => setShowCreate(true)}>
          <div className="story-avatar-ring add-ring">
            <div className="story-avatar-inner">
              {ownGroup ? (
                <img
                  src={ownGroup.authorAvatar || ""}
                  alt="you"
                  onError={e => { e.target.style.display = "none"; }}
                />
              ) : (
                <div className="story-avatar-placeholder">
                  {user?.displayName?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <div className="story-add-icon">+</div>
            </div>
          </div>
          <span className="story-label">Your story</span>
        </div>

        {/* Own story if exists */}
        {ownGroup && (
          <div className="story-item" onClick={() => handleViewGroup(ownGroup)}>
            <div className={`story-avatar-ring ${ownGroup.hasUnread ? "unread" : "seen"}`}>
              <div className="story-avatar-inner">
                {ownGroup.authorAvatar
                  ? <img src={ownGroup.authorAvatar} alt={ownGroup.authorName} />
                  : <div className="story-avatar-placeholder">{ownGroup.authorName?.[0]?.toUpperCase()}</div>
                }
              </div>
            </div>
            <span className="story-label">You</span>
          </div>
        )}

        {/* Others' stories */}
        {othersGroups.map(group => (
          <div key={group.authorId} className="story-item" onClick={() => handleViewGroup(group)}>
            <div className={`story-avatar-ring ${group.hasUnread ? "unread" : "seen"}`}>
              <div className="story-avatar-inner">
                {group.authorAvatar
                  ? <img src={group.authorAvatar} alt={group.authorName} />
                  : <div className="story-avatar-placeholder">{group.authorName?.[0]?.toUpperCase()}</div>
                }
              </div>
            </div>
            <span className="story-label">{group.authorName}</span>
          </div>
        ))}

        {loading && [1, 2, 3].map(i => (
          <div key={i} className="story-item">
            <div className="story-avatar-ring skeleton-ring">
              <div className="story-avatar-inner skeleton-avatar" />
            </div>
            <span className="story-label-skeleton" />
          </div>
        ))}
      </div>

      {viewingGroup && (
        <StoryViewer
          stories={viewingGroup.stories}
          authorName={viewingGroup.authorName}
          onClose={() => setViewingGroup(null)}
          onMarkSeen={onMarkSeen}
        />
      )}

      {showCreate && (
        <CreateStoryModal
          onClose={() => setShowCreate(false)}
          onCreate={onCreateStory}
        />
      )}
    </>
  );
}
