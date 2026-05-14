import { connectDB } from '../../../lib/db';
import { Media } from '../../../lib/models';

const VALID_CATS = [
  'birthday','babyshower','inhouse','kids',
  'haldi','mandap','reception','corporate'
];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { category } = req.query;

  if (!VALID_CATS.includes(category))
    return res.status(400).json({ error: 'Invalid category' });

  if (!process.env.MONGODB_URI) {
    return res.status(500).json({
      error: 'MONGODB_URI not configured. Add it in Vercel Dashboard → Settings → Environment Variables, then redeploy.'
    });
  }

  try {
    await connectDB();

    const items = await Media
      .find({ category })
      .sort({ createdAt: -1 })
      .select('type url thumb cap createdAt')
      .lean();

    res.setHeader('Cache-Control', 'no-store');

    return res.status(200).json({
      category,
      count: items.length,
      items: items.map(i => ({
        id:    i._id.toString(),
        type:  i.type || 'img',
        src:   i.url,
        thumb: i.thumb || i.url,
        cap:   i.cap || '',
        date:  i.createdAt,
      })),
    });

  } catch (e) {
    console.error('[gallery]', e.message);
    return res.status(500).json({ error: 'Gallery load failed: ' + e.message });
  }
}
