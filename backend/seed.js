require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const bcrypt = require('bcryptjs');

const seed = async () => {
  await connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');
  await User.deleteMany({});
  await Product.deleteMany({});

  const admin = new User({
    name: 'Admin',
    email: 'admin@electrocart.com',
    password: await bcrypt.hash('admin123', 10),
    isAdmin: true
  });
  await admin.save();

  const sampleProducts = [
    {
      name: 'Alpha Watch ultra',
      slug: 'alpha-watch-ultra',
      description: 'Smart watch with advanced features',
      price: 3500,
      originalPrice: 4800,
      category: 'watches',
  images: ['/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png'],
      stock: 10,
      rating: 5,
      featured: true
    },
    {
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      description: 'Noise cancelling headphones',
      price: 3200,
      originalPrice: 4100,
      category: 'headphones',
      images: ['/uploads/Wireless Headphones.png', '/uploads/Headphone.png'],
      stock: 25,
      rating: 5
    },
    {
      name: 'Homepad mini',
      slug: 'homepad-mini',
      description: 'Smart speaker',
      price: 1200,
      originalPrice: 2100,
      category: 'speakers',
      images: ['/uploads/Homepad mini.png', '/uploads/Mini Speaker.png'],
      stock: 50,
      rating: 5
    },
    {
      name: 'MatrixSafe Charger',
      slug: 'matrixsafe-charger',
      description: 'MagSafe compatible charger',
      price: 1700,
      originalPrice: 2200,
      category: 'accessories',
      images: ['/uploads/MatrixSafe Charger.png', '/uploads/Smart Box.png'],
      stock: 30,
      rating: 5
    },
    {
      name: 'Iphone 15 Pro max',
      slug: 'iphone-15-pro-max',
      description: 'Latest iPhone with advanced features',
      price: 178900,
      originalPrice: 210000,
      category: 'iphone',
      images: ['/uploads/Iphone 15 pro ma.png', '/uploads/Iphone 16 pro ma.png'],
      stock: 15,
      rating: 5,
      featured: true
    },
    {
      name: 'Macbook M2 Dark gray',
      slug: 'macbook-m2-dark-gray',
      description: 'Powerful laptop with M2 chip',
      price: 117000,
      originalPrice: 120000,
      category: 'laptop',
      images: ['/uploads/MacBook Air M4.png', '/uploads/Macebook Air M3.png'],
      stock: 8,
      rating: 5
    }
  ];

  await Product.insertMany(sampleProducts);
  console.log('Seed done');
  process.exit();
};

seed();