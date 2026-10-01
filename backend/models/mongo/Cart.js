const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'MongoProduct', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'MongoUser', required: true, unique: true, index: true },
  items: { type: [cartItemSchema], default: [] }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.models.MongoCart || mongoose.model('MongoCart', cartSchema, 'carts');
