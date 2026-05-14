import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a file buffer to Cloudinary.
 * Images are auto-resized, stripped of EXIF, converted to WebP.
 * Videos are stored as-is (Cloudinary transcodes on delivery).
 */
export async function uploadMedia(fileBuffer, mimeType, category) {
  const isVideo = mimeType.startsWith('video/');
  const folder  = `wse/${category}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: isVideo ? 'video' : 'image',
        // For images: auto-format (WebP for modern browsers), quality auto
        ...(isVideo ? {} : {
          format:           'webp',
          quality:          'auto:good',
          fetch_format:     'auto',
          // Strip EXIF / auto-orient
          exif:             false,
          image_metadata:   false,
          // Cap at 1600px wide, keep aspect ratio
          transformation: [
            { width: 1600, crop: 'limit' },
          ],
        }),
      },
      (err, result) => {
        if (err) return reject(err);

        // Build a square thumbnail URL via Cloudinary transformations
        // This is the KEY trick: thumbnail is always 400x400 crop, regardless of original
        const thumbUrl = isVideo
          ? cloudinary.url(result.public_id, {
              resource_type: 'video',
              transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'auto' }],
              format: 'jpg',
            })
          : cloudinary.url(result.public_id, {
              transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'auto' }],
              format: 'webp',
            });

        resolve({
          publicId: result.public_id,
          url:      result.secure_url,
          thumb:    thumbUrl,
          type:     isVideo ? 'video' : 'img',
        });
      }
    );
    stream.end(fileBuffer);
  });
}

export async function deleteMedia(publicId, resourceType = 'image') {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
