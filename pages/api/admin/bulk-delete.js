import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { connectDB } from '../../../lib/db';
import { Media } from '../../../lib/models';
import { deleteMedia } from '../../../lib/cloudinary';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.admin) return res.status(401).json({ error: 'Not authenticated' });

  const { ids } = req.body || {};
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids array required' });

  await connectDB();
  const items = await Media.find({ _id: { $in: ids } }).select('publicId type');

  await Media.deleteMany({ _id: { $in: ids } });

  // Delete from Cloudinary in parallel
  await Promise.allSettled(
    items.map(i => deleteMedia(i.publicId, i.type === 'video' ? 'video' : 'image'))
  );

  return res.status(200).json({ ok: true, deleted: items.length });
}
