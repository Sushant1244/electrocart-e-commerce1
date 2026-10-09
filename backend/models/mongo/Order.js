const mongoose = require('mongoose');

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'completed'];

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'MongoProduct', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const deliveryUpdateSchema = new mongoose.Schema({
  status: { type: String },
  location: { type: String },
  note: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'MongoUser', required: true, index: true },
  items: { type: [orderItemSchema], required: true, validate: value => value.length > 0 },
  shippingAddress: { type: mongoose.Schema.Types.Mixed, required: true },
  paymentMethod: { type: String, required: true, trim: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending', index: true },
  orderStatus: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
  deliveryStatus: { type: String, trim: true },
  trackingNumber: { type: String, trim: true },
  deliveryUpdates: { type: [deliveryUpdateSchema], default: [] },
  paymentResult: { type: mongoose.Schema.Types.Mixed },
  totalAmount: { type: Number, required: true, min: 0 }
}, { timestamps: true, versionKey: false });

orderSchema.statics.STATUSES = ORDER_STATUSES;

module.exports = mongoose.models.MongoOrder || mongoose.model('MongoOrder', orderSchema, 'orders');
