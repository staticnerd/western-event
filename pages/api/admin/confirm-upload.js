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

  // ── Auth ──────────────────────────────────────────────────────
  try {
    const session = await getIronSession(req, res, SESSION_OPTIONS);
    if (!session.admin) return res.status(401).json({ error: 'Not authenticated' });
  } catch (e) {
    return res.status(401).json({ error: 'Session error: ' + e.message });
  }

  // ── Validate body ─────────────────────────────────────────────
  const body = req.body || {};
  const { publicId, secureUrl, category, caption } = body;

  if (!publicId)
    return res.status(400).json({ error: 'publicId is required (Cloudinary public_id)' });
  if (!secureUrl)
    return res.status(400).json({ error: 'secureUrl is required (Cloudinary secure_url)' });
  if (!VALID_CATS.includes(category))
    return res.status(400).json({
      error: `Invalid category "${category}". Must be one of: ${VALID_CATS.join(', ')}`
    });

  // ── Check env vars before hitting DB ─────────────────────────
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({
      error: 'MONGODB_URI env var not set. Vercel Dashboard → Settings → Environment Variables → add MONGODB_URI → Redeploy.'
    });
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return res.status(500).json({
      error: 'CLOUDINARY_CLOUD_NAME env var not set.'
    });
  }

  // ── Save to MongoDB ───────────────────────────────────────────
  try {
    await connectDB();

    const cn    = process.env.CLOUDINARY_CLOUD_NAME;
    const thumb = `https://res.cloudinary.com/${cn}/image/upload/c_fill,g_auto,h_400,w_400,f_webp,q_auto/${publicId}`;
    const cap   = String(caption || 'Event photo').trim().slice(0, 120) || 'Event photo';

    const media = await Media.create({
      category,
      type:     'img',
      publicId,
      url:      secureUrl,
      thumb,
      cap,
    });

    return res.status(201).json({
      ok:    true,
      id:    media._id.toString(),
      thumb,
      cap:   media.cap,
    });

  } catch (e) {
    // Detailed error message so we can diagnose
    const msg = e.message || String(e);
    console.error('[confirm-upload DB error]', msg);

    // Give actionable feedback for common MongoDB errors
    let friendly = 'Database save failed: ' + msg;

    if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
      friendly = 'Cannot connect to MongoDB. Check that MONGODB_URI is correct and that MongoDB Atlas Network Access allows 0.0.0.0/0 (all IPs).';
    } else if (msg.includes('Authentication failed') || msg.includes('bad auth')) {
      friendly = 'MongoDB authentication failed. Check the username and password in your MONGODB_URI.';
    } else if (msg.includes('timed out') || msg.includes('timeout')) {
      friendly = 'MongoDB connection timed out. In MongoDB Atlas → Network Access, make sure you have added 0.0.0.0/0 to allow Vercel\'s dynamic IPs.';
    } else if (msg.includes('validation failed')) {
      friendly = 'Data validation error: ' + msg;
    }

    return res.status(500).json({ error: friendly });
  }
}
