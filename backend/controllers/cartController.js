const adapter = require('../models/adapter');

exports.add = async (req, res) => {
  try {
    const userId = req.user && (req.user._id || req.user.id) || null;
    const { productId, quantity = 1, sessionId, meta } = req.body || {};
    if (!productId) return res.status(400).json({ message: ' productId required' });
    const created = await adapter.CartItem.create({ userId, productId, quantity, sessionId: sessionId || null, meta: meta || null });
    return res.status(201).json(created);
  } catch (e) { console.error(e); return res.status(500).json({ message: 'failed' }); }
};

exports.list = async (req, res) => {
  try {
    const userId = req.user && (req.user._id || req.user.id) || null;
    const sessionId = req.query.sessionId || null;
    const q = {};
    if (userId) q.userId = userId;
    if (sessionId) q.sessionId = sessionId;
    const items = await adapter.CartItem.find(q);
    return res.json(items);
  } catch (e) { console.error(e); return res.status(500).json({ message: 'failed' }); }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const update = req.body || {};
    if (!id) return res.status(400).json({ message: 'id required' });
    const updated = await adapter.CartItem.updateById(id, update);
    return res.json(updated);
  } catch (e) { console.error(e); return res.status(500).json({ message: 'failed' }); }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'id required' });
    const deleted = await adapter.CartItem.deleteById(id);
    return res.json({ deleted });
  } catch (e) { console.error(e); return res.status(500).json({ message: 'failed' }); }
};
