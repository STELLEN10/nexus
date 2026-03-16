export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers?.length) return <div style={{ height: 22 }} />;
  const label = typingUsers.length === 1 ? `${typingUsers[0]} is typing` : `${typingUsers.slice(0, 2).join(" & ")} are typing`;
  return (
    <div className="typing-row">
      <div className="typing-dots"><span /><span /><span /></div>
      <span className="typing-txt">{label}</span>
    </div>
  );
}
