import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

/**
 * Generate a signed upload signature.
 * Used by the sign-upload API route.
 */
export function generateSignature(paramsToSign) {
  return cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Delete media from Cloudinary by public_id.
 */
export async function deleteMedia(publicId, resourceType = 'image') {
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (e) {
    console.error('Cloudinary delete error:', e.message);
  }
}

/**
 * Ping Cloudinary to test credentials.
 */
export async function pingCloudinary() {
  return cloudinary.api.ping();
}

export { cloudinary };
