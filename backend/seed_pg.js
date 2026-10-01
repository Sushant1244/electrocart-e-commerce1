/**
 * Simple PG seed script for side-by-side Postgres support (Option A).
 * Usage: POSTGRES_URL=postgres://user:pass@host:5432/db node seed_pg.js
 */
const { sequelize, Product, User } = require('./config/sequelize') || {};

if (!sequelize) {
  console.error('POSTGRES_URL not set - skipping PG seed.');
  process.exit(1);
}

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    // create a demo user
  await User.create({ name: 'Admin', email: 'admin@electrocart.com', passwordHash: 'seeded' });

    const products = [
      {
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        description: 'Demo iPhone 15 Pro with uploaded hero image',
        price: 999.99,
        countInStock: 10,
        images: ['/uploads/Iphone banner.png'],
        category: 'Phones',
        brand: 'Apple',
      },
      {
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'Comfortable wireless headphones',
        price: 199.99,
        countInStock: 15,
        images: ['/uploads/Wireless Headphones.png'],
        category: 'Audio',
        brand: 'Acme',
      },
    ];

    for (const p of products) {
      await Product.create(p);
    }

    console.log('PG seed complete.');
    process.exit(0);
  } catch (err) {
    console.error('PG seed failed:', err);
    process.exit(1);
  }
}

seed();
