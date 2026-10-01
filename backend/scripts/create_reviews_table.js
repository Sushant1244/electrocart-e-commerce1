require('dotenv').config();
const pgConfig = require('../config/sequelize');

async function run() {
  if (!pgConfig || !pgConfig.sequelize || !pgConfig.Review) {
    console.error('Postgres config or Review model not available. Ensure POSTGRES_URL is set and models are loaded.');
    process.exit(2);
  }
  const { sequelize, Review } = pgConfig;
  try {
    await sequelize.authenticate();
    console.log('Postgres connected');
    // only create review table (safe)
    await Review.sync({ alter: true });
    console.log('`reviews` table created/updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('Failed to create/update `reviews` table:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();
