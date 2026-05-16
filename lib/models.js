import mongoose from 'mongoose';

const CAT_ENUM = [
  'birthday','babyshower','inhouse','kids',
  'haldi','mandap','reception','corporate'
];

// ── Media (photos) ─────────────────────────────────────────────
const MediaSchema = new mongoose.Schema({
  category: { type:String, required:true, enum:CAT_ENUM, index:true },
  type:     { type:String, enum:['img'], default:'img' },
  publicId: { type:String, required:true },
  url:      { type:String, required:true },
  thumb:    { type:String, default:'' },
  cap:      { type:String, default:'', maxlength:120 },
  order:    { type:Number, default:0 },
}, { timestamps:true });

export const Media = mongoose.models.Media || mongoose.model('Media', MediaSchema);

// ── YouTube Videos ─────────────────────────────────────────────
const VideoSchema = new mongoose.Schema({
  youtubeUrl:  { type:String, required:true },
  youtubeId:   { type:String, required:true, unique:true },
  title:       { type:String, default:'', maxlength:120 },
  description: { type:String, default:'', maxlength:300 },
  // Which gallery category this video belongs to (shown on that gallery page)
  category: {
    type:String,
    enum:[...CAT_ENUM, 'general'],
    default:'general',
  },
  active:    { type:Boolean, default:true  }, // show anywhere on site
  featured:  { type:Boolean, default:false }, // show in home page slideshow
  order:     { type:Number,  default:0     },
}, { timestamps:true });

export const Video = mongoose.models.Video || mongoose.model('Video', VideoSchema);
