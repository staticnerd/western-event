import bcrypt from 'bcryptjs';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { checkLoginRate, resetLoginRate } from '../../../lib/ratelimit';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  const rate = checkLoginRate(ip);

  if (!rate.allowed) {
    return res.status(429).json({
      error: `Too many attempts. Try again in ${Math.ceil(rate.retryAfter / 60)} minutes.`
    });
  }

  const { username, password } = req.body || {};

  // Constant-time comparison to prevent timing attacks
  const storedUsername = process.env.ADMIN_USERNAME || 'admin';
  const storedHash     = process.env.ADMIN_PASSWORD_HASH || '';

  const userMatch = username === storedUsername;
  // Always run bcrypt even if username is wrong (prevents timing oracle)
  const passMatch = await bcrypt.compare(password || '', storedHash || '$2b$12$invalid_hash_padding_xxxxxxxx');

  if (!userMatch || !passMatch) {
    await new Promise(r => setTimeout(r, 400 + Math.random() * 200)); // jitter delay
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Success — create session
  resetLoginRate(ip); // clear attempts on success
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  session.admin = true;
  session.loginTime = Date.now();
  await session.save();

  return res.status(200).json({ ok: true });
}
