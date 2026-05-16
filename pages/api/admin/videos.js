import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { connectDB } from '../../../lib/db';
import { Video } from '../../../lib/models';

const VALID_CATS = [
  'birthday','babyshower','inhouse','kids',
  'haldi','mandap','reception','corporate','general'
];

function extractYoutubeId(url) {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /embed\/([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = String(url).match(p);
    if (m) return m[1];
  }
  return null;
}

async function auth(req, res) {
  try {
    const s = await getIronSession(req, res, SESSION_OPTIONS);
    return s.admin === true;
  } catch { return false; }
}

export default async function handler(req, res) {
  await connectDB();

  // ── Public GET ─────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { limit='20', activeOnly='true', category, featured } = req.query;
    const filter = {};
    if (activeOnly === 'true') filter.active = true;
    if (category && VALID_CATS.includes(category)) filter.category = category;
    if (featured === 'true') filter.featured = true;

    const videos = await Video.find(filter)
      .sort({ order:1, createdAt:-1 })
      .limit(parseInt(limit, 10))
      .lean();

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ videos });
  }

  if (!await auth(req, res))
    return res.status(401).json({ error: 'Not authenticated' });

  // ── POST — add new video ────────────────────────────────────────
  if (req.method === 'POST') {
    const { youtubeUrl, title, description, category='general', featured=false } = req.body || {};
    if (!youtubeUrl) return res.status(400).json({ error: 'YouTube URL is required' });

    const youtubeId = extractYoutubeId(youtubeUrl);
    if (!youtubeId)
      return res.status(400).json({
        error: 'Could not find a valid YouTube video ID. Please paste a regular youtube.com/watch or youtu.be link.'
      });

    const exists = await Video.findOne({ youtubeId });
    if (exists) return res.status(400).json({ error: 'This video is already added.' });

    const count = await Video.countDocuments();
    const video = await Video.create({
      youtubeUrl, youtubeId,
      title:       String(title       || '').slice(0, 120),
      description: String(description || '').slice(0, 300),
      category:    VALID_CATS.includes(category) ? category : 'general',
      featured:    Boolean(featured),
      order:       count,
    });
    return res.status(201).json({ ok: true, video });
  }

  // ── PATCH — update video ────────────────────────────────────────
  if (req.method === 'PATCH') {
    const { id, title, description, active, featured, category, order } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    const upd = {};
    if (title       !== undefined) upd.title       = String(title).slice(0,120);
    if (description !== undefined) upd.description = String(description).slice(0,300);
    if (active      !== undefined) upd.active      = Boolean(active);
    if (featured    !== undefined) upd.featured    = Boolean(featured);
    if (order       !== undefined) upd.order       = Number(order);
    if (category && VALID_CATS.includes(category)) upd.category = category;
    await Video.findByIdAndUpdate(id, upd);
    return res.status(200).json({ ok: true });
  }

  // ── DELETE ──────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    await Video.findByIdAndDelete(id);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
