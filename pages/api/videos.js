import { connectDB } from '../../lib/db';
import { Video } from '../../lib/models';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { category, featured, limit='10' } = req.query;

  try {
    await connectDB();
    const filter = { active: true };
    if (featured === 'true') filter.featured = true;
    if (category) filter.category = category;

    const videos = await Video.find(filter)
      .sort({ order:1, createdAt:-1 })
      .limit(parseInt(limit, 10))
      .select('youtubeId title description category featured createdAt')
      .lean();

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      videos: videos.map(v => ({
        id:          v._id.toString(),
        youtubeId:   v.youtubeId,
        title:       v.title       || '',
        description: v.description || '',
        category:    v.category    || 'general',
        featured:    v.featured    || false,
        thumbUrl:    `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`,
        watchUrl:    `https://www.youtube.com/watch?v=${v.youtubeId}`,
        embedUrl:    `https://www.youtube.com/embed/${v.youtubeId}?rel=0&modestbranding=1&playsinline=1`,
        date:        v.createdAt,
      })),
    });
  } catch(e) {
    console.error('[videos API]', e.message);
    return res.status(200).json({ videos: [] });
  }
}
