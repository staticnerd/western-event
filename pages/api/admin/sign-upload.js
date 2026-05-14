import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { v2 as cloudinary } from 'cloudinary';

const VALID_CATS = [
  'birthday','babyshower','inhouse','kids',
  'haldi','mandap','reception','corporate'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Auth check
  try {
    const session = await getIronSession(req, res, SESSION_OPTIONS);
    if (!session.admin) return res.status(401).json({ error: 'Not authenticated' });
  } catch(e) {
    return res.status(401).json({ error: 'Session error: ' + e.message });
  }

  const { category } = req.body || {};
  if (!category || !VALID_CATS.includes(category))
    return res.status(400).json({ error: 'Invalid or missing category' });

  // Validate env vars exist
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return res.status(500).json({
      error: 'Cloudinary environment variables not set. Go to Vercel Dashboard → Settings → Environment Variables and add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET then redeploy.'
    });
  }

  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure:     true,
    });

    const timestamp = Math.round(Date.now() / 1000);
    const folder    = `wse/${category}`;

    // Only sign params we actually send to Cloudinary
    const paramsToSign = { timestamp, folder };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return res.status(200).json({
      ok:        true,
      signature,
      timestamp,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey:    process.env.CLOUDINARY_API_KEY,
    });

  } catch (e) {
    console.error('[sign-upload]', e.message);
    return res.status(500).json({ error: 'Signature generation failed: ' + e.message });
  }
}
