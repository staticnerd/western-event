import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { connectDB } from '../../../lib/db';
import { cloudinary } from '../../../lib/cloudinary';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.admin) return res.status(401).json({ error: 'Not authenticated' });

  const results = {};

  // 1 — Check all required env vars exist
  const required = [
    'MONGODB_URI',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD_HASH',
    'SESSION_SECRET',
  ];
  results.envVars = Object.fromEntries(
    required.map(k => [k, !!process.env[k]])
  );
  results.envVarsOk = required.every(k => !!process.env[k]);

  // 2 — Test MongoDB
  try {
    await connectDB();
    results.mongodb = { ok: true, message: 'Connected to MongoDB Atlas' };
  } catch (e) {
    results.mongodb = { ok: false, message: e.message };
  }

  // 3 — Test Cloudinary
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure:     true,
    });
    await cloudinary.api.ping();
    results.cloudinary = {
      ok:        true,
      message:   'Cloudinary credentials valid',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    };
  } catch (e) {
    results.cloudinary = { ok: false, message: e.message };
  }

  const allOk = results.envVarsOk && results.mongodb?.ok && results.cloudinary?.ok;
  return res.status(200).json({ allOk, ...results });
}
