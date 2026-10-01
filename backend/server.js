require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('fs');
const { DataTypes } = require('sequelize');
const app = express();


try {
  if (process.env.NODE_ENV === 'production' && (process.env.ALLOW_UNVERIFIED_ORDERS || '').toLowerCase() === 'true') {
    console.error('ALERT: ALLOW_UNVERIFIED_ORDERS=true is not permitted in production. Disable this flag and restart.');
    // Don't crash the function - just warn and continue
  }
} catch (e) {
  console.warn('Error checking ALLOW_UNVERIFIED_ORDERS:', e?.message);
}

const authRoutes = require('./routes/auth');
const debugRoutes = require('./routes/debug');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');
const uploadsRoutes = require('./routes/uploads');
const paymentsRoutes = require('./routes/payments');
const notificationsRoutes = require('./routes/notifications');
const inquiriesRoutes = require('./routes/inquiries');
const usersRoutes = require('./routes/users');
const reviewsRoutes = require('./routes/reviews');
const inventoryRoutes = require('./routes/inventory');
const wishlistRoutes = require('./routes/wishlist');
const cartRoutes = require('./routes/cart');
const blogRoutes = require('./routes/blogs');
const pgConfig = require('./config/sequelize');
const promoRoutes = require('./routes/promo');
const reportRoutes = require('./routes/reports');
let pgProductsRouter = null;
// Only initialize Postgres when running the server directly or in Vercel.
// This avoids starting background DB connections during tests which can leave open handles.
// In Vercel, we still need to try connecting for serverless functions to work.
// Wrap in try-catch to prevent module load crashes
try {
  // Check if we're in test mode - don't connect to DB during tests
  const isTestMode = process.env.NODE_ENV === 'test';
  
  if ((require.main === module || process.env.VERCEL === '1') && !isTestMode) {
    // If Sequelize/PG is configured, attempt to authenticate and optionally sync schema
    if (pgConfig && pgConfig.sequelize) {
      const { sequelize } = pgConfig;
      (async () => {
        try {
          await sequelize.authenticate();
          console.log('Postgres (Sequelize) connected');
          // In development, allow automatic schema sync when PG_SYNC env var is truthy
          if (process.env.PG_SYNC === 'true') {
            await sequelize.sync({ alter: true });
            console.log('Postgres schema synchronized (alter)');
          } else {
            console.log('Postgres schema not synchronized automatically. To auto-create tables in dev set PG_SYNC=true and restart the server.');
          }
          // Convenience: if running locally (not production), ensure the `reviews` table exists
          // This helps devs who have Postgres configured but haven't run migrations yet.
          try {
            if (process.env.NODE_ENV !== 'production' && pgConfig && pgConfig.Review) {
              const qi = sequelize.getQueryInterface();
              const tables = await qi.showAllTables();
              // showAllTables can return array of objects or strings depending on dialect/config
              const tableNames = (tables || []).map(t => (typeof t === 'string' ? t : (t.tableName || t.name))).map(n => String(n).toLowerCase());
              if (!tableNames.includes('reviews')) {
                console.log('`reviews` table missing — creating via Review.sync() (development only)');
                await pgConfig.Review.sync({ alter: true });
                console.log('`reviews` table created/updated');
              }
            }
          } catch (e) {
            console.warn('Failed to auto-create `reviews` table (dev helper):', e && e.message ? e.message : e);
          }
          // Ensure email verification columns exist (safe to run in dev/production)
          try {
            const qi = sequelize.getQueryInterface();
            const usersDesc = await qi.describeTable('users').catch(() => null);
            if (usersDesc) {
              if (!usersDesc.emailVerified) {
                await qi.addColumn('users', 'emailVerified', { type: DataTypes.BOOLEAN, defaultValue: false });
                console.log('Added column users.emailVerified');
              }
              if (!usersDesc.emailVerificationToken) {
                await qi.addColumn('users', 'emailVerificationToken', { type: DataTypes.STRING });
                console.log('Added column users.emailVerificationToken');
              }
              if (!usersDesc.emailVerificationExpire) {
                await qi.addColumn('users', 'emailVerificationExpire', { type: DataTypes.BIGINT });
                console.log('Added column users.emailVerificationExpire');
              }
            }
          } catch (e) {
            console.warn('Failed to ensure email verification columns:', e && e.message ? e.message : e);
          }
        } catch (err) {
          console.error('Sequelize connection failed:', err.message || err);
          // In Vercel, don't crash - just log the error and continue
          // The app will fall back to in-memory storage if DB is unavailable
        }
      })();

      try {
        // Only load PG routes if pgConfig has a valid sequelize instance
        if (pgConfig && pgConfig.sequelize) {
          const pgProductsFactory = require('./routes/pgProducts');
          pgProductsRouter = pgProductsFactory(pgConfig);
        }
      } catch (err) {
        console.error('Failed to load PG routes', err.message);
      }
    }
  }
} catch (e) {
  console.warn('Database initialization error (non-fatal):', e?.message);
}

