const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { generateReport, exportReport, getReportOptions, exportAnalyticsReport } = require('../controllers/reportController');

// Get available report options (report types, formats, etc.)
router.get('/options', authMiddleware, adminMiddleware, getReportOptions);

// Generate report data (JSON format)
router.get('/generate', authMiddleware, adminMiddleware, generateReport);

// Export report in specified format
router.get('/export', authMiddleware, adminMiddleware, exportReport);

// Legacy export endpoint for backward compatibility
router.get('/analytics/export', authMiddleware, adminMiddleware, exportAnalyticsReport);

module.exports = router;
