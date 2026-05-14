import mongoose from 'mongoose';

// ── Media (photos) ───────────────────────────────────────────────
const MediaSchema = new mongoose.Schema({
  category: {
    type: String, required: true,
    enum: ['birthday','babyshower','inhouse','kids','haldi','mandap','reception','corporate'],
    index: true,
  },
  type:     { type: String, enum: ['img'], default: 'img' },
  publicId: { type: String, required: true },
  url:      { type: String, required: true },
  thumb:    { type: String, default: '' },
  cap:      { type: String, default: '', maxlength: 120 },
  order:    { type: Number, default: 0 },
}, { timestamps: true });

export const Media = mongoose.models.Media || mongoose.model('Media', MediaSchema);

// ── YouTube Videos ───────────────────────────────────────────────
const VideoSchema = new mongoose.Schema({
  youtubeUrl: { type: String, required: true },
  youtubeId:  { type: String, required: true },
  title:      { type: String, default: '', maxlength: 120 },
  description:{ type: String, default: '', maxlength: 300 },
  active:     { type: Boolean, default: true },
  order:      { type: Number, default: 0 },
}, { timestamps: true });

export const Video = mongoose.models.Video || mongoose.model('Video', VideoSchema);
