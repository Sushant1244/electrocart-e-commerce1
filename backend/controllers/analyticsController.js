const adapter = require('../models/adapter');

// Get enhanced sales statistics
exports.getSalesStats = async (req, res) => {
  try {
    // Use adapter.Order to compute simple aggregates. For complex analytics, consider
    // adding raw SQL queries or a dedicated analytics table.
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
    
    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Sales by month (YYYY-MM)
    const salesByMonthMap = {};
    for (const o of paidOrders) {
      const d = new Date(o.createdAt || o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      salesByMonthMap[key] = salesByMonthMap[key] || { total: 0, count: 0 };
      salesByMonthMap[key].total += Number(o.total) || Number(o.totalPrice) || 0;
      salesByMonthMap[key].count += 1;
    }
    const salesByMonth = Object.keys(salesByMonthMap).sort().map(k => ({ month: k, ...salesByMonthMap[k] }));

    // Sales by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const salesByDayMap = {};
    for (const o of paidOrders) {
      const d = new Date(o.createdAt || o.createdAt);
      if (d >= thirtyDaysAgo) {
        const key = d.toISOString().split('T')[0];
        salesByDayMap[key] = salesByDayMap[key] || { total: 0, count: 0 };
        salesByDayMap[key].total += Number(o.total) || Number(o.totalPrice) || 0;
        salesByDayMap[key].count += 1;
      }
    }
    const salesByDay = Object.keys(salesByDayMap).sort().map(k => ({ date: k, ...salesByDayMap[k] }));

    // Sales by week (last 12 weeks)
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
    const salesByWeekMap = {};
    for (const o of paidOrders) {
      const d = new Date(o.createdAt || o.createdAt);
      if (d >= twelveWeeksAgo) {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toISOString().split('T')[0];
        salesByWeekMap[key] = salesByWeekMap[key] || { total: 0, count: 0 };
        salesByWeekMap[key].total += Number(o.total) || Number(o.totalPrice) || 0;
        salesByWeekMap[key].count += 1;
      }
    }
    const salesByWeek = Object.keys(salesByWeekMap).sort().map(k => ({ week: k, ...salesByWeekMap[k] }));

    // top products by items sold
    const productTotals = {};
    for (const o of paidOrders) {
      const items = o.items || [];
      for (const it of items) {
        const pid = it.product || (it.productId || it.product_id);
        const qty = Number(it.quantity) || 0;
        const price = Number(it.price) || 0;
        productTotals[pid] = productTotals[pid] || { totalSold: 0, totalRevenue: 0 };
        productTotals[pid].totalSold += qty;
        productTotals[pid].totalRevenue += qty * price;
      }
    }

    const topProductsArr = Object.keys(productTotals).map(pid => ({ productId: pid, ...productTotals[pid] }));
    topProductsArr.sort((a, b) => b.totalSold - a.totalSold);
    const topProducts = topProductsArr.slice(0, 10);

    // Try to enrich with product names when possible
    const productIds = topProducts.map(p => p.productId).filter(Boolean);
    const products = (productIds.length && adapter.Product.find) ? await adapter.Product.find({ id: productIds }) : [];
    const nameMap = {};
    for (const p of Array.isArray(products) ? products : []) nameMap[p.id || p._id || p.productId] = p.name;
    const topProductsWithNames = topProducts.map(tp => ({ ...tp, productName: nameMap[tp.productId] || null }));

    // Revenue by category
    const categoryRevenue = {};
    const categoryOrders = {};
    for (const o of paidOrders) {
      const items = o.items || [];
      for (const it of items) {
        const pid = it.product || (it.productId || it.product_id);
        const qty = Number(it.quantity) || 0;
        const price = Number(it.price) || 0;
        // Try to get category from product
        if (adapter.Product && adapter.Product.find) {
          const prods = await adapter.Product.find({ id: [pid] });
          const prod = Array.isArray(prods) ? prods.find(p => p.id === pid || p._id === pid) : prods;
          if (prod && prod.category) {
            const cat = prod.category;
            categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (qty * price);
            categoryOrders[cat] = (categoryOrders[cat] || 0) + qty;
          }
        }
      }
    }
    const revenueByCategory = Object.keys(categoryRevenue).map(cat => ({
      category: cat,
      revenue: categoryRevenue[cat],
      orders: categoryOrders[cat]
    })).sort((a, b) => b.revenue - a.revenue);

    // Order status breakdown (all orders, not just paid)
    const orderStatus = {};
    for (const o of orders) {
      const status = o.status || 'unknown';
      orderStatus[status] = (orderStatus[status] || 0) + 1;
    }
    const ordersByStatus = Object.keys(orderStatus).map(status => ({ status, count: orderStatus[status] }));

    // Calculate conversion metrics
    // Get user count
    let totalUsers = 0;
    if (adapter.User && typeof adapter.User.count === 'function') {
      totalUsers = await adapter.User.count();
    } else if (adapter.User && (typeof adapter.User.findAll === 'function' || typeof adapter.User.find === 'function')) {
      const users = await (adapter.User.findAll ? adapter.User.findAll() : adapter.User.find());
      totalUsers = Array.isArray(users) ? users.length : 0;
    }
    
    // Conversion metrics
    const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0;
    const orderCompletionRate = orders.length > 0 ? (totalOrders / orders.length) * 100 : 0;
    const revenuePerUser = totalUsers > 0 ? totalSales / totalUsers : 0;
    
    // Calculate average items per order
    let totalItems = 0;
    for (const o of paidOrders) {
      const items = o.items || [];
      for (const it of items) {
        totalItems += Number(it.quantity) || 0;
      }
    }
    const avgItemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0;

    // Conversion funnel - order stages
    const orderStages = {
      'total': orders.length,
      'paid': totalOrders,
      'pending': orders.filter(o => o.status === 'pending').length,
      'processing': orders.filter(o => o.status === 'processing').length,
      'shipped': orders.filter(o => o.status === 'shipped').length,
      'delivered': orders.filter(o => o.status === 'delivered').length,
      'cancelled': orders.filter(o => o.status === 'cancelled').length
    };

    res.json({ 
      totalSales, 
      totalOrders, 
      avgOrderValue,
      salesByMonth, 
      salesByDay,
      salesByWeek,
      topProducts: topProductsWithNames,
      revenueByCategory,
      ordersByStatus,
      conversionMetrics: {
        conversionRate: conversionRate.toFixed(2),
        orderCompletionRate: orderCompletionRate.toFixed(2),
        revenuePerUser: revenuePerUser.toFixed(2),
        avgItemsPerOrder: avgItemsPerOrder.toFixed(2),
        totalUsers
      },
      orderStages
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    // Try to use adapter.User.count where available (e.g., Sequelize). Fall back to find/findAll length.
    let totalUsers = 0;
    if (adapter.User && typeof adapter.User.count === 'function') {
      totalUsers = await adapter.User.count();
    } else if (adapter.User && (typeof adapter.User.findAll === 'function' || typeof adapter.User.find === 'function')) {
      const users = await (adapter.User.findAll ? adapter.User.findAll() : adapter.User.find());
      totalUsers = Array.isArray(users) ? users.length : 0;
    } else {
      // If there's an in-memory store helper, try to read it (best-effort)
      totalUsers = 0;
    }

    // Optionally provide additional breakdowns in future (e.g., admins, recent signups)
    res.json({ totalUsers });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

