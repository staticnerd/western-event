/**
 * Returns a Cloudinary signed upload signature.
 * Browser uses this to upload directly to Cloudinary.
 * Files never pass through Vercel — no 4.5MB limit.
 *
 * IMPORTANT: The params signed here must EXACTLY match
 * what the browser sends to Cloudinary. We sign only:
 *   { timestamp, folder }
 * Browser also sends: file, api_key, signature — those are NOT signed.
 */
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { v2 as cloudinary } from 'cloudinary';

const VALID_CATS = [
  'birthday','babyshower','inhouse','kids',
  'haldi','mandap','reception','corporate'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Auth
  try {
    const session = await getIronSession(req, res, SESSION_OPTIONS);
    if (!session.admin) return res.status(401).json({ error: 'Not authenticated' });
  } catch (e) {
    return res.status(401).json({ error: 'Session error: ' + e.message });
  }

  const { category } = req.body || {};
  if (!category || !VALID_CATS.includes(category))
    return res.status(400).json({ error: 'Invalid or missing category' });

  // Check env vars
  const cn  = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const sec = process.env.CLOUDINARY_API_SECRET;

  if (!cn || !key || !sec) {
    return res.status(500).json({
      error: 'Cloudinary env vars not set. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in Vercel → Settings → Environment Variables, then redeploy.'
    });
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder    = `wse/${category}`;

    // Sign ONLY the params the browser will include in the upload FormData
    // (besides file, api_key, and signature itself)
    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, sec);

    return res.status(200).json({
      ok:        true,
      signature,
      timestamp,
      folder,
      cloudName: cn,
      apiKey:    key,
    });

  } catch (e) {
    console.error('[sign-upload]', e.message);
    return res.status(500).json({ error: 'Failed to generate signature: ' + e.message });
  }
}
