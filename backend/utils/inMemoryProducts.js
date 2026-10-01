// Simple in-memory products for development fallback
const products = [
  { _id: 'p1', name: 'Alpha Watch ultra', slug: 'alpha-watch-ultra', description: 'Smart watch with advanced features', price: 3500, originalPrice: 4800, category: 'watches', images: ['/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png','/uploads/Apple Watch.png'], stock: 10, rating: 5, featured: true },
  { _id: 'p2', name: 'Wireless Headphones', slug: 'wireless-headphones', description: 'Noise cancelling headphones', price: 3200, originalPrice: 4100, category: 'headphones', images: ['/uploads/Wireless Headphones.png','/uploads/Headphone.png'], stock: 25, rating: 5 },
  { _id: 'p3', name: 'Homepad mini', slug: 'homepad-mini', description: 'Smart speaker', price: 1200, originalPrice: 2100, category: 'speakers', images: ['/uploads/Mini Speaker.png','/uploads/Homepad mini.png'], stock: 50, rating: 5 },
  { _id: 'p4', name: 'MatrixSafe Charger', slug: 'matrixsafe-charger', description: 'MagSafe compatible charger', price: 1700, originalPrice: 2200, category: 'accessories', images: ['/uploads/MatrixSafe Charger.png','/uploads/Smart Box.png'], stock: 30, rating: 5 },
  { _id: 'p5', name: 'Iphone 15 Pro max', slug: 'iphone-15-pro-max', description: 'Latest iPhone with advanced features', price: 178900, originalPrice: 210000, category: 'iphone', images: ['/uploads/Iphone 15 pro ma.png','/uploads/Iphone banner.png'], stock: 15, rating: 5, featured: true },
  { _id: 'p6', name: 'Macbook M2 Dark gray', slug: 'macbook-m2-dark-gray', description: 'Powerful laptop with M2 chip', price: 117000, originalPrice: 120000, category: 'laptop', images: ['/uploads/MacBook Air M4.png','/uploads/Macbook Labero and.jpg'], stock: 8, rating: 5 }
];

// Add explicit API-visible product alias for alpha-watch-series (some front-end calls use this slug)
products.push({ _id: 'p6a', name: 'Alpha Watch series', slug: 'alpha-watch-series', description: 'Alpha Watch (alternate slug)', price: 3500, originalPrice: 4800, category: 'watches', images: ['/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png','/uploads/Apple Watch.png'], stock: 10, rating: 5 });

// Additional demo products
products.push(
  { _id: 'p7', name: 'Music Magnet Headphone', slug: 'music-magnet-headphone', description: 'High-fidelity over-ear headphones', price: 14500, originalPrice: 17999, category: 'headphones', images: ['/uploads/Music magnet Headphone.jpg','/uploads/Headphone.png'], stock: 20, rating: 5 },
  { _id: 'p8', name: 'Security Smart Camera', slug: 'security-smart-camera', description: 'Smart camera with night vision', price: 850, originalPrice: 1200, category: 'camera', images: ['/uploads/Security Smart Camera.png','/uploads/Camera.png'], stock: 40, rating: 4 },
  { _id: 'p9', name: 'Smart Box', slug: 'smart-box', description: 'Smart home control hub', price: 2999, originalPrice: 3999, category: 'accessories', images: ['/uploads/Smart Box.png','/uploads/Accessories.png'], stock: 12, rating: 4 },
  { _id: 'p10', name: 'Macbook Air M3', slug: 'macbook-air-m3', description: 'Lightweight laptop M3', price: 98000, originalPrice: 109000, category: 'laptop', images: ['/uploads/Macebook Air M3.png','/uploads/MacBook Air M4.png'], stock: 6, rating: 5 },
  { _id: 'p11', name: 'Mini Speaker', slug: 'mini-speaker', description: 'Portable mini bluetooth speaker', price: 2400, originalPrice: 2999, category: 'speakers', images: ['/uploads/Mini Speaker.png','/uploads/Music magnate .png'], stock: 35, rating: 4 },
  { _id: 'p12', name: 'ENTERTAINMENT & GAMES Pack', slug: 'entertainment-games-pack', description: 'Bundle for entertainment and gaming', price: 450, originalPrice: 599, category: 'games', images: ['/uploads/ENTERTAINMENT & GAMES.png','/uploads/Ipad.png'], stock: 50, rating: 4 }
);

function listProducts({ featured, category } = {}) {
  let out = products.slice();
  if (featured === 'true' || featured === true) out = out.filter(p => p.featured);
  if (category) out = out.filter(p => p.category === category);
  return out;
}

function findBySlug(slug) {
  return products.find(p => p.slug === slug) || null;
}

function findById(id) {
  return products.find(p => p._id === id) || null;
}

module.exports = { listProducts, findBySlug, findById };
