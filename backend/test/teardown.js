// Jest teardown file - runs after all tests
const pgConfig = require('../config/sequelize');

async function teardown() {
  try {
    // Close database connections
    if (pgConfig && pgConfig.sequelize && typeof pgConfig.sequelize.close === 'function') {
      await pgConfig.sequelize.close();
      console.log('[teardown] Database connections closed');
    }
  } catch (error) {
    // Ignore errors during teardown
  }
}

module.exports = teardown;
