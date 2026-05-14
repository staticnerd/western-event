import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';

export default async function handler(req, res) {
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (session.admin === true) return res.status(200).json({ ok: true });
  return res.status(401).json({ error: 'Not authenticated' });
}
