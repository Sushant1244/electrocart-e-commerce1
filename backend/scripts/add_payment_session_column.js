require('dotenv').config();
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Load sequelize config which returns { sequelize, Product, User, Order, Review }
const pg = require(path.join(__dirname, '..', 'config', 'sequelize'));

(async () => {
  try {
    if (!pg || !pg.sequelize) {
      console.error('Postgres not configured (no POSTGRES_URL). Cannot modify orders table.');
      process.exit(1);
    }

    const sequelize = pg.sequelize;
    const qi = sequelize.getQueryInterface();

    console.log('Inspecting `orders` table...');
    const desc = await qi.describeTable('orders');
    if (desc && Object.prototype.hasOwnProperty.call(desc, 'paymentSession')) {
      console.log('`paymentSession` column already exists on orders table.');
      await sequelize.close();
      process.exit(0);
    }

    console.log('`paymentSession` column missing — adding JSONB column `paymentSession`');
    await qi.addColumn('orders', 'paymentSession', { type: DataTypes.JSONB, allowNull: true });
    console.log('Added `paymentSession` column successfully.');

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Failed to ensure paymentSession column:', err && err.stack ? err.stack : err);
    process.exit(2);
  }
})();
