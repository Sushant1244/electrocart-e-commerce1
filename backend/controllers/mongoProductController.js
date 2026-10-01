const { z } = require('zod');
const Product = require('../models/mongo/Product');

const productInput = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(220).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().min(1),
  price: z.coerce.number().nonnegative(),
  discountPrice: z.coerce.number().nonnegative().optional(),
  category: z.enum(['security-cameras', 'gaming', 'accessories', 'audio', 'smartphones', 'other']),
  brand: z.string().trim().max(120).optional(),
  images: z.array(z.string().url()).optional(),
  stock: z.coerce.number().int().nonnegative().default(0),
  specs: z.record(z.string()).optional(),
  isActive: z.boolean().optional()
});

function parseId(value) { return /^[a-f\d]{24}$/i.test(value); }
function sendValidation(res, error) { return res.status(400).json({ message: 'Invalid product data', errors: error.issues }); }

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = { isActive: req.query.includeInactive === 'true' ? { $in: [true, false] } : true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.brand) filter.brand = req.query.brand;
    if (req.query.minPrice || req.query.maxPrice) filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    if (req.query.q) filter.$text = { $search: String(req.query.q).slice(0, 100) };
    const allowedSort = new Set(['createdAt', 'price', 'name', 'ratingAverage']);
    const sortField = allowedSort.has(req.query.sort) ? req.query.sort : 'createdAt';
    const sort = { [sortField]: req.query.direction === 'asc' ? 1 : -1 };
    const [items, total] = await Promise.all([
      Product.find(filter).select('-specs').sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter)
    ]);
    return res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
};
exports.get = async (req, res, next) => { try { if (!parseId(req.params.id)) return res.status(400).json({ message: 'Invalid product id' }); const product = await Product.findOne({ _id: req.params.id, isActive: true }).lean(); if (!product) return res.status(404).json({ message: 'Product not found' }); return res.json(product); } catch (error) { return next(error); } };
exports.create = async (req, res, next) => { try { const parsed = productInput.safeParse(req.body); if (!parsed.success) return sendValidation(res, parsed.error); const product = await Product.create(parsed.data); return res.status(201).json(product.toObject()); } catch (error) { return next(error); } };
exports.update = async (req, res, next) => { try { if (!parseId(req.params.id)) return res.status(400).json({ message: 'Invalid product id' }); const parsed = productInput.partial().safeParse(req.body); if (!parsed.success) return sendValidation(res, parsed.error); const product = await Product.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true }).lean(); if (!product) return res.status(404).json({ message: 'Product not found' }); return res.json(product); } catch (error) { return next(error); } };
exports.remove = async (req, res, next) => { try { if (!parseId(req.params.id)) return res.status(400).json({ message: 'Invalid product id' }); const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).lean(); if (!product) return res.status(404).json({ message: 'Product not found' }); return res.json({ message: 'Product archived' }); } catch (error) { return next(error); } };
