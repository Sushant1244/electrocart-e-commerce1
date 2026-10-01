/*
  Adapter layer to present a consistent API to controllers.
  This version is Postgres-only (Sequelize). If Sequelize models are not available,
  adapter methods will be present but return null or empty arrays where appropriate.
*/
const pgConfig = require('../config/sequelize');
// Only require sequelize if pgConfig is available to avoid crashes in serverless environments
let Op;
if (pgConfig) {
  try {
    const sequelize = require('sequelize');
    Op = sequelize.Op;
  } catch (e) {
    console.warn('Failed to load sequelize Op:', e?.message);
  }
}

const adapter = {};

if (pgConfig && pgConfig.Product) {
  const { Product: PgProduct, User: PgUser, Order: PgOrder, Wishlist: PgWishlist, CartItem: PgCartItem, Review: PgReview } = pgConfig;
  const NotificationModel = pgConfig.Notification;
  const PaymentMethodModel = pgConfig.PaymentMethod;

  adapter.Product = {
    create: async (data) => {
      const inst = await PgProduct.create(data);
  const obj = inst.toJSON();
  obj._id = obj.id;
  obj.images = obj.images || obj.imagesJson || [];
  // normalize stock field for frontend compatibility
  obj.stock = obj.stock || obj.countInStock || 0;
  return obj;
    },
    findOne: async (query) => {
  const inst = await PgProduct.findOne({ where: query });
  if (!inst) return null;
  const obj = inst.toJSON();
  obj._id = obj.id;
  obj.images = obj.images || obj.imagesJson || [];
  obj.stock = obj.stock || obj.countInStock || 0;
  return obj;
    },
    findById: async (id) => {
  const inst = await PgProduct.findByPk(id);
  if (!inst) return null;
  const obj = inst.toJSON();
  obj._id = obj.id;
  obj.images = obj.images || obj.imagesJson || [];
  obj.stock = obj.stock || obj.countInStock || 0;
  return obj;
    },
    findByIdAndUpdate: async (id, update) => {
      const inst = await PgProduct.findByPk(id);
      if (!inst) return null;
      await inst.update(update);
      await inst.reload(); const obj = inst.toJSON(); obj._id = obj.id; obj.images = obj.images || obj.imagesJson || []; return obj;
    },
    findByIdAndDelete: async (id) => {
      const inst = await PgProduct.findByPk(id);
      if (!inst) return null;
      await inst.destroy();
      return inst;
    },
    find: async (query = {}, opts = {}) => {
      const where = query;
      const order = opts.sort ? [[opts.sort.field, opts.sort.dir || 'DESC']] : [['createdAt', 'DESC']];
      const rows = await PgProduct.findAll({ where, order });
      return rows.map(r => {
        const o = r.toJSON();
        o._id = o.id;
        o.images = o.images || o.imagesJson || [];
        o.stock = o.stock || o.countInStock || 0;
        return o;
      });
    },
    findBySlug: async (slug) => {
      const inst = await PgProduct.findOne({ where: { slug } });
      if (!inst) return null;
      const obj = inst.toJSON();
      obj._id = obj.id;
      obj.images = obj.images || obj.imagesJson || [];
      obj.stock = obj.stock || obj.countInStock || 0;
      return obj;
    },
  };

  adapter.User = {
    findOne: async (query) => {
      const inst = await PgUser.findOne({ where: query });
      if (!inst) return null;
      const obj = inst.toJSON(); obj.password = obj.passwordHash; return obj;
    },
    create: async (data) => {
      const createData = { ...data };
      if (createData.password) { createData.passwordHash = createData.password; delete createData.password; }
      const inst = await PgUser.create(createData);
      const obj = inst.toJSON(); obj.password = obj.passwordHash; return obj;
    },
    findById: async (id) => {
      const inst = await PgUser.findByPk(id);
      if (!inst) return null; const obj = inst.toJSON(); obj._id = obj.id; obj.password = obj.passwordHash; return obj;
    },
    findByIdSelect: async (id) => {
      const inst = await PgUser.findByPk(id);
      if (!inst) return null; const obj = inst.toJSON(); delete obj.passwordHash; obj._id = obj.id; return obj;
    },
    // Find users by query (returns array)
    find: async (query = {}) => {
      const where = query;
      const rows = await PgUser.findAll({ where });
      return rows.map(r => { const o = r.toJSON(); o._id = o.id; o.password = o.passwordHash; return o; });
    },
    // Update user by id
    findByIdAndUpdate: async (id, update) => {
      const inst = await PgUser.findByPk(id);
      if (!inst) return null;
      // map password to passwordHash if present
      const data = { ...update };
      if (data.password) { data.passwordHash = data.password; delete data.password; }
      await inst.update(data);
      await inst.reload(); const obj = inst.toJSON(); obj._id = obj.id; obj.password = obj.passwordHash; return obj;
    },
    // Count users
    count: async () => {
      return await PgUser.count();
    }
  };

  adapter.Order = {
    create: async (data) => {
      const inst = await PgOrder.create(data);
  const obj = inst.toJSON(); obj._id = obj.id; obj.id = obj.id || obj._id; obj.items = obj.orderItems || obj.items || [];
      // normalize deliveryUpdates timestamps
      if (Array.isArray(obj.deliveryUpdates)) {
        obj.deliveryUpdates = obj.deliveryUpdates.map(u => ({ ...u, timestamp: u.timestamp || u.date || null }));
      }
  // attach user info when available
  if (obj.userId && PgUser) {
        try {
          const uInst = await PgUser.findByPk(obj.userId);
          if (uInst) { const u = uInst.toJSON(); delete u.passwordHash; u._id = u.id; obj.user = u; }
        } catch (e) { /* ignore */ }
      }
  // provide convenient top-level customer/email fields for admin UI
  obj.customer = obj.user?.name || obj.user?.fullName || obj.shippingAddress?.fullName || obj.shippingAddress?.name || null;
  obj.email = obj.user?.email || obj.shippingAddress?.email || null;
  // normalize total and date for frontend
  obj.total = obj.totalPrice ?? obj.total ?? 0;
  obj.date = obj.createdAt || obj.date || null;
      return obj;
    },
    find: async (query) => {
      const rows = await PgOrder.findAll({ where: query });
      return Promise.all(rows.map(async r => {
    const o = r.toJSON(); o._id = o.id; o.id = o.id || o._id; o.items = o.orderItems || o.items || [];
        if (Array.isArray(o.deliveryUpdates)) { o.deliveryUpdates = o.deliveryUpdates.map(u => ({ ...u, timestamp: u.timestamp || u.date || null })); }
  if (o.userId && PgUser) {
          try { const uInst = await PgUser.findByPk(o.userId); if (uInst) { const u = uInst.toJSON(); delete u.passwordHash; u._id = u.id; o.user = u; } } catch (e) {}
        }
  // top-level convenience fields
  o.customer = o.user?.name || o.user?.fullName || o.shippingAddress?.fullName || o.shippingAddress?.name || null;
  o.email = o.user?.email || o.shippingAddress?.email || null;
  o.total = o.totalPrice ?? o.total ?? 0;
  o.date = o.createdAt || o.date || null;
  return o;
      }));
    },
    findById: async (id) => {
      const inst = await PgOrder.findByPk(id);
    if (!inst) return null; const obj = inst.toJSON(); obj._id = obj.id; obj.id = obj.id || obj._id; obj.items = obj.orderItems || obj.items || [];
      if (Array.isArray(obj.deliveryUpdates)) { obj.deliveryUpdates = obj.deliveryUpdates.map(u => ({ ...u, timestamp: u.timestamp || u.date || null })); }
  if (obj.userId && PgUser) {
        try { const uInst = await PgUser.findByPk(obj.userId); if (uInst) { const u = uInst.toJSON(); delete u.passwordHash; u._id = u.id; obj.user = u; } } catch (e) {}
      }
  obj.customer = obj.user?.name || obj.user?.fullName || obj.shippingAddress?.fullName || obj.shippingAddress?.name || null;
  obj.email = obj.user?.email || obj.shippingAddress?.email || null;
  obj.total = obj.totalPrice ?? obj.total ?? 0;
  obj.date = obj.createdAt || obj.date || null;
  return obj;
    },
    findAll: async () => {
      const rows = await PgOrder.findAll();
      return Promise.all(rows.map(async r => {
      const o = r.toJSON(); o._id = o.id; o.id = o.id || o._id; o.items = o.orderItems || o.items || [];
        if (Array.isArray(o.deliveryUpdates)) { o.deliveryUpdates = o.deliveryUpdates.map(u => ({ ...u, timestamp: u.timestamp || u.date || null })); }
  if (o.userId && PgUser) {
          try { const uInst = await PgUser.findByPk(o.userId); if (uInst) { const u = uInst.toJSON(); delete u.passwordHash; u._id = u.id; o.user = u; } } catch (e) {}
        }
  o.customer = o.user?.name || o.user?.fullName || o.shippingAddress?.fullName || o.shippingAddress?.name || null;
  o.email = o.user?.email || o.shippingAddress?.email || null;
    o.total = o.totalPrice ?? o.total ?? 0;
    o.date = o.createdAt || o.date || null;
  return o;
      }));
    },
    findByIdAndUpdate: async (id, update) => {
      const inst = await PgOrder.findByPk(id);
      if (!inst) return null; await inst.update(update); await inst.reload(); const obj = inst.toJSON(); obj._id = obj.id; obj.id = obj.id || obj._id; obj.items = obj.orderItems || obj.items || [];
      if (Array.isArray(obj.deliveryUpdates)) { obj.deliveryUpdates = obj.deliveryUpdates.map(u => ({ ...u, timestamp: u.timestamp || u.date || null })); }
  if (obj.userId && PgUser) {
        try { const uInst = await PgUser.findByPk(obj.userId); if (uInst) { const u = uInst.toJSON(); delete u.passwordHash; u._id = u.id; obj.user = u; } } catch (e) {}
      }
  obj.customer = obj.user?.name || obj.user?.fullName || obj.shippingAddress?.fullName || obj.shippingAddress?.name || null;
  obj.email = obj.user?.email || obj.shippingAddress?.email || null;
  obj.total = obj.totalPrice ?? obj.total ?? 0;
  obj.date = obj.createdAt || obj.date || null;
  return obj;
    }
  };

  adapter.Notification = {
    create: async (data) => {
      if (!NotificationModel) return null;
      const inst = await NotificationModel.create(data);
      const obj = inst.toJSON(); obj._id = obj.id; return obj;
    },
    find: async (query = {}) => {
      if (!NotificationModel) return [];
      const rows = await NotificationModel.findAll({ where: query, order: [['createdAt', 'DESC']] });
      return rows.map(r => { const o = r.toJSON(); o._id = o.id; return o; });
    },
    findByIdAndUpdate: async (id, update) => {
      if (!NotificationModel) return null;
      const inst = await NotificationModel.findByPk(id);
      if (!inst) return null; await inst.update(update); await inst.reload(); const obj = inst.toJSON(); obj._id = obj.id; return obj;
    }
    ,
    // Delete notifications older than X days, and optionally delete read notifications older than Y days.
    // Returns number of records deleted.
    deleteOlderThan: async ({ olderThanDays = 30, readOlderThanDays = 7 } = {}) => {
      if (!NotificationModel) return 0;
      try {
        const now = Date.now();
        const olderThanDate = new Date(now - (Number(olderThanDays) * 24 * 60 * 60 * 1000));
        const readOlderDate = new Date(now - (Number(readOlderThanDays) * 24 * 60 * 60 * 1000));
        const where = { [Op.or]: [ { createdAt: { [Op.lt]: olderThanDate } }, { read: true, createdAt: { [Op.lt]: readOlderDate } } ] };
        const deleted = await NotificationModel.destroy({ where });
        return deleted || 0;
      } catch (e) {
        console.warn('adapter.Notification.deleteOlderThan failed', e && e.message ? e.message : e);
        return 0;
      }
    }
  };

  // Wishlist adapter
  adapter.Wishlist = {
    create: async (data) => {
      if (!PgWishlist) return null;
      const inst = await PgWishlist.create(data);
      const obj = inst.toJSON(); obj._id = obj.id; return obj;
    },
    find: async (query = {}) => {
      if (!PgWishlist) return [];
      const rows = await PgWishlist.findAll({ where: query, order: [['createdAt', 'DESC']] });
      return rows.map(r => { const o = r.toJSON(); o._id = o.id; return o; });
    },
    findOne: async (query = {}) => {
      if (!PgWishlist) return null;
      const inst = await PgWishlist.findOne({ where: query }); if (!inst) return null; const o = inst.toJSON(); o._id = o.id; return o;
    },
    remove: async (query = {}) => {
      if (!PgWishlist) return 0;
      const deleted = await PgWishlist.destroy({ where: query }); return deleted || 0;
    }
  };

  // CartItem adapter
  adapter.CartItem = {
    create: async (data) => { if (!PgCartItem) return null; const inst = await PgCartItem.create(data); const o = inst.toJSON(); o._id = o.id; return o; },
    find: async (query = {}) => { if (!PgCartItem) return []; const rows = await PgCartItem.findAll({ where: query, order: [['createdAt', 'DESC']] }); return rows.map(r => { const o = r.toJSON(); o._id = o.id; return o; }); },
    updateById: async (id, update) => { if (!PgCartItem) return null; const inst = await PgCartItem.findByPk(id); if (!inst) return null; await inst.update(update); await inst.reload(); const o = inst.toJSON(); o._id = o.id; return o; },
    deleteById: async (id) => { if (!PgCartItem) return 0; const inst = await PgCartItem.findByPk(id); if (!inst) return 0; await inst.destroy(); return 1; }
  };

  // PaymentMethod adapter
  adapter.PaymentMethod = {
    create: async (data) => {
      if (!PaymentMethodModel) return null;
      const inst = await PaymentMethodModel.create(data);
      const obj = inst.toJSON(); obj._id = obj.id; return obj;
    },
    find: async (query = {}) => {
      if (!PaymentMethodModel) return [];
      const rows = await PaymentMethodModel.findAll({ where: query, order: [['createdAt', 'DESC']] });
      return rows.map(r => { const o = r.toJSON(); o._id = o.id; return o; });
    },
    findOne: async (query = {}) => {
      if (!PaymentMethodModel) return null;
      const inst = await PaymentMethodModel.findOne({ where: query });
      if (!inst) return null;
      const o = inst.toJSON(); o._id = o.id; return o;
    },
    findById: async (id) => {
      if (!PaymentMethodModel) return null;
      const inst = await PaymentMethodModel.findByPk(id);
      if (!inst) return null;
      const o = inst.toJSON(); o._id = o.id; return o;
    },
    findByIdAndUpdate: async (id, update) => {
      if (!PaymentMethodModel) return null;
      const inst = await PaymentMethodModel.findByPk(id);
      if (!inst) return null;
      await inst.update(update);
      await inst.reload();
      const o = inst.toJSON(); o._id = o.id; return o;
    },
    deleteById: async (id) => {
      if (!PaymentMethodModel) return 0;
      const inst = await PaymentMethodModel.findByPk(id);
      if (!inst) return 0;
      await inst.destroy();
      return 1;
    }
  };

  // Review adapter - handles missing pgConfig.Review gracefully
  adapter.Review = {
    findAll: async (query = {}) => {
      if (!PgReview) return [];
      const rows = await PgReview.findAll({ where: query, order: [['createdAt', 'DESC']] });
      return rows.map(r => { const o = r.toJSON(); o._id = o.id; return o; });
    },
    findById: async (id) => {
      if (!PgReview) return null;
      const inst = await PgReview.findByPk(id);
      if (!inst) return null;
      const obj = inst.toJSON(); obj._id = obj.id; return obj;
    },
    findByIdAndUpdate: async (id, update) => {
      if (!PgReview) return null;
      const inst = await PgReview.findByPk(id);
      if (!inst) return null;
      await inst.update(update);
      await inst.reload(); const obj = inst.toJSON(); obj._id = obj.id; return obj;
    },
    findByIdAndDelete: async (id) => {
      if (!PgReview) return { success: true };
      const inst = await PgReview.findByPk(id);
      if (!inst) return null;
      await inst.destroy();
      return { success: true };
    },
    count: async (query = {}) => {
      if (!PgReview) return 0;
      return await PgReview.count({ where: query });
    }
  };

} else {
  // Minimal stubs when PG models are not present. Controllers should handle nulls and fall back
  // to in-memory stores where appropriate.
  adapter.Product = {
    create: async () => null,
    findOne: async () => null,
    findById: async () => null,
    findByIdAndUpdate: async () => null,
    findByIdAndDelete: async () => null,
    find: async () => [],
    findBySlug: async () => null,
  };

  adapter.User = {
    findOne: async () => null,
    create: async () => null,
    findById: async () => null,
    findByIdSelect: async () => null,
  };

  adapter.Order = {
    create: async () => null,
    find: async () => [],
    findById: async () => null,
    findAll: async () => [],
    findByIdAndUpdate: async () => null,
  };

  // Review adapter stub - only available if pgConfig.Review exists
  const PgReview = pgConfig && pgConfig.Review;
  adapter.Review = {
    findAll: async (query = {}) => {
      if (!PgReview) return [];
      const rows = await PgReview.findAll({ where: query, order: [['createdAt', 'DESC']] });
      return rows.map(r => { const o = r.toJSON(); o._id = o.id; return o; });
    },
    findById: async (id) => {
      if (!PgReview) return null;
      const inst = await PgReview.findByPk(id);
      if (!inst) return null;
      const obj = inst.toJSON(); obj._id = obj.id; return obj;
    },
    findByIdAndUpdate: async (id, update) => {
      if (!PgReview) return null;
      const inst = await PgReview.findByPk(id);
      if (!inst) return null;
      await inst.update(update);
      await inst.reload(); const obj = inst.toJSON(); obj._id = obj.id; return obj;
    },
    findByIdAndDelete: async (id) => {
      if (!PgReview) return { success: true };
      const inst = await PgReview.findByPk(id);
      if (!inst) return null;
      await inst.destroy();
      return { success: true };
    },
    count: async (query = {}) => {
      if (!PgReview) return 0;
      return await PgReview.count({ where: query });
    }
  };
}

module.exports = adapter;
