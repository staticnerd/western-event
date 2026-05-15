/**
 * This route is no longer used.
 * Uploads now use the 2-step direct-to-Cloudinary flow:
 *   POST /api/admin/sign-upload    → get signature
 *   POST /api/admin/confirm-upload → save to DB
 *
 * This file exists only to prevent "Module not found" build errors
 * from old cached versions in Git.
 */
export default function handler(req, res) {
  return res.status(410).json({
    error: 'This upload route is deprecated. The admin panel uses /api/admin/sign-upload and /api/admin/confirm-upload instead.',
  });
}
