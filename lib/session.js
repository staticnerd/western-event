// iron-session stores the session in an encrypted, signed cookie.
// There is NO server-side session store — it's all in the cookie.
// The secret never leaves the server. The cookie is httpOnly + sameSite=strict.
// Vercel-compatible: no Redis/DB needed for sessions.

export const SESSION_OPTIONS = {
  cookieName: 'wse_admin',
  password:   process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production-32c',
  cookieOptions: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge:   4 * 60 * 60, // 4 hours in seconds
  },
};

// Helper used by API routes
export function getSessionOptions() {
  return SESSION_OPTIONS;
}
