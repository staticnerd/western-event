import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { connectDB } from '../../../lib/db';
import { Video } from '../../../lib/models';

// Extract YouTube video ID from any YouTube URL format
function extractYoutubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function requireAdmin(req, res) {
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.admin) { res.status(401).json({ error: 'Not authenticated' }); return false; }
  return true;
}

export default async function handler(req, res) {
  await connectDB();

  // GET — public + admin can fetch videos
  if (req.method === 'GET') {
    const { limit = 10, activeOnly = 'true' } = req.query;
    const filter = activeOnly === 'true' ? { active: true } : {};
    const videos = await Video.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .limit(Number(limit))
      .select('-__v');
    return res.status(200).json({ videos });
  }

  // All write operations require admin
  if (!await requireAdmin(req, res)) return;

  // POST — add new video
  if (req.method === 'POST') {
    const { youtubeUrl, title, description } = req.body || {};
    if (!youtubeUrl) return res.status(400).json({ error: 'YouTube URL is required' });

    const youtubeId = extractYoutubeId(youtubeUrl);
    if (!youtubeId) return res.status(400).json({ error: 'Invalid YouTube URL. Please use a valid YouTube link.' });

    // Check for duplicate
    const exists = await Video.findOne({ youtubeId });
    if (exists) return res.status(400).json({ error: 'This video is already added.' });

    // Count existing to set order
    const count = await Video.countDocuments();

    const video = await Video.create({
      youtubeUrl,
      youtubeId,
      title:       (title || '').slice(0, 120),
      description: (description || '').slice(0, 300),
      order:       count,
    });

    return res.status(201).json({ ok: true, video });
  }

  // PATCH — edit title / description / active / order
  if (req.method === 'PATCH') {
    const { id, title, description, active, order } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    const update = {};
    if (title       !== undefined) update.title       = String(title).slice(0, 120);
    if (description !== undefined) update.description = String(description).slice(0, 300);
    if (active      !== undefined) update.active      = Boolean(active);
    if (order       !== undefined) update.order       = Number(order);
    await Video.findByIdAndUpdate(id, update);
    return res.status(200).json({ ok: true });
  }

  // DELETE — remove video
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    await Video.findByIdAndDelete(id);
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
