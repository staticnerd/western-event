import { connectDB } from '../../lib/db';
import { Media } from '../../lib/models';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    await connectDB();

    // Fetch the latest 8 photos across ALL categories, sorted by upload time
    const photos = await Media.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .select('type url thumb cap category createdAt')
      .lean();

    res.setHeader('Cache-Control', 'no-store');

    return res.status(200).json({
      photos: photos.map(p => ({
        id:       p._id.toString(),
        src:      p.url,
        thumb:    p.thumb || p.url,
        cap:      p.cap || '',
        category: p.category,
        date:     p.createdAt,
      })),
    });

  } catch (e) {
    // Return empty array — home page works fine without this section
    console.error('[recent-photos]', e.message);
    return res.status(200).json({ photos: [] });
  }
}
