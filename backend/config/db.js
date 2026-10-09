const mongoose = require('mongoose');

const DEFAULT_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 10,
  minPoolSize: 1,
  family: 4
};
const MAX_RETRIES = Number(process.env.MONGODB_MAX_RETRIES || 5);
const RETRY_DELAY_MS = Number(process.env.MONGODB_RETRY_DELAY_MS || 2000);
let connectionPromise = null;
let shutdownRegistered = false;

function registerConnectionEvents() {
  mongoose.connection.on('connected', () => console.log('[mongo] connected'));
  mongoose.connection.on('error', (error) => console.error('[mongo] error:', error.message));
  mongoose.connection.on('disconnected', () => console.warn('[mongo] disconnected'));
}

async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) return null;
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  registerConnectionEvents();
  connectionPromise = (async () => {
    let lastError;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        await mongoose.connect(uri, { ...DEFAULT_OPTIONS });
        return mongoose.connection;
      } catch (error) {
        lastError = error;
        console.error(`[mongo] connection attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);
        if (attempt < MAX_RETRIES) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
    connectionPromise = null;
    throw lastError;
  })();

  return connectionPromise;
}

async function closeDB() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

function registerShutdownHandlers() {
  if (shutdownRegistered) return;
  shutdownRegistered = true;
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, async () => {
      try {
        await closeDB();
      } finally {
        process.exit(0);
      }
    });
  }
}

registerShutdownHandlers();

module.exports = { connectDB, closeDB, mongoose, getConnectionState: () => mongoose.connection.readyState };
