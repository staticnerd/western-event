export const SESSION_OPTIONS = {
  cookieName: 'wse_sid',
  password: process.env.SESSION_SECRET ||
    'dev-fallback-secret-must-be-32-chars-min!!',
  cookieOptions: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge:   60 * 60 * 4, // 4 hours in seconds
  },
};
