const adapter = require('../models/adapter');

exports.add = async (req, res) => {
  try {
    const userId = req.user && (req.user._id || req.user.id) || null;
    const { productId, meta } = req.body || {};
    if (!productId) return res.status(400).json({ message: 'productId required' });
    const data = { userId, productId, meta: meta || null };
    const created = await adapter.Wishlist.create(data);
    return res.status(201).json(created);
  } catch (e) { console.error(e); return res.status(500).json({ message: 'failed' }); }
};

exports.list = async (req, res) => {
  try {
    const userId = req.user && (req.user._id || req.user.id) || null;
    const q = userId ? { userId } : {};
    const items = await adapter.Wishlist.find(q);
    return res.json(items);
  } catch (e) { console.error(e); return res.status(500).json({ message: 'failed' }); }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'id required' });
    const deleted = await adapter.Wishlist.remove({ id });
    return res.json({ deleted });
  } catch (e) { console.error(e); return res.status(500).json({ message: 'failed' }); }
};
