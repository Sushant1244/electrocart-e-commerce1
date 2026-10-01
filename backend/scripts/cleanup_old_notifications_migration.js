#!/usr/bin/env node
/*
  One-off migration script to remove old notifications from the database.
  Call with optional environment variables to control retention. Example:
    NOTIF_CLEANUP_OLDER_THAN_DAYS=60 NOTIF_CLEANUP_READ_DAYS=14 node cleanup_old_notifications_migration.js
*/
require('dotenv').config();
(async () => {
  try {
    let olderThanDays = Number(process.env.NOTIF_CLEANUP_OLDER_THAN_DAYS || 30);
    let readOlderThanDays = Number(process.env.NOTIF_CLEANUP_READ_DAYS || 7);
    // Validate parsed numeric env vars and fallback to safe defaults when invalid
    if (!Number.isFinite(olderThanDays) || Number.isNaN(olderThanDays)) {
      console.warn('[migration] NOTIF_CLEANUP_OLDER_THAN_DAYS is invalid; falling back to 30');
      olderThanDays = 30;
    }
    if (!Number.isFinite(readOlderThanDays) || Number.isNaN(readOlderThanDays)) {
      console.warn('[migration] NOTIF_CLEANUP_READ_DAYS is invalid; falling back to 7');
      readOlderThanDays = 7;
    }
    console.log('[migration] starting cleanup_old_notifications_migration with', { olderThanDays, readOlderThanDays });
    const adapter = require('../models/adapter');
    if (!adapter || !adapter.Notification || typeof adapter.Notification.deleteOlderThan !== 'function') {
      console.error('[migration] postgres/adapter.Notification not available. Ensure POSTGRES_URL is set and models are present.');
      process.exit(1);
    }
    const deleted = await adapter.Notification.deleteOlderThan({ olderThanDays, readOlderThanDays });
    console.log('[migration] deleted', deleted, 'notifications');
    process.exit(0);
  } catch (e) {
    console.error('[migration] failed', e && e.stack ? e.stack : e);
    process.exit(2);
  }
})();
