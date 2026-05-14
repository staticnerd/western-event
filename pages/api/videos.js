import { connectDB } from '../../lib/db';
import { Video } from '../../lib/models';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    await connectDB();
    const videos = await Video.find({ active: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(6)
      .select('youtubeId title description createdAt')
      .lean();

    res.setHeader('Cache-Control', 'no-store');

    return res.status(200).json({
      videos: videos.map(v => ({
        id:        v._id.toString(),
        youtubeId: v.youtubeId,
        title:     v.title || '',
        description: v.description || '',
        watchUrl:  `https://www.youtube.com/watch?v=${v.youtubeId}`,
        date:      v.createdAt,
      })),
    });
  } catch (e) {
    // Videos section is optional — return empty array on error, don't crash
    return res.status(200).json({ videos: [] });
  }
}
