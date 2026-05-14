// Simple in-memory rate limiter for Vercel serverless.
// For production with high traffic, swap the store with
// @upstash/ratelimit + Upstash Redis (also free tier available).

const attempts = new Map(); // ip -> { count, resetAt }

const WINDOW_MS  = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN  = 10;              // max login attempts per window

export function checkLoginRate(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);

  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_LOGIN - 1 };
  }

  if (rec.count >= MAX_LOGIN) {
    const retryAfter = Math.ceil((rec.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  rec.count++;
  return { allowed: true, remaining: MAX_LOGIN - rec.count };
}

export function resetLoginRate(ip) {
  attempts.delete(ip);
}

// Cleanup old entries every 30 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of attempts.entries()) {
    if (now > rec.resetAt) attempts.delete(ip);
  }
}, 30 * 60 * 1000);
