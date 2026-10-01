const adapter = require('../models/adapter');

// Generate report data with filtering options
exports.generateReport = async (req, res) => {
  try {
    const {
      reportType = 'orders', // orders, products, analytics, users
      startDate,
      endDate,
      status,
      category,
      format = 'json', // json, csv, excel, pdf
      includeDetails = true,
      groupBy = 'day', // day, week, month
      limit = 1000,
      offset = 0
    } = req.query;

    // Parse date filters
    let start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    let end = endDate ? new Date(endDate) : new Date();
    
    // Validate dates
    if (isNaN(start.getTime())) {
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    if (isNaN(end.getTime())) {
      end = new Date();
    }
    // Ensure start is before end
    if (start > end) {
      [start, end] = [end, start];
    }

    let reportData = {};
    let metadata = {
      reportType,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      generatedAt: new Date().toISOString(),
      format
    };

    switch (reportType) {
      case 'orders':
        let orders = [];
        try {
          if (adapter.Order && typeof adapter.Order.findAll === 'function') {
            orders = await adapter.Order.findAll();
          }
        } catch (e) {
          console.warn('Could not fetch orders:', e);
          orders = [];
        }
        
        let filteredOrders = (Array.isArray(orders) ? orders : []).filter(order => {
          const orderDate = new Date(order.createdAt || order.date || order.created_at || Date.now());
          const inDateRange = orderDate >= start && orderDate <= end;
          const matchesStatus = !status || status === 'all' || (order.status || '').toLowerCase() === status.toLowerCase();
          return inDateRange && matchesStatus;
        });

        // Sort by date descending
        filteredOrders.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
          return dateB - dateA;
        });

        // Apply pagination
        const totalOrders = filteredOrders.length;
        filteredOrders = filteredOrders.slice(offset, offset + limit);

        // Calculate summary
        const orderSummary = {
          totalOrders,
          totalRevenue: filteredOrders.reduce((sum, o) => sum + (Number(o.total) || Number(o.totalPrice) || 0), 0),
          pending: filteredOrders.filter(o => (o.status || '').toLowerCase() === 'pending').length,
          processing: filteredOrders.filter(o => (o.status || '').toLowerCase() === 'processing').length,
          shipped: filteredOrders.filter(o => (o.status || '').toLowerCase() === 'shipped').length,
          delivered: filteredOrders.filter(o => (o.status || '').toLowerCase() === 'delivered').length,
          cancelled: filteredOrders.filter(o => (o.status || '').toLowerCase() === 'cancelled').length,
          paid: filteredOrders.filter(o => o.isPaid === true || o.isPaid === 'true').length,
          unpaid: filteredOrders.filter(o => !(o.isPaid === true || o.isPaid === 'true')).length
        };

        reportData = {
          orders: includeDetails ? filteredOrders : [],
          summary: orderSummary,
          groupBy: groupByData(filteredOrders, groupBy, start, end)
        };
        metadata.totalRecords = totalOrders;
        break;

      case 'products':
        let products = [];
        try {
          if (adapter.Product && typeof adapter.Product.find === 'function') {
            products = await adapter.Product.find();
          }
        } catch (e) {
          console.warn('Could not fetch products:', e);
          products = [];
        }
        
        let filteredProducts = (Array.isArray(products) ? products : []).filter(product => {
          const matchesCategory = !category || category === 'all' || (product.category || '').toLowerCase() === category.toLowerCase();
          return matchesCategory;
        });

        const totalProducts = filteredProducts.length;
        filteredProducts = filteredProducts.slice(offset, offset + limit);

        // Calculate product summary
        const productSummary = {
          totalProducts,
          totalStock: filteredProducts.reduce((sum, p) => sum + (Number(p.stock) || Number(p.countInStock) || 0), 0),
          outOfStock: filteredProducts.filter(p => (Number(p.stock) || Number(p.countInStock) || 0) === 0).length,
          lowStock: filteredProducts.filter(p => (Number(p.stock) || Number(p.countInStock) || 0) < 20).length,
          categories: [...new Set(filteredProducts.map(p => p.category).filter(Boolean))]
        };

        reportData = {
          products: includeDetails ? filteredProducts : [],
          summary: productSummary
        };
        metadata.totalRecords = totalProducts;
        break;

      case 'analytics':
        let allOrders = [];
        try {
          if (adapter.Order && typeof adapter.Order.findAll === 'function') {
            allOrders = await adapter.Order.findAll();
          }
        } catch (e) {
          console.warn('Could not fetch orders for analytics:', e);
          allOrders = [];
        }
        
        const paidOrders = (Array.isArray(allOrders) ? allOrders : []).filter(o => {
          const isPaid = Boolean(o.isPaid === true || o.isPaid === 'true' || o.paid === true || o.paid === 'true');
          const hasValidStatus = o.status && ['processing', 'shipped', 'delivered', 'pending'].includes(o.status.toLowerCase());
          const orderDate = new Date(o.createdAt || o.date || Date.now());
          return (isPaid || hasValidStatus) && orderDate >= start && orderDate <= end;
        });

        const analyticsSummary = {
          totalSales: paidOrders.reduce((acc, o) => acc + (Number(o.total) || Number(o.totalPrice) || 0), 0),
          totalOrders: paidOrders.length,
          averageOrderValue: paidOrders.length > 0 ? paidOrders.reduce((acc, o) => acc + (Number(o.total) || Number(o.totalPrice) || 0), 0) / paidOrders.length : 0,
          salesByDay: groupByData(paidOrders, 'day', start, end),
          salesByMonth: groupByData(paidOrders, 'month', start, end),
          salesByWeek: groupByData(paidOrders, 'week', start, end)
        };

        reportData = {
          analytics: analyticsSummary,
          period: { start: start.toISOString(), end: end.toISOString() }
        };
        metadata.totalRecords = paidOrders.length;
        break;

      case 'users':
        let users = [];
        try {
          if (adapter.User) {
            if (typeof adapter.User.findAll === 'function') {
              users = await adapter.User.findAll();
            } else if (typeof adapter.User.find === 'function') {
              users = await adapter.User.find();
            }
          }
        } catch (e) {
          console.warn('Could not fetch users:', e);
          users = [];
        }

        let filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
          const userDate = new Date(user.createdAt || user.created_at || Date.now());
          return userDate >= start && userDate <= end;
        });

        const totalUsers = filteredUsers.length;
        filteredUsers = filteredUsers.slice(offset, offset + limit);

        const userSummary = {
          totalUsers,
          admins: filteredUsers.filter(u => u.isAdmin === true || u.isAdmin === 'true').length,
          regularUsers: filteredUsers.filter(u => !(u.isAdmin === true || u.isAdmin === 'true')).length
        };

        reportData = {
          users: includeDetails ? filteredUsers : [],
          summary: userSummary
        };
        metadata.totalRecords = totalUsers;
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    // Return metadata along with report data
    res.json({
      metadata,
      data: reportData
    });
  } catch (e) {
    console.error('Generate report error:', e);
    res.status(500).json({ message: e.message || 'Failed to generate report' });
  }
};