const PORT = process.env.PORT || 5001;
// MongoDB support has been removed; use POSTGRES_URL to enable Postgres.

// Enable CORS: in production use CLIENT_URL, in development allow localhost on common dev ports
// For local debugging you can set DEV_ALLOW_ALL_ORIGINS=true in backend/.env to allow any origin
if (process.env.NODE_ENV === 'production') {
  // In Vercel monorepo, frontend and backend are on same domain, so we need flexible CORS
  // to support preview deployments and different branches
  app.use(cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (server-to-server, same-origin requests)
      if (!origin) return cb(null, true);
      
      // Build list of allowed origins
      const allowedOrigins = [];
      
      // Add explicit CLIENT_URL if set
      if (process.env.CLIENT_URL) {
        allowedOrigins.push(process.env.CLIENT_URL);
        // Also allow without https prefix for flexibility
        allowedOrigins.push(process.env.CLIENT_URL.replace('https://', 'http://'));
      }
      
      // Always allow Vercel domains (production and preview deployments)
      const vercelPattern = /https?:\/\/[^/]*vercel\.app$/i;
      const isVercelDomain = vercelPattern.test(origin) || 
                            origin.includes('.vercel.app') ||
                            origin.includes('vercel.app');
      
      // Allow Vercel storage
      const isVercelStorage = origin.includes('vercel-storage.com');
      
      // Check if origin matches any allowed pattern
      const isAllowed = allowedOrigins.some(allowed => 
        origin === allowed || 
        origin.endsWith('.' + allowed.replace('https://', '')) ||
        origin.endsWith('-' + allowed.replace('https://', ''))
      );
      
      if (isAllowed || isVercelDomain || isVercelStorage) {
        return cb(null, true);
      }
      
      // Block other origins in production for security
      return cb(new Error('Not allowed by CORS policy'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
  } else {
    if (process.env.DEV_ALLOW_ALL_ORIGINS === 'true') {
      // Allow all origins for quick local debugging (mirrors request Origin header)
      app.use(cors({ origin: true, credentials: true }));
    } else {
      const allowedLocalOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
        'http://localhost:3001'
      ];
      app.use(cors({
        origin: (origin, cb) => {
          // Allow requests with no origin like curl or server-to-server
          if (!origin) return cb(null, true);
          // Allow explicit allowedLocalOrigins, any localhost:port and 127.0.0.1:port, and IPv6 loopback
          if (
            allowedLocalOrigins.includes(origin) ||
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:') ||
            origin.startsWith('http://[::1]:')
          ) return cb(null, true);
          return cb(new Error('Not allowed by CORS'), false);
        },
        credentials: true
      }));
    }
}

// Parse JSON and URL-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lightweight request logger to help reproduce and capture incoming requests in dev
app.use((req, res, next) => {
  try {
    const remote = req.ip || req.connection?.remoteAddress || 'unknown';
    console.log(`[req] ${new Date().toISOString()} - ${req.method} ${req.originalUrl} from ${remote}`);
  } catch (e) {
    // avoid crashing the app if logging fails
  }
  return next();
});

// Serve uploaded files from /uploads
// Ensure uploads directory exists
const uploadsPath = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create uploads directory:', e?.message);
}
app.use('/uploads', express.static(uploadsPath));

// Mount API routes BEFORE the catch-all for frontend
// This is critical: API routes must be handled before the React router catch-all
app.use('/api/auth', authRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/inquiries', inquiriesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);

// If PG is enabled, mount PG product routes under /api/pg/products
if (pgProductsRouter) {
  app.use('/api/pg/products', pgProductsRouter);
}

// Serve frontend static files in production (AFTER API routes)
// Also serve in production-like environments (VERCEL === '1')
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

if (isProduction) {
  // Serve React static files from frontend/dist
  // Try multiple possible locations for Vercel compatibility
  const possiblePaths = [
    path.join(process.cwd(), 'frontend', 'dist'),
    path.join(process.cwd(), 'dist'),
    path.join(__dirname, '..', 'frontend', 'dist'),
    path.join(__dirname, '..', '..', 'frontend', 'dist'),
    path.join(__dirname, '..', '..', '..', 'frontend', 'dist'),
    path.join(__dirname, 'dist'),
    path.join(__dirname, '..', 'dist'),
    // Vercel serverless function paths
    path.join('/var/task', 'frontend', 'dist'),
    path.join('/var/task', 'dist')
  ];
  
  let frontendDistPath = null;
  let fs;
  try {
    fs = require('fs');
    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          frontendDistPath = p;
          console.log('Found frontend dist at:', p);
          break;
        }
      } catch (e) {
        // Continue to next path
      }
    }
    
    if (!frontendDistPath) {
      console.log('Could not find frontend dist in any of these paths:', possiblePaths);
      console.log('process.cwd():', process.cwd());
      console.log('__dirname:', __dirname);
    }
  } catch (e) {
    console.error('Error checking paths:', e);
  }
  
  // Also serve uploads from frontend dist (Vite copies public folder to dist)
  if (frontendDistPath) {
    app.use('/uploads', express.static(path.join(frontendDistPath, 'uploads')));
  }
  
  // Fallback: also try direct var/task paths for Vercel
  const varTaskUploadsPath = '/var/task/frontend/dist/uploads';
  try {
    if (require('fs').existsSync(varTaskUploadsPath)) {
      app.use('/uploads', express.static(varTaskUploadsPath));
      console.log('Serving uploads from:', varTaskUploadsPath);
    }
  } catch (e) {
    // ignore
  }
  
  if (frontendDistPath) {
    app.use(express.static(frontendDistPath));

    // Handle React routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  }
} else {
  // Development or test mode: simple API response
  app.get('/', (req, res) => res.send('API running'));
}

