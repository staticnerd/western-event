import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '../../../lib/session';
import { connectDB } from '../../../lib/db';
import { Media } from '../../../lib/models';
import { uploadMedia } from '../../../lib/cloudinary';
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

const ALLOWED_MIME = [
  'image/jpeg','image/jpg','image/png','image/webp',
  'image/gif','image/heic','image/heif',
];
const VALID_CATS = [
  'birthday','babyshower','inhouse','kids',
  'haldi','mandap','reception','corporate'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // 1 — Auth
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.admin) return res.status(401).json({ error: 'Not authenticated' });

  // 2 — Parse multipart form
  const form = formidable({
    maxFileSize:  20 * 1024 * 1024, // 20 MB per photo
    maxFiles:     20,
    keepExtensions: true,
  });

  let fields, files;
  try {
    [fields, files] = await form.parse(req);
  } catch (e) {
    return res.status(400).json({ error: 'Upload parse error: ' + e.message });
  }

  // 3 — Validate category
  const category = Array.isArray(fields.category) ? fields.category[0] : fields.category;
  const caption  = Array.isArray(fields.caption)  ? fields.caption[0]  : (fields.caption || '');

  if (!category || !VALID_CATS.includes(category))
    return res.status(400).json({ error: 'Invalid or missing category' });

  // 4 — Collect uploaded files (formidable v3 wraps in arrays)
  const uploaded = [];
  const fileField = files.files;
  if (Array.isArray(fileField)) {
    uploaded.push(...fileField);
  } else if (fileField) {
    uploaded.push(fileField);
  }

  if (!uploaded.length)
    return res.status(400).json({ error: 'No files received' });

  // 5 — Process each file
  await connectDB();
  const results = [];
  const errors  = [];

  for (const file of uploaded) {
    const mime = file.mimetype || file.type || '';

    // Skip disallowed types
    if (!ALLOWED_MIME.includes(mime.toLowerCase())) {
      errors.push(`${file.originalFilename}: type ${mime} not allowed`);
      continue;
    }

    let buffer;
    try {
      buffer = fs.readFileSync(file.filepath);
    } catch (e) {
      errors.push(`${file.originalFilename}: could not read file`);
      continue;
    }

    try {
      // Upload to Cloudinary
      const cloud = await uploadMedia(buffer, mime, category);

      // Save to MongoDB
      const media = await Media.create({
        category,
        type:     'img',
        publicId: cloud.publicId,
        url:      cloud.url,
        thumb:    cloud.thumb,
        cap:      (caption || file.originalFilename || 'Event photo').slice(0, 120),
      });

      results.push({
        id:    media._id.toString(),
        thumb: cloud.thumb,
        cap:   media.cap,
      });

    } catch (e) {
      console.error('[upload error]', file.originalFilename, e.message);
      errors.push(`${file.originalFilename}: ${e.message}`);
    } finally {
      // Always clean up temp file
      try { fs.unlinkSync(file.filepath); } catch {}
    }
  }

  return res.status(200).json({
    ok:       results.length > 0,
    uploaded: results.length,
    items:    results,
    errors:   errors.length ? errors : undefined,
  });
}
