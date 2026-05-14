/**
 * Returns a Cloudinary signed upload signature.
 * Browser uses this to upload directly to Cloudinary — no file bytes through Vercel.
 */
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { cloudinary } from '../../../lib/cloudinary';

const VALID_CATS = [
  'birthday','babyshower','inhouse','kids',
  'haldi','mandap','reception','corporate'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.admin) return res.status(401).json({ error: 'Not authenticated' });

  const { category } = req.body || {};
  if (!VALID_CATS.includes(category))
    return res.status(400).json({ error: 'Invalid category' });

  try {
    const timestamp     = Math.round(Date.now() / 1000);
    const folder        = `wse/${category}`;
    const transformation = 'c_limit,w_1600,h_1600/q_auto:good';

    const paramsToSign = { timestamp, folder, transformation };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return res.status(200).json({
      signature,
      timestamp,
      folder,
      transformation,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey:    process.env.CLOUDINARY_API_KEY,
    });

  } catch (e) {
    console.error('[sign-upload error]', e.message);
    return res.status(500).json({ error: 'Could not generate signature: ' + e.message });
  }
}