// Start server with an error handler to gracefully report listen errors
const LISTEN_HOST = process.env.LISTEN_HOST || '0.0.0.0';

function startServer() {
  const server = app.listen(PORT, LISTEN_HOST, () => console.log(`Server running on ${LISTEN_HOST}:${PORT}`));

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`ERROR: Port ${PORT} is already in use. Stop the process using the port or set a different PORT env var.`);
      // Attempt a helpful diagnostic: print processes listening on the port
      const { execSync } = require('child_process');
      try {
        const out = execSync(`lsof -i :${PORT} -sTCP:LISTEN -Pn || true`, { encoding: 'utf8' });
        console.error('Processes listening on the port:\n', out);
      } catch (e) {
        console.error('Failed to run lsof for diagnostics:', e.message || e);
      }
      process.exit(1);
    } else {
      console.error('Server error:', err && err.stack ? err.stack : err);
      process.exit(1);
    }
  });

  return server;
}

// Global error handler (development friendly) — logs stack and returns minimal message
app.use((err, req, res, next) => {
  try {
    console.error('Unhandled error:', err && err.stack ? err.stack : err);
  } catch (e) {
    console.error('Failed to log unhandled error', e);
  }
  res.status(500).json({ message: err && err.message ? err.message : '' });
});

// Export for Vercel serverless OR local development/testing
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  // Vercel serverless: export express app directly
  // @vercel/node handles express apps natively
  module.exports = app;
} else if (require.main === module) {
  // Running directly (local development): start the server
  startServer();
  module.exports = { app, startServer };
} else {
  // For testing: create a server instance that supertest can use
  const http = require('http');
  const server = http.createServer(app);
  module.exports = { app, server, startServer };
}

