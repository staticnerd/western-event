import mongoose from 'mongoose';

// Don't throw at module load — throw lazily inside connectDB()
// This prevents cold-start crashes when env var is missing

let cached = global._mongoose_cache;
if (!cached) cached = global._mongoose_cache = { conn: null, promise: null };

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. ' +
      'Go to Vercel Dashboard → Your Project → Settings → Environment Variables ' +
      'and add MONGODB_URI, then click Redeploy.'
    );
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands:    false,
      serverSelectionTimeoutMS: 8000, // fail fast — don't hang 30s
      connectTimeoutMS:         8000,
    }).catch(err => {
      // Reset cache so next request retries
      cached.promise = null;
      cached.conn    = null;
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
