const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'MongoUser', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'MongoProduct', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 2000 }
}, { timestamps: true, versionKey: false });

reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.models.MongoReview || mongoose.model('MongoReview', reviewSchema, 'reviews');
