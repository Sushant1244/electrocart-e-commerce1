const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  image: { type: String, trim: true }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.models.MongoCategory || mongoose.model('MongoCategory', categorySchema, 'categories');
