import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true, // always HTTPS
});

/**
 * Upload image buffer → Cloudinary.
 * Returns { publicId, url, thumb, type }
 */
export async function uploadMedia(fileBuffer, mimeType, category) {
  const folder = `wse/${category}`;

  return new Promise((resolve, reject) => {
    const opts = {
      folder,
      resource_type: 'image',
      // Store original + let Cloudinary serve optimised format on delivery
      quality:    'auto:good',
      fetch_format: 'auto',
      // Auto-orient from EXIF, strip metadata
      exif:             false,
      image_metadata:   false,
      // Cap dimensions — never upscale
      transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
    };

    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) return reject(new Error(`Cloudinary upload failed: ${err.message}`));

      // Build square thumbnail URL using Cloudinary URL generation
      // Use secure_url as base + add transformation params
      // This avoids the cloudinary.url() HTTP vs HTTPS issue entirely
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const pid = result.public_id;

      // Construct HTTPS thumbnail URL manually — reliable across all SDK versions
      const thumb = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,g_auto,h_400,w_400,f_webp,q_auto/${pid}`;
      const full  = result.secure_url; // always HTTPS because secure:true above

      resolve({
        publicId: pid,
        url:      full,
        thumb,
        type:     'img',
      });
    });

    stream.end(fileBuffer);
  });
}

export async function deleteMedia(publicId, resourceType = 'image') {
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (e) {
    console.error('Cloudinary delete error:', e.message);
  }
}
