const { sequelize, User, Product } = require('./config/sequelize') || {};
const bcrypt = require('bcryptjs');

if (!sequelize) {
  console.error('POSTGRES_URL not set; cannot run seeding.');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
let DEMO_PRODUCTS = [];
try {
  const demoPath = path.resolve(__dirname, '../frontend/src/data/demoProducts.js');
  const txt = fs.readFileSync(demoPath, 'utf8');
  const m = txt.match(/export const DEMO_PRODUCTS = (\[[\s\S]*?\])\n/);
  if (m && m[1]) {
    // evaluate the array literal in a safe new function
    // eslint-disable-next-line no-new-func
    DEMO_PRODUCTS = (new Function('return ' + m[1]))();
  }
} catch (e) {
  console.warn('Could not read demo products:', e.message || e);
}

async function run() {
  try {
    await sequelize.authenticate();

    // ensure admin user has isAdmin true
    const admin = await User.findOne({ where: { email: 'admin@electrocart.com' } });
    if (admin && !admin.isAdmin) {
      await admin.update({ isAdmin: true });
      console.log('Admin user updated to isAdmin=true');
    }

    // seed demo products if missing
    const existing = await Product.findAll();
    const existingSlugs = new Set(existing.map(p => p.slug));
    let added = 0;
    for (const dp of DEMO_PRODUCTS) {
      const slug = (dp.slug || '').toString();
      if (!slug || existingSlugs.has(slug)) continue;
      const createData = {
        name: dp.name,
        slug: slug,
        description: dp.description || dp.name,
        price: dp.price || 0,
        countInStock: dp.stock || dp.countInStock || 0,
        images: dp.images || [],
        category: dp.category || '',
        brand: dp.brand || ''
      };
      await Product.create(createData);
      added++;
    }

    console.log(`Seeding complete. Added ${added} products.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message || err);
    process.exit(1);
  }
}

run();
