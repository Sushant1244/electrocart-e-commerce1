require('dotenv').config();
const { DataTypes } = require('sequelize');
const pgConfig = require('../config/sequelize');

const userColumns = {
  phone: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, defaultValue: 'customer' },
  twoFactorSecret: { type: DataTypes.TEXT },
  twoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  backupCodes: { type: DataTypes.JSONB, defaultValue: [] },
  googleId: { type: DataTypes.STRING },
  failedLoginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  lockUntil: { type: DataTypes.DATE }
};

async function migrate() {
  if (!pgConfig?.sequelize || !pgConfig.User || !pgConfig.AuthSession || !pgConfig.AuthToken) {
    throw new Error('POSTGRES_URL is required to migrate authentication tables');
  }
  const queryInterface = pgConfig.sequelize.getQueryInterface();
  const description = await queryInterface.describeTable('users');
  for (const [name, definition] of Object.entries(userColumns)) {
    if (!description[name]) await queryInterface.addColumn('users', name, definition);
  }
  await pgConfig.AuthSession.sync();
  await pgConfig.AuthToken.sync();
  await pgConfig.sequelize.close();
  console.log('Authentication schema is ready.');
}

migrate().catch(async (error) => {
  console.error('Authentication migration failed:', error.message);
  if (pgConfig?.sequelize) await pgConfig.sequelize.close();
  process.exitCode = 1;
});
