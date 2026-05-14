import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { connectDB } from '../../../lib/db';
import { v2 as cloudinary } from 'cloudinary';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // Must be admin
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.admin) return res.status(401).json({ error: 'Not authenticated' });

  const results = {};

  // 1 — Check env vars exist
  results.envVars = {
    MONGODB_URI:              !!process.env.MONGODB_URI,
    CLOUDINARY_CLOUD_NAME:    !!process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY:       !!process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET:    !!process.env.CLOUDINARY_API_SECRET,
    ADMIN_USERNAME:           !!process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD_HASH:      !!process.env.ADMIN_PASSWORD_HASH,
    SESSION_SECRET:           !!process.env.SESSION_SECRET,
  };

  const allEnvSet = Object.values(results.envVars).every(Boolean);
  results.envVarsOk = allEnvSet;

  // 2 — Test MongoDB connection
  try {
    await connectDB();
    results.mongodb = { ok: true, message: 'Connected successfully' };
  } catch (e) {
    results.mongodb = { ok: false, message: e.message };
  }

  // 3 — Test Cloudinary connection (ping their API)
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure:     true,
    });
    await cloudinary.api.ping();
    results.cloudinary = { ok: true, message: 'Connected successfully', cloudName: process.env.CLOUDINARY_CLOUD_NAME };
  } catch (e) {
    results.cloudinary = { ok: false, message: e.message };
  }

  const allOk = results.envVarsOk && results.mongodb?.ok && results.cloudinary?.ok;
  return res.status(200).json({ allOk, ...results });
}
