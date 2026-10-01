const { sequelize, User } = require('./config/sequelize') || {};
const bcrypt = require('bcryptjs');

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL || !sequelize) {
  console.error('POSTGRES_URL not set or sequelize not configured.');
  process.exit(1);
}

async function run() {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email: 'admin@electrocart.com' } });
    if (!user) {
      console.error('Admin user not found (admin@example.com)');
      process.exit(1);
    }
    const hash = await bcrypt.hash('admin123', 10);
    await user.update({ passwordHash: hash });
    console.log('Admin password updated to "admin123"');
    process.exit(0);
  } catch (err) {
    console.error('Failed to set admin password:', err.message || err);
    process.exit(1);
  }
}

run();
