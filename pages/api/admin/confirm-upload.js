/**
 * Step 2 of 2-step upload:
 * After the browser uploads directly to Cloudinary, it calls this endpoint
 * with the Cloudinary response. We save the media record to MongoDB.
 */
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

  // Must be logged in as admin
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.admin) return res.status(401).json({ error: 'Not authenticated' });

  const { publicId, secureUrl, category, caption } = req.body || {};

  if (!publicId || !secureUrl)
    return res.status(400).json({ error: 'publicId and secureUrl are required' });

  if (!VALID_CATS.includes(category))
    return res.status(400).json({ error: 'Invalid category' });

  try {
    await connectDB();

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    // Build HTTPS square thumbnail URL via Cloudinary URL transformations
    const thumb = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,g_auto,h_400,w_400,f_webp,q_auto/${publicId}`;

    const media = await Media.create({
      category,
      type:     'img',
      publicId,
      url:      secureUrl,
      thumb,
      cap:      (caption || 'Event photo').slice(0, 120),
    });

    return res.status(201).json({
      ok:  true,
      id:  media._id.toString(),
      thumb,
      cap: media.cap,
    });

  } catch (e) {
    console.error('[confirm-upload error]', e.message);
    return res.status(500).json({ error: 'Failed to save to database: ' + e.message });
  }
}
