import { connectDB } from '../../lib/db';
import { Video } from '../../lib/models';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  await connectDB();

  const videos = await Video.find({ active: true })
    .sort({ order: 1, createdAt: -1 })
    .limit(6)  // fetch up to 6, site shows 3-4
    .select('youtubeId title description createdAt');

  // Light CDN caching — videos don't change every second
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');

  return res.status(200).json({
    videos: videos.map(v => ({
      id:          v._id,
      youtubeId:   v.youtubeId,
      title:       v.title,
      description: v.description,
      embedUrl:    `https://www.youtube.com/embed/${v.youtubeId}?rel=0&modestbranding=1&showinfo=0`,
      thumbUrl:    `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`,
      watchUrl:    `https://www.youtube.com/watch?v=${v.youtubeId}`,
      date:        v.createdAt,
    }))
  });
}
