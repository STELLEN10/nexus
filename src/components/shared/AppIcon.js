const ICON_PATHS = {
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  analytics: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16V9" />
      <path d="M12 16V5" />
      <path d="M16 16v-4" />
    </>
  ),
  badge: (
    <>
      <circle cx="12" cy="8" r="5" />
      <path d="m8.8 12.2-1.3 8 4.5-2.6 4.5 2.6-1.3-8" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
    </>
  ),
  broadcast: (
    <>
      <path d="m3 11 18-7-7 18-3-8-8-3z" />
      <path d="m11 14 4-4" />
    </>
  ),
  bug: (
    <>
      <path d="M8 6.2a4 4 0 0 1 8 0V14a4 4 0 0 1-8 0z" />
      <path d="M12 2v4" />
      <path d="M4 13h4" />
      <path d="M16 13h4" />
      <path d="m5 5 3 3" />
      <path d="m19 5-3 3" />
      <path d="m5 21 3-3" />
      <path d="m19 21-3-3" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevrons: (
    <>
      <path d="m6 10 4 4 8-8" />
      <path d="m6 16 2 2 4-4" />
    </>
  ),
  close: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8" />
      <ellipse cx="12" cy="12" rx="4" ry="8" />
      <path d="M4 12h16" />
    </>
  ),
  crown: <path d="m3 18 2-11 5 5 2-8 2 8 5-5 2 11H3z" />,
  document: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  gift: (
    <>
      <path d="M20 12v10H4V12" />
      <path d="M2 7h20v5H2z" />
      <path d="M12 22V7" />
      <path d="M12 7H8.5a2.5 2.5 0 1 1 2.5-2.5V7Z" />
      <path d="M12 7h3.5A2.5 2.5 0 1 0 13 4.5V7Z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15 15 0 0 1 0 20" />
      <path d="M12 2a15 15 0 0 0 0 20" />
    </>
  ),
  heart: <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
  help: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 1 1 5.7 1.4c-.8 1.3-2.8 1.7-2.8 3.6" />
      <path d="M12 18h.01" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="14" r="4" />
      <path d="m11 11 8-8" />
      <path d="m16 3 5 5" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  moon: <path d="M21 15.5A9 9 0 0 1 8.5 3a9 9 0 1 0 12.5 12.5Z" />,
  palette: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="8" cy="10" r="1" />
      <circle cx="12" cy="7" r="1" />
      <circle cx="16" cy="10" r="1" />
      <path d="M13 17h1a3 3 0 0 0 0-6h-1a2 2 0 0 0 0 4" />
    </>
  ),
  rocket: (
    <>
      <path d="M12 2c4 0 8 4 8 9l-7 7-7-7c0-5 4-9 6-9Z" />
      <circle cx="12" cy="9" r="2" />
      <path d="m6 11-3 5 5-3" />
      <path d="m18 11 3 5-5-3" />
    </>
  ),
  scale: (
    <>
      <path d="M12 3v18" />
      <path d="M5 21h14" />
      <path d="M5 6h14" />
      <path d="m6 6-3 7h6Z" />
      <path d="m18 6-3 7h6Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  shield: <path d="M12 2 20 6v6c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6Z" />,
  star: <path d="m12 2 3 6 6.5.9-4.7 4.6 1.1 6.5-5.9-3.1L6.1 20l1.1-6.5L2.5 8.9 9 8Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.9 4.9 6.3 6.3" />
      <path d="m17.7 17.7 1.4 1.4" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m4.9 19.1 1.4-1.4" />
      <path d="m17.7 6.3 1.4-1.4" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m6 6 1 16h10l1-16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
  unlock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.5-2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M16 11a4 4 0 0 1 0-6" />
      <path d="M19 21a6 6 0 0 0-4-5.6" />
    </>
  ),
  volume: (
    <>
      <path d="M5 9H3v6h2l5 4V5Z" />
      <path d="M16 7a7 7 0 0 1 0 10" />
      <path d="M13.5 10a3 3 0 0 1 0 4" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3 2 21h20Z" />
      <path d="M12 9v5" />
      <path d="M12 18h.01" />
    </>
  ),
};

export default function AppIcon({ name = "star", size = 18, strokeWidth = 1.8, title, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      style={style}
    >
      {title && <title>{title}</title>}
      {ICON_PATHS[name] || ICON_PATHS.star}
    </svg>
  );
}
