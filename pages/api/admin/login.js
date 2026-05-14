import bcrypt from 'bcryptjs';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { checkLoginRate, resetLoginRate } from '../../../lib/ratelimit';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
             req.socket?.remoteAddress || 'unknown';
  const rate = checkLoginRate(ip);

  if (!rate.allowed) {
    return res.status(429).json({
      error: `Too many login attempts. Try again in ${Math.ceil(rate.retryAfter / 60)} minutes.`
    });
  }

  const { username = '', password = '' } = req.body || {};

  const storedUser = process.env.ADMIN_USERNAME || 'admin';
  const storedHash = process.env.ADMIN_PASSWORD_HASH || '';

  // Always run bcrypt to prevent timing attacks
  const passOk = await bcrypt.compare(
    password,
    storedHash || '$2b$12$invalidhashpadding000000000000000000000000000'
  );
  const userOk = username === storedUser;

  if (!userOk || !passOk) {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  resetLoginRate(ip);

  const session = await getIronSession(req, res, SESSION_OPTIONS);
  session.admin     = true;
  session.loginTime = Date.now();
  await session.save();

  return res.status(200).json({ ok: true });
}
