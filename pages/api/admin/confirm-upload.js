import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { connectDB } from '../../../lib/db';
import { Media } from '../../../lib/models';

const VALID_CATS = [
  'birthday','babyshower','inhouse','kids',
  'haldi','mandap','reception','corporate'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const session = await getIronSession(req, res, SESSION_OPTIONS);
    if (!session.admin) return res.status(401).json({ error: 'Not authenticated' });
  } catch(e) {
    return res.status(401).json({ error: 'Session error' });
  }

  const { publicId, secureUrl, category, caption } = req.body || {};

  if (!publicId)   return res.status(400).json({ error: 'publicId is required' });
  if (!secureUrl)  return res.status(400).json({ error: 'secureUrl is required' });
  if (!VALID_CATS.includes(category))
    return res.status(400).json({ error: 'Invalid category' });

  if (!process.env.MONGODB_URI) {
    return res.status(500).json({
      error: 'MONGODB_URI environment variable not set. Add it in Vercel Dashboard → Settings → Environment Variables then redeploy.'
    });
  }

  try {
    await connectDB();

    const cn    = process.env.CLOUDINARY_CLOUD_NAME;
    const thumb = `https://res.cloudinary.com/${cn}/image/upload/c_fill,g_auto,h_400,w_400,f_webp,q_auto/${publicId}`;

    const media = await Media.create({
      category,
      type:     'img',
      publicId,
      url:      secureUrl,
      thumb,
      cap:      String(caption || 'Event photo').slice(0, 120),
    });

    return res.status(201).json({
      ok:    true,
      id:    media._id.toString(),
      thumb,
      cap:   media.cap,
    });

  } catch (e) {
    console.error('[confirm-upload]', e.message);
    return res.status(500).json({ error: 'Database save failed: ' + e.message });
  }
}