// Helper function to group data by time period
function groupByData(orders, groupBy, start, end) {
  const grouped = {};
  
  for (const order of orders) {
    const date = new Date(order.createdAt || order.date || Date.now());
    let key;
    
    switch (groupBy) {
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'day':
      default:
        key = date.toISOString().split('T')[0];
    }
    
    if (!grouped[key]) {
      grouped[key] = { period: key, total: 0, count: 0 };
    }
    grouped[key].total += Number(order.total) || Number(order.totalPrice) || 0;
    grouped[key].count += 1;
  }
  
  return Object.keys(grouped)
    .sort()
    .map(key => grouped[key]);
}

// Export report in specific format
exports.exportReport = async (req, res) => {
  try {
    const {
      reportType = 'orders',
      startDate,
      endDate,
      status,
      category,
      format = 'csv'
    } = req.query;

    // Parse date filters
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Validate dates
    let validStart = start;
    let validEnd = end;
    if (isNaN(start.getTime())) {
      validStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    if (isNaN(end.getTime())) {
      validEnd = new Date();
    }
    if (validStart > validEnd) {
      [validStart, validEnd] = [validEnd, validStart];
    }

    let exportData;
    let contentType;
    let filename;

    switch (reportType) {
      case 'orders':
      case 'analytics': {
        let orders = [];
        try {
          if (adapter.Order && typeof adapter.Order.findAll === 'function') {
            orders = await adapter.Order.findAll();
          }
        } catch (e) {
          console.warn('Could not fetch orders:', e);
          orders = [];
        }
        
        // Filter orders
        let filteredOrders = (Array.isArray(orders) ? orders : []).filter(order => {
          const orderDate = new Date(order.createdAt || order.date || Date.now());
          const inDateRange = orderDate >= validStart && orderDate <= validEnd;
          const matchesStatus = !status || status === 'all' || (order.status || '').toLowerCase() === status.toLowerCase();
          return inDateRange && matchesStatus;
        });

        // Generate export based on format
        switch (format.toLowerCase()) {
          case 'csv':
            exportData = generateCSV(filteredOrders, reportType);
            contentType = 'text/csv';
            filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case 'json':
            exportData = JSON.stringify(filteredOrders, null, 2);
            contentType = 'application/json';
            filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
            break;
          case 'excel':
          case 'xlsx':
            exportData = generateCSV(filteredOrders, reportType);
            contentType = 'application/vnd.ms-excel';
            filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.xls`;
            break;
          default:
            return res.status(400).json({ message: 'Unsupported export format' });
        }
        break;
      }

      case 'products': {
        let products = [];
        try {
          if (adapter.Product) {
            if (typeof adapter.Product.findAll === 'function') {
              products = await adapter.Product.findAll();
            } else if (typeof adapter.Product.find === 'function') {
              products = await adapter.Product.find();
            }
          }
        } catch (e) {
          console.warn('Could not fetch products:', e);
          products = [];
        }

        let filteredProducts = (Array.isArray(products) ? products : []).filter(product => {
          const matchesCategory = !category || category === 'all' || (product.category || '').toLowerCase() === category.toLowerCase();
          return matchesCategory;
        });

        switch (format.toLowerCase()) {
          case 'csv':
            exportData = generateProductsCSV(filteredProducts);
            contentType = 'text/csv';
            filename = `products_report_${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case 'json':
            exportData = JSON.stringify(filteredProducts, null, 2);
            contentType = 'application/json';
            filename = `products_report_${new Date().toISOString().split('T')[0]}.json`;
            break;
          case 'excel':
          case 'xlsx':
            exportData = generateProductsCSV(filteredProducts);
            contentType = 'application/vnd.ms-excel';
            filename = `products_report_${new Date().toISOString().split('T')[0]}.xls`;
            break;
          default:
            return res.status(400).json({ message: 'Unsupported export format' });
        }
        break;
      }

      case 'users': {
        let users = [];
        try {
          if (adapter.User) {
            if (typeof adapter.User.findAll === 'function') {
              users = await adapter.User.findAll();
            } else if (typeof adapter.User.find === 'function') {
              users = await adapter.User.find();
            }
          }
        } catch (e) {
          console.warn('Could not fetch users:', e);
          users = [];
        }

        let filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
          const userDate = new Date(user.createdAt || user.created_at || Date.now());
          return userDate >= validStart && userDate <= validEnd;
        });

        switch (format.toLowerCase()) {
          case 'csv':
            exportData = generateUsersCSV(filteredUsers);
            contentType = 'text/csv';
            filename = `users_report_${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case 'json':
            exportData = JSON.stringify(filteredUsers, null, 2);
            contentType = 'application/json';
            filename = `users_report_${new Date().toISOString().split('T')[0]}.json`;
            break;
          case 'excel':
          case 'xlsx':
            exportData = generateUsersCSV(filteredUsers);
            contentType = 'application/vnd.ms-excel';
            filename = `users_report_${new Date().toISOString().split('T')[0]}.xls`;
            break;
          default:
            return res.status(400).json({ message: 'Unsupported export format' });
        }
        break;
      }

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(exportData);
  } catch (e) {
    console.error('Export report error:', e);
    res.status(500).json({ message: e.message || 'Failed to export report' });
  }
};

// Generate CSV content
function generateCSV(orders, reportType) {
  if (!orders || orders.length === 0) {
    return 'No data available';
  }

  let headers;
  let rows;

  switch (reportType) {
    case 'orders':
      headers = ['Order ID', 'Customer Name', 'Email', 'Phone', 'Total Amount', 'Status', 'Payment Method', 'Payment Status', 'Delivery Status', 'Created Date', 'Shipping Address'];
      rows = orders.map(order => [
        order.id || order._id || '',
        getNestedValue(order, 'shippingAddress.fullName') || getNestedValue(order, 'shippingAddress.name') || order.customerName || order.name || '',
        order.email || '',
        getNestedValue(order, 'shippingAddress.phone') || '',
        order.total || order.totalPrice || 0,
        order.status || '',
        order.paymentMethod || '',
        order.isPaid ? 'Paid' : 'Unpaid',
        order.deliveryStatus || '',
        order.createdAt || order.date || '',
        formatAddress(order.shippingAddress)
      ].map(val => String(val).replace(/"/g, '""')));
      break;

    case 'analytics':
      headers = ['Period', 'Total Revenue', 'Order Count', 'Average Order Value'];
      rows = groupOrdersByPeriod(orders).map(group => [
        group.period,
        group.total.toFixed(2),
        group.count,
        group.count > 0 ? (group.total / group.count).toFixed(2) : '0.00'
      ].map(val => String(val).replace(/"/g, '""')));
      break;

    default:
      headers = ['ID', 'Created Date', 'Total'];
      rows = orders.map(order => [
        order.id || order._id || '',
        order.createdAt || order.date || '',
        order.total || order.totalPrice || 0
      ].map(val => String(val).replace(/"/g, '""')));
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${val}"`).join(','))
  ].join('\n');

  return csvContent;
}

// Generate CSV for products report
function generateProductsCSV(products) {
  if (!products || products.length === 0) {
    return 'No data available';
  }

  const headers = ['Product ID', 'Name', 'Category', 'Price', 'Stock', 'Brand', 'Description', 'Created Date'];
  const rows = products.map(product => [
    product.id || product._id || '',
    product.name || '',
    product.category || '',
    product.price || 0,
    product.stock || product.countInStock || 0,
    product.brand || '',
    (product.description || '').substring(0, 100),
    product.createdAt || product.date || ''
  ].map(val => String(val).replace(/"/g, '""')));

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${val}"`).join(','))
  ].join('\n');

  return csvContent;
}

// Generate CSV for users report
function generateUsersCSV(users) {
  if (!users || users.length === 0) {
    return 'No data available';
  }

  const headers = ['User ID', 'Name', 'Email', 'Phone', 'Is Admin', 'Created Date'];
  const rows = users.map(user => [
    user.id || user._id || '',
    user.name || user.fullName || '',
    user.email || '',
    user.phone || '',
    user.isAdmin === true || user.isAdmin === 'true' ? 'Yes' : 'No',
    user.createdAt || user.created_at || ''
  ].map(val => String(val).replace(/"/g, '""')));

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${val}"`).join(','))
  ].join('\n');

  return csvContent;
}

// Helper to get nested values
function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// Format shipping address
function formatAddress(address) {
  if (!address) return '';
  const parts = [
    address.line1 || address.address || '',
    address.city || '',
    address.state || '',
    address.country || '',
    address.zip || address.postalCode || ''
  ].filter(Boolean);
  return parts.join(', ');
}

// Group orders by period
function groupOrdersByPeriod(orders) {
  const grouped = {};
  
  for (const order of orders) {
    const date = new Date(order.createdAt || order.date || Date.now());
    const key = date.toISOString().split('T')[0];
    
    if (!grouped[key]) {
      grouped[key] = { period: key, total: 0, count: 0 };
    }
    grouped[key].total += Number(order.total) || Number(order.totalPrice) || 0;
    grouped[key].count += 1;
  }
  
  return Object.keys(grouped)
    .sort()
    .map(key => grouped[key]);
}

// Get available report options
exports.getReportOptions = async (req, res) => {
  try {
    // Get unique categories from products
    let categories = [];
    try {
      const products = await (adapter.Product.find ? adapter.Product.find() : []);
      if (Array.isArray(products)) {
        categories = [...new Set(products.map(p => p.category).filter(Boolean))];
      }
    } catch (e) {
      console.warn('Could not fetch categories:', e);
    }

    // Get unique statuses from orders
    let statuses = [];
    try {
      const orders = await adapter.Order.findAll();
      if (Array.isArray(orders)) {
        statuses = [...new Set(orders.map(o => o.status).filter(Boolean))];
      }
    } catch (e) {
      console.warn('Could not fetch statuses:', e);
    }

    res.json({
      reportTypes: [
        { value: 'orders', label: 'Orders Report' },
        { value: 'products', label: 'Products Report' },
        { value: 'analytics', label: 'Analytics Report' },
        { value: 'users', label: 'Users Report' }
      ],
      formats: [
        { value: 'csv', label: 'CSV (Comma Separated Values)' },
        { value: 'json', label: 'JSON' },
        { value: 'excel', label: 'Excel' }
      ],
      periods: [
        { value: '7', label: 'Last 7 Days' },
        { value: '30', label: 'Last 30 Days' },
        { value: '90', label: 'Last 90 Days' },
        { value: '365', label: 'Last Year' },
        { value: 'custom', label: 'Custom Range' }
      ],
      groupBy: [
        { value: 'day', label: 'Daily' },
        { value: 'week', label: 'Weekly' },
        { value: 'month', label: 'Monthly' }
      ],
      statuses: statuses.map(s => ({ value: s, label: s })),
      categories: categories.map(c => ({ value: c, label: c }))
    });
  } catch (e) {
    console.error('Get report options error:', e);
    res.status(500).json({ message: e.message });
  }
};

// Export analytics report (legacy endpoint for backward compatibility)
exports.exportAnalyticsReport = async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const orders = await adapter.Order.findAll();
    
    // Filter orders by date
    const filteredOrders = (Array.isArray(orders) ? orders : []).filter(order => {
      const orderDate = new Date(order.createdAt || order.date || Date.now());
      return orderDate >= start && orderDate <= end;
    });
    
    // Generate CSV
    let csvContent;
    if (format === 'csv' || format === 'excel') {
      const headers = ['Order ID', 'Customer', 'Email', 'Total', 'Status', 'Payment Status', 'Date'];
      const rows = filteredOrders.map(order => [
        order.id || order._id || '',
        getNestedValue(order, 'shippingAddress.fullName') || '',
        order.email || '',
        order.total || order.totalPrice || 0,
        order.status || '',
        order.isPaid ? 'Paid' : 'Unpaid',
        order.createdAt || order.date || ''
      ]);
      
      csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    } else {
      csvContent = JSON.stringify(filteredOrders, null, 2);
    }
    
    const filename = `analytics_report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.${format === 'json' ? 'json' : 'csv'}`;
    
    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(csvContent);
  } catch (e) {
    console.error('Export analytics error:', e);
    res.status(500).json({ message: e.message });
  }
};
