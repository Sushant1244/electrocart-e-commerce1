const adapter = require('../models/adapter');
const pgConfig = require('../config/sequelize');
let Op;
try { Op = require('sequelize').Op; } catch (e) { /* ignore */ }

// GET /api/users - List all users (admin only)
exports.listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, verified } = req.query;
    const offset = (page - 1) * limit;
    
    let query = {};
    
    // Search by name or email
    if (search) {
      if (!pgConfig || !pgConfig.User) {
        return res.status(503).json({ success: false, message: 'Database not configured' });
      }
      if (!Op) {
        try { Op = require('sequelize').Op; } catch (e) {
          return res.status(503).json({ success: false, message: 'Sequelize not available' });
        }
      }
      query[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Filter by role (admin or regular user)
    if (role === 'admin') {
      query.isAdmin = true;
    } else if (role === 'user') {
      query.isAdmin = false;
    }
    
    // Filter by email verified status
    if (verified === 'true') {
      query.emailVerified = true;
    } else if (verified === 'false') {
      query.emailVerified = false;
    }
    
    const { User } = pgConfig || {};
    if (!User) {
      return res.status(503).json({ success: false, message: 'Database not configured' });
    }
    const { count, rows } = await User.findAndCountAll({
      where: query,
      attributes: { exclude: ['passwordHash'] },
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    const users = rows.map(u => {
      const obj = u.toJSON();
      obj._id = obj.id;
      return obj;
    });
    
    res.json({
      success: true,
      users,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/:id - Get user details (admin only)
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await adapter.User.findByIdSelect(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Get additional stats for the user
    if (!pgConfig || !pgConfig.Order) {
      return res.status(503).json({ success: false, message: 'Database not configured' });
    }
    const { Order } = pgConfig;
    const orderCount = await Order.count({ where: { userId: id } });
    
    res.json({
      success: true,
      user: {
        ...user,
        orderCount
      }
    });
  } catch (err) {
    console.error('getUser error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/users/:id - Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isAdmin, emailVerified } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;
    
    const user = await adapter.User.findByIdAndUpdate(id, updateData);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/users/:id - Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting yourself
    const currentUser = req.user;
    if (currentUser && (currentUser.id === parseInt(id) || currentUser._id === parseInt(id))) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    
    const { User } = pgConfig || {};
    if (!User) {
      return res.status(503).json({ success: false, message: 'Database not configured' });
    }
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    await user.destroy();
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/stats - Get user statistics (admin only)
exports.getUserStats = async (req, res) => {
  try {
    if (!pgConfig || !pgConfig.User) {
      return res.status(503).json({ success: false, message: 'Database not configured' });
    }
    const { User } = pgConfig;
    
    const totalUsers = await User.count();
    const adminUsers = await User.count({ where: { isAdmin: true } });
    const verifiedUsers = await User.count({ where: { emailVerified: true } });
    const unverifiedUsers = await User.count({ where: { emailVerified: false } });
    
    // Users created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (!Op) {
      try { Op = require('sequelize').Op; } catch (e) { /* ignore */ }
    }
    const newUsers = await User.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } });
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        adminUsers,
        verifiedUsers,
        unverifiedUsers,
        newUsers
      }
    });
  } catch (err) {
    console.error('getUserStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
