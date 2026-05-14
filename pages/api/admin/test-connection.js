import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { connectDB } from '../../../lib/db';
import { v2 as cloudinary } from 'cloudinary';

const REQUIRED_VARS = [
  'MONGODB_URI',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD_HASH',
  'SESSION_SECRET',
];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const session = await getIronSession(req, res, SESSION_OPTIONS);
    if (!session.admin) return res.status(401).json({ error: 'Not authenticated' });
  } catch { return res.status(401).json({ error: 'Session error' }); }

  const envVars = Object.fromEntries(REQUIRED_VARS.map(k => [k, !!process.env[k]]));
  const envVarsOk = REQUIRED_VARS.every(k => !!process.env[k]);

  let mongodb    = { ok: false, message: 'Not tested' };
  let cld        = { ok: false, message: 'Not tested' };

  try {
    await connectDB();
    mongodb = { ok: true, message: 'Connected to MongoDB Atlas ✅' };
  } catch (e) {
    mongodb = { ok: false, message: e.message };
  }

  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure:     true,
    });
    await cloudinary.api.ping();
    cld = { ok: true, message: 'Cloudinary credentials valid ✅', cloudName: process.env.CLOUDINARY_CLOUD_NAME };
  } catch (e) {
    cld = { ok: false, message: e.message };
  }

  return res.status(200).json({
    allOk:     envVarsOk && mongodb.ok && cld.ok,
    envVars,
    envVarsOk,
    mongodb,
    cloudinary: cld,
  });
}
