import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { connectDB } from '../../../lib/db';
import { Media } from '../../../lib/models';
import { v2 as cloudinary } from 'cloudinary';

const VALID_CATS = [
  'birthday','babyshower','inhouse','kids',
  'haldi','mandap','reception','corporate'
];

async function auth(req, res) {
  try {
    const session = await getIronSession(req, res, SESSION_OPTIONS);
    return session.admin === true;
  } catch { return false; }
}

export default async function handler(req, res) {
  if (!await auth(req, res))
    return res.status(401).json({ error: 'Not authenticated' });

  await connectDB();

  // GET — list items
  if (req.method === 'GET') {
    const { category, limit = '200' } = req.query;
    const filter = category && VALID_CATS.includes(category) ? { category } : {};
    const items = await Media.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .lean();
    return res.status(200).json({ items });
  }

  // PATCH — edit caption / move category
  if (req.method === 'PATCH') {
    const { id, caption, category } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    const upd = {};
    if (caption  !== undefined) upd.cap      = String(caption).slice(0,120);
    if (category && VALID_CATS.includes(category)) upd.category = category;
    await Media.findByIdAndUpdate(id, upd);
    return res.status(200).json({ ok: true });
  }

  // DELETE — single item
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    const item = await Media.findByIdAndDelete(id);
    if (item?.publicId) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:    process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
      await cloudinary.uploader.destroy(item.publicId).catch(() => {});
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
