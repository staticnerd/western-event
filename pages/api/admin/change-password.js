import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const session = await getIronSession(req, res, SESSION_OPTIONS);
    if (!session.admin) return res.status(401).json({ error: 'Not authenticated' });
  } catch { return res.status(401).json({ error: 'Session error' }); }

  const { currentPassword = '', newPassword = '' } = req.body || {};

  if (newPassword.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });

  const storedHash = process.env.ADMIN_PASSWORD_HASH || '';
  const match = await bcrypt.compare(currentPassword, storedHash || '$2b$12$x');

  if (!match)
    return res.status(401).json({ error: 'Current password is incorrect.' });

  const newHash = await bcrypt.hash(newPassword, 12);

  return res.status(200).json({
    ok: true,
    newHash,
    instruction: 'Copy this hash → Vercel Dashboard → Settings → Environment Variables → ADMIN_PASSWORD_HASH → Save → Redeploy.',
  });
}
