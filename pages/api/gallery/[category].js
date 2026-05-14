import { connectDB } from '../../../lib/db';
import { Media } from '../../../lib/models';

const VALID_CATS = ['birthday','babyshower','inhouse','kids','haldi','mandap','reception','corporate'];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { category } = req.query;
  if (!VALID_CATS.includes(category))
    return res.status(400).json({ error: 'Invalid category' });

  await connectDB();
  const items = await Media.find({ category })
    .sort({ createdAt: -1 })
    .select('type url thumb cap createdAt');

  // Cache for 60 seconds on CDN edge (fast for visitors, fresh for admin uploads)
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return res.status(200).json({
    category,
    items: items.map(i => ({
      id:    i._id,
      type:  i.type,
      src:   i.url,
      thumb: i.thumb || i.url,
      cap:   i.cap,
      date:  i.createdAt,
    }))
  });
}
