const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { getSalesStats, getUserStats } = require('../controllers/analyticsController');
const adapter = require('../models/adapter');

router.get('/', authMiddleware, adminMiddleware, getSalesStats);
router.get('/users', authMiddleware, adminMiddleware, getUserStats);

// Export analytics data as CSV
router.get('/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await adapter.Order.find ? await adapter.Order.findAll ? await adapter.Order.findAll() : await adapter.Order.find() : [];
    // For revenue metrics, include orders that are paid OR have a valid status (processing, shipped, delivered)
    // This includes COD orders that are being processed
    const paidOrders = (Array.isArray(orders) ? orders : []).filter(o => {
      const isPaid = Boolean(o.isPaid === true || o.isPaid === 'true' || o.paid === true || o.paid === 'true' || o.isPaid || o.paid);
      const hasValidStatus = o.status && ['processing', 'shipped', 'delivered', 'pending'].includes(o.status.toLowerCase());
      return isPaid || hasValidStatus;
    });
    
    const totalSales = paidOrders.reduce((acc, o) => acc + (Number(o.total) || Number(o.totalPrice) || 0), 0);
    const totalOrders = paidOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Get user count
    let totalUsers = 0;
    if (adapter.User && typeof adapter.User.count === 'function') {
      totalUsers = await adapter.User.count();
    } else if (adapter.User && (typeof adapter.User.findAll === 'function' || typeof adapter.User.find === 'function')) {
      const users = await (adapter.User.findAll ? adapter.User.findAll() : adapter.User.find());
      totalUsers = Array.isArray(users) ? users.length : 0;
    }
    
    const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0;
    const orderCompletionRate = orders.length > 0 ? (totalOrders / orders.length) * 100 : 0;
    const revenuePerUser = totalUsers > 0 ? totalSales / totalUsers : 0;
    
    // Build CSV content
    let csv = 'Report Type,Value\n';
    csv += `Total Sales,${totalSales}\n`;
    csv += `Total Orders,${totalOrders}\n`;
    csv += `Average Order Value,${avgOrderValue.toFixed(2)}\n`;
    csv += `Total Users,${totalUsers}\n`;
    csv += `Conversion Rate,${conversionRate.toFixed(2)}%\n`;
    csv += `Order Completion Rate,${orderCompletionRate.toFixed(2)}%\n`;
    csv += `Revenue Per User,${revenuePerUser.toFixed(2)}\n\n`;
    
    // Sales by month
    csv += 'Month,Revenue,Orders\n';
    const salesByMonthMap = {};
    for (const o of paidOrders) {
      const d = new Date(o.createdAt || o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      salesByMonthMap[key] = salesByMonthMap[key] || { total: 0, count: 0 };
      salesByMonthMap[key].total += Number(o.total) || Number(o.totalPrice) || 0;
      salesByMonthMap[key].count += 1;
    }
    Object.keys(salesByMonthMap).sort().forEach(k => {
      csv += `${k},${salesByMonthMap[k].total},${salesByMonthMap[k].count}\n`;
    });
    
    csv += '\nOrder ID,Customer,Total,Status,Date\n';
    orders.forEach(o => {
      csv += `${o.id || o._id || ''},${o.customer || o.name || ''},${o.total || 0},${o.status || ''},${o.createdAt || ''}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.csv');
    res.send(csv);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

