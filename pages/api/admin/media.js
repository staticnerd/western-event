import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { connectDB } from '../../../lib/db';
import { Media } from '../../../lib/models';
import { deleteMedia } from '../../../lib/cloudinary';

const VALID_CATS = ['birthday','babyshower','inhouse','kids','haldi','mandap','reception','corporate'];

async function requireAdmin(req, res) {
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.admin) { res.status(401).json({ error: 'Not authenticated' }); return false; }
  return true;
}

export default async function handler(req, res) {
  if (!await requireAdmin(req, res)) return;
  await connectDB();

  // GET — list media (optionally filter by category)
  if (req.method === 'GET') {
    const { category, limit = 200 } = req.query;
    const filter = category && VALID_CATS.includes(category) ? { category } : {};
    const items = await Media.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .select('-__v');
    return res.status(200).json({ items });
  }

  // PATCH — edit caption or move category
  if (req.method === 'PATCH') {
    const { id, caption, category } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    const update = {};
    if (caption !== undefined) update.cap = String(caption).slice(0, 120);
    if (category && VALID_CATS.includes(category)) update.category = category;
    await Media.findByIdAndUpdate(id, update);
    return res.status(200).json({ ok: true });
  }

  // DELETE — single item
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    const item = await Media.findByIdAndDelete(id);
    if (item) {
      await deleteMedia(item.publicId, item.type === 'video' ? 'video' : 'image').catch(() => {});
    }
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
