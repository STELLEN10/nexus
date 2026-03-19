// src/lib/validation.js
// Central schema-based input validation + sanitization.
// All user-generated content passes through here before any
// Firestore / RTDB write.

// ── Limits ───────────────────────────────────────────────────
export const LIMITS = {
  USERNAME_MIN:     3,
  USERNAME_MAX:     20,
  DISPLAY_NAME_MAX: 32,
  BIO_MAX:          160,
  POST_MAX:         2000,
  MESSAGE_MAX:      4000,
  ROOM_NAME_MAX:    50,
  ROOM_DESC_MAX:    200,
  GROUP_NAME_MAX:   50,
  COMMENT_MAX:      1000,
  FILE_MAX_MB:      10,
  AVATAR_MAX_MB:    5,
  STORY_TEXT_MAX:   200,
  EMAIL_MAX:        254,
};

const FILE_BYTES = (mb) => mb * 1024 * 1024;

// ── Sanitizers ───────────────────────────────────────────────

/** Strip HTML tags, JS protocol injections, trim whitespace */
export function sanitizeText(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

/** Strip to alphanumeric + underscore, lowercase */
export function sanitizeUsername(str) {
  if (typeof str !== "string") return "";
  return str.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
}

/** Validate a URL — only https, optional host whitelist */
export function sanitizeUrl(url, { allowedHosts = null } = {}) {
  if (typeof url !== "string") return "";
  try {
    const u = new URL(url);
    if (!["https:", "http:"].includes(u.protocol)) return "";
    if (allowedHosts && !allowedHosts.some(h => u.hostname.endsWith(h))) return "";
    return url;
  } catch {
    return "";
  }
}

// ── Validators ───────────────────────────────────────────────
// Each returns { ok: boolean, error?: string, value?: any }

export function validateUsername(raw) {
  const v = sanitizeUsername(raw);
  if (!v)                              return { ok: false, error: "Username is required." };
  if (v.length < LIMITS.USERNAME_MIN)  return { ok: false, error: `Min ${LIMITS.USERNAME_MIN} characters.` };
  if (v.length > LIMITS.USERNAME_MAX)  return { ok: false, error: `Max ${LIMITS.USERNAME_MAX} characters.` };
  if (!/^[a-z0-9_]+$/.test(v))        return { ok: false, error: "Letters, numbers and underscores only." };
  return { ok: true, value: v };
}

export function validateEmail(raw) {
  const v = sanitizeText(raw).toLowerCase();
  if (!v)                          return { ok: false, error: "Email is required." };
  if (v.length > LIMITS.EMAIL_MAX) return { ok: false, error: "Email too long." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { ok: false, error: "Invalid email address." };
  return { ok: true, value: v };
}

export function validatePassword(raw) {
  if (typeof raw !== "string" || raw.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
  if (raw.length > 128) return { ok: false, error: "Password too long." };
  return { ok: true, value: raw };
}

export function validatePostContent(raw) {
  const v = sanitizeText(raw);
  if (v.length > LIMITS.POST_MAX) return { ok: false, error: `Post too long (max ${LIMITS.POST_MAX} chars).` };
  return { ok: true, value: v };
}

export function validateMessage(raw) {
  if (typeof raw !== "string") return { ok: false, error: "Invalid message." };
  const v = sanitizeText(raw);
  if (!v)                            return { ok: false, error: "Message cannot be empty." };
  if (v.length > LIMITS.MESSAGE_MAX) return { ok: false, error: `Message too long (max ${LIMITS.MESSAGE_MAX} chars).` };
  return { ok: true, value: v };
}

export function validateBio(raw) {
  const v = sanitizeText(raw);
  if (v.length > LIMITS.BIO_MAX) return { ok: false, error: `Bio too long (max ${LIMITS.BIO_MAX} chars).` };
  return { ok: true, value: v };
}

export function validateRoomName(raw) {
  const v = sanitizeText(raw);
  if (!v)                              return { ok: false, error: "Room name is required." };
  if (v.length > LIMITS.ROOM_NAME_MAX) return { ok: false, error: `Max ${LIMITS.ROOM_NAME_MAX} chars.` };
  return { ok: true, value: v };
}

export function validateGroupName(raw) {
  const v = sanitizeText(raw);
  if (!v)                               return { ok: false, error: "Group name is required." };
  if (v.length > LIMITS.GROUP_NAME_MAX) return { ok: false, error: `Max ${LIMITS.GROUP_NAME_MAX} chars.` };
  return { ok: true, value: v };
}

export function validateComment(raw) {
  const v = sanitizeText(raw);
  if (!v)                            return { ok: false, error: "Comment cannot be empty." };
  if (v.length > LIMITS.COMMENT_MAX) return { ok: false, error: `Max ${LIMITS.COMMENT_MAX} chars.` };
  return { ok: true, value: v };
}

export function validateStoryText(raw) {
  const v = sanitizeText(raw);
  if (v.length > LIMITS.STORY_TEXT_MAX) return { ok: false, error: `Max ${LIMITS.STORY_TEXT_MAX} chars.` };
  return { ok: true, value: v };
}

export function validateStickerUrl(url) {
  const ALLOWED = [
    "media.giphy.com", "media0.giphy.com", "media1.giphy.com",
    "media2.giphy.com", "media3.giphy.com", "media4.giphy.com",
    "firebasestorage.googleapis.com",
  ];
  const safe = sanitizeUrl(url, { allowedHosts: ALLOWED });
  if (!safe) return { ok: false, error: "Invalid sticker URL." };
  return { ok: true, value: safe };
}

export function validateImageFile(file) {
  if (!file) return { ok: false, error: "No file provided." };
  const maxBytes = FILE_BYTES(LIMITS.AVATAR_MAX_MB);
  if (file.size > maxBytes) return { ok: false, error: `File too large (max ${LIMITS.AVATAR_MAX_MB}MB).` };
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.type)) return { ok: false, error: "Only JPEG, PNG, GIF and WebP allowed." };
  return { ok: true, value: file };
}

export function validateAudioFile(file) {
  if (!file) return { ok: false, error: "No file provided." };
  if (file.size > FILE_BYTES(LIMITS.FILE_MAX_MB)) return { ok: false, error: `File too large (max ${LIMITS.FILE_MAX_MB}MB).` };
  const allowed = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"];
  if (!allowed.includes(file.type)) return { ok: false, error: "Invalid audio format." };
  return { ok: true, value: file };
}

/** Strip unexpected fields from an object */
export function pickFields(obj, allowedKeys) {
  if (typeof obj !== "object" || obj === null) return {};
  return allowedKeys.reduce((acc, k) => {
    if (Object.prototype.hasOwnProperty.call(obj, k)) acc[k] = obj[k];
    return acc;
  }, {});
}