// Background jobs: notification cleanup
// Only schedule background timers when the server is started directly (not imported by tests)
const isTestMode = process.env.NODE_ENV === 'test';
if (require.main === module && !isTestMode) {
  try {
    const NOTIF_CLEANUP_ENABLED = (process.env.NOTIF_CLEANUP_ENABLED || 'true') === 'true';
    // Parse numeric env vars and validate/fallbacks to safe defaults if invalid
    let NOTIF_CLEANUP_INTERVAL_HOURS = Number(process.env.NOTIF_CLEANUP_INTERVAL_HOURS || 6);
    if (!Number.isFinite(NOTIF_CLEANUP_INTERVAL_HOURS) || Number.isNaN(NOTIF_CLEANUP_INTERVAL_HOURS) || NOTIF_CLEANUP_INTERVAL_HOURS < 1) {
      console.warn('[notif-cleanup] NOTIF_CLEANUP_INTERVAL_HOURS is invalid; falling back to 6');
      NOTIF_CLEANUP_INTERVAL_HOURS = 6;
    }
    // Ensure integer hours and clamp to minimum 1 when used for scheduling
    NOTIF_CLEANUP_INTERVAL_HOURS = Math.max(1, Math.floor(NOTIF_CLEANUP_INTERVAL_HOURS));

    let NOTIF_CLEANUP_OLDER_THAN_DAYS = Number(process.env.NOTIF_CLEANUP_OLDER_THAN_DAYS || 30);
    if (!Number.isFinite(NOTIF_CLEANUP_OLDER_THAN_DAYS) || Number.isNaN(NOTIF_CLEANUP_OLDER_THAN_DAYS) || NOTIF_CLEANUP_OLDER_THAN_DAYS < 0) {
      console.warn('[notif-cleanup] NOTIF_CLEANUP_OLDER_THAN_DAYS is invalid; falling back to 30');
      NOTIF_CLEANUP_OLDER_THAN_DAYS = 30;
    }

    let NOTIF_CLEANUP_READ_DAYS = Number(process.env.NOTIF_CLEANUP_READ_DAYS || 7);
    if (!Number.isFinite(NOTIF_CLEANUP_READ_DAYS) || Number.isNaN(NOTIF_CLEANUP_READ_DAYS) || NOTIF_CLEANUP_READ_DAYS < 0) {
      console.warn('[notif-cleanup] NOTIF_CLEANUP_READ_DAYS is invalid; falling back to 7');
      NOTIF_CLEANUP_READ_DAYS = 7;
    }
    if (NOTIF_CLEANUP_ENABLED) {
      const runCleanup = async () => {
        try {
          const adapter = require('./models/adapter');
          if (adapter && adapter.Notification && typeof adapter.Notification.deleteOlderThan === 'function') {
            const deleted = await adapter.Notification.deleteOlderThan({ olderThanDays: NOTIF_CLEANUP_OLDER_THAN_DAYS, readOlderThanDays: NOTIF_CLEANUP_READ_DAYS });
            console.log(`[notif-cleanup] deleted ${deleted} old notifications`);
          }
        } catch (e) {
          console.warn('[notif-cleanup] failed', e && e.message ? e.message : e);
        }
      };
      // Run once on startup (non-blocking)
      setTimeout(() => { runCleanup().catch(() => {}); }, 2000);
      // Schedule periodic cleanup
      setInterval(() => { runCleanup().catch(() => {}); }, Math.max(1, NOTIF_CLEANUP_INTERVAL_HOURS) * 60 * 60 * 1000);
      console.log('[notif-cleanup] scheduled every', NOTIF_CLEANUP_INTERVAL_HOURS, 'hours');
    }
  } catch (e) { console.warn('Failed to schedule notification cleanup', e && e.message ? e.message : e); }
} else {
  // When imported (for tests) or running under test env, do not start background timers.
  // Keep the log minimal so tests aren't noisy.
  if (process.env.NODE_ENV !== 'test') console.log('[notif-cleanup] not scheduled (server imported)');
}
