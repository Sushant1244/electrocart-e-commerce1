const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, min: 0 },
  category: { type: String, required: true, enum: ['security-cameras', 'gaming', 'accessories', 'audio', 'smartphones', 'other'], index: true },
  brand: { type: String, trim: true, index: true },
  images: { type: [String], default: [] },
  videoUrl: { type: String, trim: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  specs: { type: Map, of: String, default: {} },
  ratingAverage: { type: Number, min: 0, max: 5, default: 0 },
  ratingCount: { type: Number, min: 0, default: 0 },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true, versionKey: false });

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1, brand: 1 });

module.exports = mongoose.models.MongoProduct || mongoose.model('MongoProduct', productSchema, 'products');
