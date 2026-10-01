const adapter = require('../models/adapter');
const { sendMail } = require('../utils/mailer');
const { orderPlacedHtml, orderStatusHtml } = require('../utils/emailTemplates');
const fs = require('fs');
const path = require('path');

// small helper to escape text for HTML contexts
function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const { pickEmail } = require('../utils/emailHelpers');

function auditAdminOrderAttempt(info) {
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    const logFile = path.join(logsDir, 'admin-order-attempts.log');
    const line = `[${new Date().toISOString()}] ${JSON.stringify(info)}\n`;
    fs.appendFileSync(logFile, line);
  } catch (e) {
    console.error('Failed to write audit log', e);
  }
}

exports.createOrder = async (req, res) => {
  try {
  // support both `items` and legacy `orderItems` shapes from various clients
  const { shippingAddress, total, paymentMethod, userId: bodyUserId } = req.body;
  const items = req.body.items || req.body.orderItems || [];

    // Require authenticated user
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    // Basic payload validation
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Order items required' });

    // Ensure shipping address is present and looks valid (frontend saves fullName/line1/city/country)
    if (!shippingAddress || !(shippingAddress.fullName || shippingAddress.name) || !(shippingAddress.line1 || shippingAddress.address)) {
      return res.status(400).json({ message: 'Valid shippingAddress required' });
    }

    // coerce user id from different shapes (adapter may use id or _id)
    // Admins should not place orders for themselves. If an admin is creating an order
    // it must be explicitly for another user via `userId` in the payload.
    if (req.user?.isAdmin && !bodyUserId) {
      // audit and block
      auditAdminOrderAttempt({ user: { id: req.user._id ?? req.user.id, email: req.user.email }, action: 'blocked_create_order_no_userId', payload: { items: items?.length || 0, total } });
      return res.status(403).json({ message: 'Admin users cannot place orders. To create an order on behalf of a user, provide a userId.' });
    }

    // Allow admins to create an order for another user by passing `userId` in the payload
    let userId = null;
    if (req.user?.isAdmin && bodyUserId) {
      // prevent admin accidentally creating an order for themselves by passing their own id
      if (String(bodyUserId) === String(req.user._id ?? req.user.id)) {
        auditAdminOrderAttempt({ user: { id: req.user._id ?? req.user.id, email: req.user.email }, action: 'blocked_create_order_self_userId', payload: { userId: bodyUserId } });
        return res.status(400).json({ message: 'Invalid userId: cannot create an order for the admin user.' });
      }
      userId = bodyUserId;
    } else {
      userId = req.user._id ?? req.user.id ?? null;
    }
    if (typeof userId === 'string' && /^\d+$/.test(userId)) userId = Number(userId);

    // Determine paid status. For COD allow creation immediately. For online methods we prefer
    // that the payment was verified, but allow creating a pending Khalti order (so client can
    // initiate/verify payment after order creation) when no token/result is provided.
    const isCod = paymentMethod && String(paymentMethod).toLowerCase() === 'cod';
  const method = paymentMethod ? String(paymentMethod).toLowerCase() : '';
  const isKhalti = method === 'khalti';
    const paymentResult = req.body.paymentResult || null;

    if (!isCod && !isKhalti) {
      // For non-COD, non-Khalti methods require an explicit successful paymentResult
      // Dev convenience: allow creating unverified orders when `ALLOW_UNVERIFIED_ORDERS=true` is set
      const allowUnverified = (process.env.ALLOW_UNVERIFIED_ORDERS || 'false') === 'true';
      const isProduction = (process.env.NODE_ENV === 'production');
      if (!paymentResult || paymentResult.success !== true) {
        if (allowUnverified && !isProduction) {
          // proceed and create order in unpaid state for development/testing
          console.log('ALLOW_UNVERIFIED_ORDERS is true — creating order in unpaid state for dev/testing');
        } else if (allowUnverified && isProduction) {
          console.error('Attempted to enable ALLOW_UNVERIFIED_ORDERS in production - refusing to bypass payment verification');
          return res.status(400).json({ message: 'Unverified orders are not allowed in production' });
        } else {
          // handle failed payment notification/email then reject
          try {
            const failedMsg = (paymentResult && paymentResult.message) ? String(paymentResult.message) : 'Payment failed or not verified';
            const targetUserId = (req.user && (req.user._id || req.user.id)) || bodyUserId || null;
            try {
              const safe = escapeHtml(failedMsg);
              await adapter.Notification.create({ userId: targetUserId, title: 'Payment failed', body: `Payment failed: ${safe}`, meta: { paymentResult } });
            } catch (e) { console.error('Failed to create payment-failed notification', e && e.message ? e.message : e); }
            const email = pickEmail(paymentResult && paymentResult.email, req.user && req.user.email);
            if (email) {
              try {
                const { wrapHtml } = require('../utils/emailTemplates');
                const escaped = escapeHtml(failedMsg);
                const html = wrapHtml('Payment failed', `<p>We could not process your payment. Reason: ${escaped}</p><p>If you were charged, contact support.</p>`);
                // Use escaped text in both plain-text and HTML contexts
                const safeText = `Payment failed: ${escapeHtml(failedMsg)}`;
                Promise.resolve(sendMail(email, 'Payment failed for your order', safeText, html)).catch(() => {});
              } catch (e) { console.error('Failed to send payment-failed email', e && e.message ? e.message : e); }
            }
          } catch (e) { console.error('Error handling failed payment notification', e && e.message ? e.message : e); }
          return res.status(400).json({ message: 'Payment not verified. Order not created' });
        }
      }
    }

    // If payment method is Khalti, allow order creation when no verification token/result is present
    // but if the client provided a Khalti token and amount, attempt server-side verification now.
    if (isKhalti) {
      const khaltiToken = req.body.khaltiToken || (paymentResult && paymentResult.token) || null;
      const khaltiAmount = req.body.khaltiAmount || (paymentResult && paymentResult.amount) || null;
      if (khaltiToken && khaltiAmount) {
        try {
          // verify with Khalti API
          const axios = require('axios');
          const KHALTI_ENV = process.env.KHALTI_ENV === 'production' ? 'production' : 'dev';
          const KHALTI_VERIFY_URL = KHALTI_ENV === 'production' ? 'https://khalti.com/api/v2/payment/verify/' : 'https://dev.khalti.com/api/v2/payment/verify/';
          const KHALTI_SECRET = process.env.KHALTI_SECRET_KEY || process.env.KHALTI_LIVE_KEY || null;
          if (!KHALTI_SECRET) throw new Error('Khalti secret not configured');
          const resp = await axios.post(KHALTI_VERIFY_URL, { token: khaltiToken, amount: Number(khaltiAmount) }, { headers: { Authorization: `Key ${KHALTI_SECRET}` } });
          // treat successful response as verified
          if (resp && resp.data) {
            // attach verification result as paymentResult for storage
            req.body.paymentResult = resp.data;
            // ensure `success` flag for downstream logic
            req.body.paymentResult.success = true;
          }
        } catch (e) {
          console.error('Khalti verification failed:', e && (e.response?.data || e.message || e));
          // If verification fails, reject creation to avoid unverified paid orders
          return res.status(400).json({ message: 'Khalti payment verification failed', detail: e && (e.response?.data || e.message) });
        }
      }
  // if no token provided, proceed and create order as unpaid/pending; client will call /api/payments/khalti/initiate or /verify later
    }

    const nowIso = new Date().toISOString();
    // consider payment verified only when paymentResult.success === true
    const verified = paymentResult && paymentResult.success === true;
    const orderData = {
      userId,
      orderItems: items,
      shippingAddress: shippingAddress || null,
      totalPrice: total || 0,
      paymentMethod: paymentMethod || 'cod',
      // mark paid only when explicitly verified; Khalti orders created without verification remain unpaid
      isPaid: isCod ? false : !!verified,
      status: 'processing',
      deliveryStatus: 'pending',
      // don't store a synthetic paymentResult for Khalti when not verified
      paymentResult: isCod ? null : (verified ? paymentResult : (isKhalti ? null : (paymentResult || { provider: paymentMethod, paidAt: nowIso }))),
      // use a consistent `timestamp` (ISO string) so frontend can render updates reliably
      deliveryUpdates: [{ status: 'pending', location: 'Order Received', note: 'Order has been received and is being processed', timestamp: nowIso }]
    };

    const order = await adapter.Order.create(orderData);
    // Send notification to user and email about order creation
    try {
      const notif = await adapter.Notification.create({ userId: userId || null, title: 'Order placed', body: `Your order ${order.id || order._id} has been placed successfully.`, meta: { orderId: order.id || order._id } });
      // determine recipient email: prefer order.email, otherwise use authenticated user's email
  const recipientEmail = pickEmail(order && (order.email || order.emailAddress), req.user && req.user.email);
  if (recipientEmail) {
        try {
          const html = orderPlacedHtml({ order, clientUrl: process.env.CLIENT_URL || '' });
          // send asynchronously but don't block order creation response
          Promise.resolve(sendMail(recipientEmail, `Order ${order.id || order._id} confirmation`, `Your order ${order.id || order._id} has been placed.`, html)).catch(() => {});
        } catch (e) { console.error('Failed to generate/send orderPlaced email', e); }
      }
    } catch (e) { console.error('Notification/email after createOrder failed', e && e.message ? e.message : e); }
    if (req.user?.isAdmin) {
      auditAdminOrderAttempt({ user: { id: req.user._id ?? req.user.id, email: req.user.email }, action: 'created_order_on_behalf', createdOrderId: order && (order._id || order.id || null), payload: { userId, total: orderData.totalPrice } });
    }
    return res.status(201).json(order);
  } catch (e) {
    try { console.error('createOrder error:', e?.stack ?? e); } catch (error_) { console.error('Failed to log error', error_); }
    res.status(500).json({ message: e?.message ?? '' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user && (req.user._id || req.user.id);
    // coerce numeric ids to number when possible to match PG schema
    const qUserId = typeof userId === 'string' && /\d+/.test(userId) ? Number(userId) : userId;
    const orders = await adapter.Order.find({ userId: qUserId });
    res.json(orders);
  } catch (e) {
    try { console.error('getMyOrders error:', e?.stack ?? e); } catch (error_) { console.error('Failed to log error', error_); }
    res.status(500).json({ message: e?.message ?? '' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
  const orders = await adapter.Order.findAll();
  res.json(orders);
  } catch (e) {
    try { console.error('getAllOrders error:', e?.stack ?? e); } catch (error_) { console.error('Failed to log error', error_); }
    res.status(500).json({ message: e?.message ?? '' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, deliveryStatus, trackingNumber, note, location } = req.body;
    const id = req.params.id;

    // Load existing order
    const order = await adapter.Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Build updates
    const updates = {};
    if (status) updates.status = status;
    if (deliveryStatus) updates.deliveryStatus = deliveryStatus;
    if (trackingNumber) updates.trackingNumber = trackingNumber;

    // Append a delivery update entry to the existing array
    const existing = Array.isArray(order.deliveryUpdates) ? order.deliveryUpdates.slice() : [];
    if (deliveryStatus || note || location) {
      const entry = {
        status: deliveryStatus || status,
        location: location || 'Warehouse',
        note: note || `${deliveryStatus || status} update`,
        // provide `timestamp` for frontend consistency (fallbacks handled on client)
        timestamp: new Date()
      };
      existing.push(entry);
    }
    updates.deliveryUpdates = existing;

    const updated = await adapter.Order.findByIdAndUpdate(id, updates);
    // notify user about delivery/status update and email
    try {
      await adapter.Notification.create({ userId: updated.userId || null, title: `Order ${updated.id || updated._id} update`, body: `Order status updated: ${updated.status || updated.deliveryStatus}`, meta: { orderId: updated.id || updated._id } });
    // determine recipient: prefer order email/address, otherwise look up the order owner or fall back to the authenticated user
    let to = pickEmail(updated && (updated.email || updated.emailAddress));
    if (!to && updated && updated.userId) {
      try {
        const owner = await adapter.User.findById(updated.userId);
        to = pickEmail(owner && owner.email) || pickEmail(req.user && req.user.email);
      } catch (e) {
        to = pickEmail(req.user && req.user.email);
      }
    }
    if (to) {
        try {
          const html = orderStatusHtml({ order: updated, clientUrl: process.env.CLIENT_URL || '' });
      Promise.resolve(sendMail(to, `Update for order ${updated.id || updated._id}`, `Status: ${updated.status || updated.deliveryStatus}`, html)).catch(() => {});
        } catch (e) { console.error('Failed to generate/send orderStatus email', e); }
    }
    } catch (e) { console.error('Notification/email after updateOrderStatus failed', e && e.message ? e.message : e); }
    return res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const id = req.params.id;
    const order = await adapter.Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // only allow owner or admin to cancel
    const isOwner = req.user && (String(req.user._id || req.user.id) === String(order.userId));
    if (!isOwner && !req.user?.isAdmin) return res.status(403).json({ message: 'Not authorized' });

    // only allow cancel for certain statuses
    const disallowed = ['delivered', 'completed', 'cancelled'];
    if (disallowed.includes((order.status || '').toLowerCase())) return res.status(400).json({ message: 'Order cannot be cancelled' });

    // Enforce 12-hour cancellation window for non-admins
    try {
      const createdAt = new Date(order.createdAt || order.date || order.created_at || null);
      if (!req.user?.isAdmin && createdAt && !isNaN(createdAt)) {
        const ageMs = Date.now() - createdAt.getTime();
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;
        if (ageMs > TWELVE_HOURS) return res.status(400).json({ message: 'Cancellation window (12 hours) has passed' });
      }
    } catch (e) { /* ignore date parse errors and allow admin override */ }

    const updates = { status: 'cancelled', deliveryStatus: 'cancelled' };
    const existing = Array.isArray(order.deliveryUpdates) ? order.deliveryUpdates.slice() : [];
    existing.push({ status: 'cancelled', location: 'User Request', note: `Order cancelled by ${req.user?.email || 'user'}`, timestamp: new Date() });
    updates.deliveryUpdates = existing;

    const updated = await adapter.Order.findByIdAndUpdate(id, updates);

    // notify user and send email
    try {
      await adapter.Notification.create({ userId: updated.userId || null, title: `Order ${updated.id || updated._id} cancelled`, body: 'Your order has been cancelled.', meta: { orderId: updated.id || updated._id } });
      // Determine cancel email. Prefer order email, otherwise use owner or cancelling user's email
      let toCancel = pickEmail(updated && (updated.email || updated.emailAddress));
      if (!toCancel && updated && updated.userId) {
        try {
          const owner = await adapter.User.findById(updated.userId);
          toCancel = pickEmail(owner && owner.email) || pickEmail(req.user && req.user.email);
        } catch (e) {
          toCancel = pickEmail(req.user && req.user.email);
        }
      }
      if (toCancel) {
        const { wrapHtml } = require('../utils/emailTemplates');
        const { sendMail } = require('../utils/mailer');
        const html = wrapHtml('Order cancelled', `<p>Your order <strong>${updated.id || updated._id}</strong> has been cancelled. If this was a mistake, contact support.</p>`);
        Promise.resolve(sendMail(toCancel, `Order ${updated.id || updated._id} cancelled`, `Order cancelled`, html)).catch(() => {});
      }
    } catch (e) { console.error('Failed to notify on cancel', e && e.message ? e.message : e); }

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getOrderTracking = async (req, res) => {
  try {
  const order = await adapter.Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // If user is not admin, verify they own the order
  if (!req.user?.isAdmin && order.userId && req.user?._id && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Upload proof for bank transfer (or other manual payment proofs). Authenticated users only.
exports.uploadProof = async (req, res) => {
  try {
    const id = req.params.id;
    const order = await adapter.Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // Only owner or admin can upload proof
    const isOwner = req.user && (String(req.user._id || req.user.id) === String(order.userId));
    if (!isOwner && !req.user?.isAdmin) return res.status(403).json({ message: 'Not authorized' });

    if (!req.file) return res.status(400).json({ message: 'No proof file uploaded' });
    // store proof metadata (prefer S3 when configured)
    const existing = Array.isArray(order.paymentProofs) ? order.paymentProofs.slice() : [];
    let proofMeta = null;
    try {
      if (process.env.AWS_S3_BUCKET) {
        // upload the temp file created by multer to S3 and remove the local file
        const { uploadLocalFileToS3 } = require('../utils/s3');
        const localPath = req.file.path; // multer saved file locally
        const key = `proofs/${Date.now()}-${req.file.filename}`;
        const uploaded = await uploadLocalFileToS3(localPath, key, req.file.mimetype || 'application/octet-stream');
        proofMeta = { storage: 's3', bucket: uploaded.bucket, key: uploaded.key, url: uploaded.location, size: req.file.size, mime: req.file.mimetype };
      } else {
        // local fallback: store under /uploads
        const filename = `/uploads/${req.file.filename}`;
        proofMeta = { storage: 'local', path: filename, size: req.file.size, mime: req.file.mimetype };
      }
    } catch (e) {
      console.error('Failed to store proof file', e && e.message ? e.message : e);
      return res.status(500).json({ message: 'Failed to store proof file' });
    }
    proofMeta.uploadedAt = new Date();
    proofMeta.uploadedBy = req.user && (req.user.email || req.user._id || req.user.id);
    existing.push(proofMeta);
    const updates = { paymentProofs: existing };
    // If admin uploads and indicates success via query param ?markPaid=true, mark order paid
    if (req.query && String(req.query.markPaid) === 'true' && req.user?.isAdmin) {
      updates.isPaid = true;
      updates.paidAt = new Date();
      // Preserve existing paymentResult fields from the stored order and merge admin-marking info
      updates.paymentResult = Object.assign({}, order.paymentResult || {}, { provider: 'bank', adminMarked: true });
    }
    const updated = await adapter.Order.findByIdAndUpdate(id, updates);
    // create notification for user
    try {
      await adapter.Notification.create({ userId: updated.userId || null, title: 'Payment proof uploaded', body: 'A payment proof was uploaded for your order. Our team will review it shortly.', meta: { orderId: updated.id || updated._id } });
    } catch (e) { console.warn('Failed to create notification for proof upload', e && e.message ? e.message : e); }
    return res.json({ ok: true, uploaded: filename, order: updated });
  } catch (e) {
    console.error('uploadProof failed', e && e.message ? e.message : e);
    return res.status(500).json({ message: 'uploadProof failed' });
  }
};