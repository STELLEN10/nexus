// src/lib/rateLimiter.js
// Client-side rate limiting using in-memory sliding window.
// Prevents burst abuse from a single user/session.
// Note: real enforcement MUST also be done in Firebase Security Rules.

const windows = new Map(); // key → [ timestamp, ... ]

/**
 * Check if an action is allowed under a rate limit.
 *
 * @param {string} key      - Unique key e.g. "send-message:uid123"
 * @param {number} maxCalls - Max calls allowed in the window
 * @param {number} windowMs - Window size in milliseconds
 * @returns {{ allowed: boolean, retryAfterMs: number }}
 */
export function checkRateLimit(key, maxCalls, windowMs) {
  const now = Date.now();
  const timestamps = (windows.get(key) || []).filter(t => now - t < windowMs);

  if (timestamps.length >= maxCalls) {
    const oldest = timestamps[0];
    const retryAfterMs = windowMs - (now - oldest);
    return { allowed: false, retryAfterMs };
  }

  timestamps.push(now);
  windows.set(key, timestamps);
  return { allowed: true, retryAfterMs: 0 };
}

/** Clear a rate limit key (e.g. after successful auth) */
export function clearRateLimit(key) {
  windows.delete(key);
}

// ── Pre-configured limiters ───────────────────────────────────

/** 5 auth attempts per 10 minutes */
export function checkAuthLimit(identifier) {
  return checkRateLimit(`auth:${identifier}`, 5, 10 * 60 * 1000);
}

/** 30 messages per minute per user */
export function checkMessageLimit(uid) {
  return checkRateLimit(`msg:${uid}`, 30, 60 * 1000);
}

/** 10 posts per hour per user */
export function checkPostLimit(uid) {
  return checkRateLimit(`post:${uid}`, 10, 60 * 60 * 1000);
}

/** 5 stories per hour per user */
export function checkStoryLimit(uid) {
  return checkRateLimit(`story:${uid}`, 5, 60 * 60 * 1000);
}

/** 20 reactions per minute per user */
export function checkReactionLimit(uid) {
  return checkRateLimit(`react:${uid}`, 20, 60 * 1000);
}

/** 10 DM requests per hour per user */
export function checkDMRequestLimit(uid) {
  return checkRateLimit(`dmreq:${uid}`, 10, 60 * 60 * 1000);
}

/** 5 room creations per hour per user */
export function checkRoomCreateLimit(uid) {
  return checkRateLimit(`room:${uid}`, 5, 60 * 60 * 1000);
}

/** 3 avatar uploads per hour per user */
export function checkAvatarUploadLimit(uid) {
  return checkRateLimit(`avatar:${uid}`, 3, 60 * 60 * 1000);
}

/** 20 Giphy searches per minute (API quota protection) */
export function checkGiphyLimit(uid) {
  return checkRateLimit(`giphy:${uid}`, 20, 60 * 1000);
}

/**
 * Format a human-readable retry message.
 * @param {number} ms
 */
export function formatRetryAfter(ms) {
  if (ms < 60000) return `${Math.ceil(ms / 1000)} seconds`;
  return `${Math.ceil(ms / 60000)} minutes`;
}
