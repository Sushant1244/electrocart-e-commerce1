const express = require('express');
const router = express.Router();
const adapter = require('../models/adapter');
const pgConfig = require('../config/sequelize');

// Debug endpoint to check database connection status
router.get('/status', async (req, res) => {
  const status = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    postgresConfigured: false,
    postgresConnected: false,
    adapterAvailable: false,
    userModelAvailable: false,
    postgresUrl: process.env.POSTGRES_URL ? 'SET (hidden)' : 'NOT SET',
  };
  
  // Check PostgreSQL configuration
  if (pgConfig && pgConfig.sequelize) {
    status.postgresConfigured = true;
    try {
      await pgConfig.sequelize.authenticate();
      status.postgresConnected = true;
    } catch (err) {
      status.postgresError = err.message;
    }
  }
  
  // Check adapter availability
  if (adapter && adapter.User) {
    status.adapterAvailable = true;
    status.userModelAvailable = typeof adapter.User.findOne === 'function';
  }
  
  // Try to count users if connected
  if (status.postgresConnected && adapter && adapter.User && typeof adapter.User.find === 'function') {
    try {
      const users = await adapter.User.find({});
      status.userCount = Array.isArray(users) ? users.length : 0;
    } catch (err) {
      status.userCountError = err.message;
    }
  }
  
  res.json(status);
});

module.exports = router;
