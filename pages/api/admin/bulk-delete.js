import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { connectDB } from '../../../lib/db';
import { Media } from '../../../lib/models';
import { v2 as cloudinary } from 'cloudinary';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();

  try {
    const session = await getIronSession(req, res, SESSION_OPTIONS);
    if (!session.admin) return res.status(401).json({ error: 'Not authenticated' });
  } catch { return res.status(401).json({ error: 'Session error' }); }

  const { ids } = req.body || {};
  if (!Array.isArray(ids) || !ids.length)
    return res.status(400).json({ error: 'ids array required' });

  await connectDB();
  const items = await Media.find({ _id: { $in: ids } }).select('publicId').lean();
  await Media.deleteMany({ _id: { $in: ids } });

  // Delete from Cloudinary
  if (items.length && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    await Promise.allSettled(
      items.map(i => cloudinary.uploader.destroy(i.publicId))
    );
  }

  return res.status(200).json({ ok: true, deleted: items.length });
}
