// NOTE: On Vercel, environment variables can't be written to disk.
// Password changes update the env var via Vercel API or must be done
// in the Vercel dashboard. This endpoint validates the current password
// and returns the new hash for the admin to paste into Vercel env vars.
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.admin) return res.status(401).json({ error: 'Not authenticated' });

  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters' });

  const storedHash = process.env.ADMIN_PASSWORD_HASH || '';
  const match = await bcrypt.compare(currentPassword || '', storedHash);
  if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

  const newHash = await bcrypt.hash(newPassword, 12);

  // Return the new hash — admin copies it into Vercel env vars
  return res.status(200).json({
    ok: true,
    newHash,
    instruction: 'Copy this hash into your Vercel environment variable ADMIN_PASSWORD_HASH, then redeploy.'
  });
}
