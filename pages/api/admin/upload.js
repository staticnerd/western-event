import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { connectDB } from '../../../lib/db';
import { Media } from '../../../lib/models';
import { uploadMedia } from '../../../lib/cloudinary';
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

const ALLOWED_MIME = [
  'image/jpeg','image/png','image/webp','image/gif','image/heic',
  'video/mp4','video/quicktime','video/webm','video/x-msvideo',
];
const VALID_CATS = ['birthday','babyshower','inhouse','kids','haldi','mandap','reception','corporate'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Auth check
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.admin) return res.status(401).json({ error: 'Not authenticated' });

  // Parse multipart form
  const form = formidable({ maxFileSize: 200 * 1024 * 1024, maxFiles: 20 });
  let fields, files;
  try {
    [fields, files] = await form.parse(req);
  } catch (e) {
    return res.status(400).json({ error: 'Form parse error: ' + e.message });
  }

  const category = Array.isArray(fields.category) ? fields.category[0] : fields.category;
  const caption  = Array.isArray(fields.caption)  ? fields.caption[0]  : (fields.caption || '');

  if (!VALID_CATS.includes(category)) return res.status(400).json({ error: 'Invalid category' });

  const uploadedFiles = Array.isArray(files.files) ? files.files : (files.files ? [files.files] : []);
  if (!uploadedFiles.length) return res.status(400).json({ error: 'No files provided' });

  await connectDB();
  const results = [];

  for (const file of uploadedFiles) {
    if (!ALLOWED_MIME.includes(file.mimetype)) continue;

    try {
      const buffer = fs.readFileSync(file.filepath);
      const cloud  = await uploadMedia(buffer, file.mimetype, category);

      const media = await Media.create({
        category,
        type:     cloud.type,
        publicId: cloud.publicId,
        url:      cloud.url,
        thumb:    cloud.thumb,
        cap:      (caption || file.originalFilename || '').slice(0, 120),
      });

      results.push({ id: media._id, type: media.type, cap: media.cap });
    } catch (e) {
      console.error('Upload error:', e.message);
    } finally {
      // Clean up temp file
      try { fs.unlinkSync(file.filepath); } catch {}
    }
  }

  return res.status(200).json({ ok: true, uploaded: results.length, items: results });
}
