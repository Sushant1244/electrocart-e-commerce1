require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, closeDB } = require('./config/db');
const User = require('./models/mongo/User');
const Category = require('./models/mongo/Category');
const Product = require('./models/mongo/Product');

const categories = [
  { name: 'Security Cameras', slug: 'security-cameras', image: '/uploads/security-camera.jpg' },
  { name: 'Gaming', slug: 'gaming', image: '/uploads/gaming.jpg' },
  { name: 'Accessories', slug: 'accessories', image: '/uploads/accessories.jpg' }
];
const products = [
  ['Sentinel 4K Outdoor Camera', 'sentinel-4k-outdoor-camera', 'Weather-resistant 4K security camera with night vision.', 249, 'security-cameras', 'Sentinel'],
  ['NightWatch PTZ Camera', 'nightwatch-ptz-camera', 'Pan, tilt and zoom camera with smart motion alerts.', 179, 'security-cameras', 'NightWatch'],
  ['Guardian Doorbell Camera', 'guardian-doorbell-camera', 'Two-way audio doorbell camera with cloud-ready alerts.', 129, 'security-cameras', 'Guardian'],
  ['SecureHub 8 Channel DVR', 'securehub-8-channel-dvr', 'Expandable DVR for multi-camera security systems.', 299, 'security-cameras', 'SecureHub'],
  ['Indoor Mini Cam', 'indoor-mini-cam', 'Compact 1080p indoor camera with privacy mode.', 59, 'security-cameras', 'SONU'],
  ['Titan RGB Gaming Keyboard', 'titan-rgb-gaming-keyboard', 'Low-latency mechanical keyboard with programmable RGB.', 89, 'gaming', 'Titan'],
  ['Apex Wireless Gaming Mouse', 'apex-wireless-gaming-mouse', 'Lightweight wireless mouse with adjustable DPI.', 69, 'gaming', 'Apex'],
  ['Vector Pro Gaming Headset', 'vector-pro-gaming-headset', 'Surround-sound headset with a detachable microphone.', 99, 'gaming', 'Vector'],
  ['Forge USB Gaming Controller', 'forge-usb-gaming-controller', 'Responsive wired controller for PC gaming.', 45, 'gaming', 'Forge'],
  ['Pulse 27 Gaming Monitor', 'pulse-27-gaming-monitor', '144Hz QHD display with adaptive sync.', 329, 'gaming', 'Pulse']
].map(([name, slug, description, price, category, brand]) => ({ name, slug, description, price, category, brand, stock: 25, images: [], specs: { warranty: '1 year' }, isActive: true }));

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  if (!process.env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD is required for seeding');
  await connectDB();
  await Category.bulkWrite(categories.map(category => ({ updateOne: { filter: { slug: category.slug }, update: { $set: category }, upsert: true } })));
  await Product.bulkWrite(products.map(product => ({ updateOne: { filter: { slug: product.slug }, update: { $set: product }, upsert: true } })));
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  await User.findOneAndUpdate({ email: String(process.env.ADMIN_EMAIL || 'admin@sonuenterprises.com').toLowerCase() }, { $set: { name: 'SONU ENTERPRISES Admin', passwordHash, role: 'admin', isEmailVerified: true, emailVerified: true } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  console.log('MongoDB seed complete: 3 categories, 10 products, and 1 admin user.');
}

seed().catch(error => { console.error('MongoDB seed failed:', error.message); process.exitCode = 1; }).finally(async () => { await closeDB(); });
