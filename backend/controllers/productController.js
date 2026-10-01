const adapter = require('../models/adapter');
const pgConfig = require('../config/sequelize');
const fs = require('fs');
const path = require('path');
const { listProducts: listInMemoryProducts, findBySlug: findInMemoryBySlug, findById: findInMemoryById } = require('../utils/inMemoryProducts');
const slugify = require('slugify');

// Advanced product search with filters, sorting, pagination, and auto-suggestions
exports.advancedSearch = async (req, res) => {
  try {
    const {
      q, // search query
      category,
      minPrice,
      maxPrice,
      rating,
      inStock,
      featured,
      sortBy, // price-asc, price-desc, rating-desc, newest, name-asc, name-desc
      page = 1,
      limit = 20,
      suggestions // if true, return only auto-suggestions
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(50, Number(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Build query object
    const query = {};
    if (category) query.category = category;
    if (featured === 'true' || featured === true) query.featured = true;
    if (inStock === 'true' || inStock === true) {
      query.countInStock = { $gt: 0 };
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (rating) query.rating = { $gte: Number(rating) };

    let allProducts = [];
    let productsWithQuery = [];

    // Try adapter-backed DB read first
    try {
      if (adapter.Product && typeof adapter.Product.find === 'function') {
        allProducts = await adapter.Product.find(query);
      } else {
        allProducts = listInMemoryProducts({});
      }
    } catch (err) {
      console.warn('adapter.Product.find failed, falling back to in-memory products', err?.message);
      allProducts = listInMemoryProducts({});
    }

    // Apply search query filter (case-insensitive)
    if (q && q.trim()) {
      const searchTerm = q.trim().toLowerCase();
      productsWithQuery = allProducts.filter(p => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return name.includes(searchTerm) || desc.includes(searchTerm) || cat.includes(searchTerm);
      });
    } else {
      productsWithQuery = allProducts;
    }

    // If suggestions mode, return only product names/categories for auto-complete
    if (suggestions === 'true' || suggestions === true) {
      const suggestionProducts = productsWithQuery.slice(0, 10);
      const productSuggestions = suggestionProducts.map(p => ({
        _id: p._id || p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        price: p.price,
        image: p.images?.[0] || null
      }));
      
      // Also get category suggestions
      const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
      const categorySuggestions = categories
        .filter(c => c.toLowerCase().includes((q || '').toLowerCase()))
        .slice(0, 5)
        .map(c => ({ type: 'category', name: c }));

      return res.json({
        products: productSuggestions,
        categories: categorySuggestions
      });
    }

    // Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case 'price-asc':
          productsWithQuery.sort((a, b) => (a.price || 0) - (b.price || 0));
          break;
        case 'price-desc':
          productsWithQuery.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;
        case 'rating-desc':
          productsWithQuery.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'newest':
          productsWithQuery.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          break;
        case 'name-asc':
          productsWithQuery.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          break;
        case 'name-desc':
          productsWithQuery.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
          break;
        default:
          break;
      }
    }

    // Get unique categories for filter sidebar
    const availableCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
    
    // Get price range
    const prices = allProducts.map(p => p.price).filter(Boolean);
    const priceRange = {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0
    };

    // Apply pagination
    const total = productsWithQuery.length;
    const paginatedProducts = productsWithQuery.slice(offset, offset + limitNum);

    res.json({
      products: paginatedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      filters: {
        categories: availableCategories,
        priceRange,
        ratings: [5, 4, 3, 2, 1]
      }
    });
  } catch (e) {
    console.error('advancedSearch error:', e?.message);
    res.status(500).json({ message: e?.message || 'Search failed' });
  }
};

// Get related products based on category
exports.getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    // Get the current product
    const product = await adapter.Product.findById(id);
    if (!product) {
      // Try in-memory fallback
      const inMemoryProduct = findInMemoryById(id);
      if (!inMemoryProduct) return res.status(404).json({ message: 'Product not found' });
      
      const related = listInMemoryProducts({ category: inMemoryProduct.category })
        .filter(p => p._id !== inMemoryProduct._id && p.id !== inMemoryProduct.id)
        .slice(0, Number(limit));
      return res.json(related);
    }

    // Find related products in the same category, excluding current product
    let related = [];
    try {
      if (adapter.Product && typeof adapter.Product.find === 'function') {
        related = await adapter.Product.find({ category: product.category });
      } else {
        related = listInMemoryProducts({ category: product.category });
      }
    } catch (err) {
      related = listInMemoryProducts({ category: product.category });
    }

    // Filter out current product and limit
    const filtered = (related || [])
      .filter(p => String(p._id || p.id) !== String(id))
      .slice(0, Number(limit));

    res.json(filtered);
  } catch (e) {
    console.error('getRelatedProducts error:', e?.message);
    res.status(500).json({ message: e?.message || 'Failed to get related products' });
  }
};

// Check inventory availability for multiple products
exports.checkInventory = async (req, res) => {
  try {
    const { items } = req.body; // Array of { productId, quantity }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array required' });
    }

    const results = [];
    for (const item of items) {
      const { productId, quantity = 1 } = item;
      
      let product;
      try {
        product = await adapter.Product.findById(productId);
      } catch (err) {
        product = findInMemoryById(productId);
      }

      if (!product) {
        results.push({ productId, available: false, message: 'Product not found' });
        continue;
      }

      const stock = product.countInStock || product.stock || 0;
      const available = stock >= quantity;

      results.push({
        productId,
        available,
        requested: quantity,
        availableQty: stock,
        message: available ? 'Available' : `Only ${stock} available`
      });
    }

    const allAvailable = results.every(r => r.available);
    res.json({ success: allAvailable, items: results });
  } catch (e) {
    console.error('checkInventory error:', e?.message);
    res.status(500).json({ message: e?.message || 'Inventory check failed' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    // Debug: log incoming request metadata to help diagnose 500 errors
    try {
      console.debug('createProduct called', {
        bodyKeys: req.body ? Object.keys(req.body) : null,
        hasFiles: Array.isArray(req.files) ? req.files.length : 0,
        contentType: req.headers['content-type']
      });
    } catch (logErr) { console.debug('createProduct: failed to log request meta', logErr); }
    const { name, description, price, originalPrice, category, stock, featured, rating } = req.body;
    // Support two ways to provide images:
    // - uploading files (req.files) -> stored as /uploads/<filename>
    // - providing existing upload paths in JSON body as `images` (e.g. ['/uploads/Iphone.png'])
    let images = [];
    if (req.files?.length) {
      images = req.files.map(f => `/uploads/${f.filename}`);
    } else if (req.body.images) {
      // images may be a JSON array or a single comma-separated string
      if (Array.isArray(req.body.images)) images = req.body.images;
      else if (typeof req.body.images === 'string') {
        try {
          const parsed = JSON.parse(req.body.images);
          if (Array.isArray(parsed)) images = parsed;
          else images = [req.body.images];
        } catch (e) {
          // not JSON - treat as comma separated
          images = req.body.images.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }
    const slug = slugify(name, { lower: true, strict: true });
  const existing = await adapter.Product.findOne({ slug });
    if (existing) return res.status(400).json({ message: 'Product with same slug exists' });
    
    const productData = {
      name,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category,
    // use countInStock for PG model while keeping 'stock' in response via adapter
    countInStock: Number(stock) || 0,
      images,
      slug,
      featured: featured === 'true' || featured === true,
      rating: rating ? Number(rating) : 5
    };
    
  const product = await adapter.Product.create(productData);
  // adapter will normalize and include 'stock' property for frontend
  res.json(product);
  } catch (e) {
  // Log full error for diagnostics
  try { console.error('createProduct error:', e && e.stack ? e.stack : e); } catch (logErr) { console.error('Failed to log error', logErr); }
  // Respond with message when available, otherwise empty string (client already handles this)
  res.status(500).json({ message: e && e.message ? e.message : '' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const update = { ...req.body };

    // parse numeric fields
    if (update.price) update.price = Number(update.price);
    if (update.originalPrice) update.originalPrice = Number(update.originalPrice);
    if (update.stock) update.stock = Number(update.stock);
    if (update.rating) update.rating = Number(update.rating);
    if (update.featured !== undefined) update.featured = update.featured === 'true' || update.featured === true;

    const existingProduct = await adapter.Product.findById(id);
    const replaceFlag = req.body && (req.body.replaceImages === 'true' || req.body.replaceImages === true || req.body.replaceImages === '1');

    // helper: parse incoming array/string -> array
    const parseArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { const parsed = JSON.parse(val); if (Array.isArray(parsed)) return parsed; return [val]; } catch (e) { return val.split(',').map(s => s.trim()).filter(Boolean); }
      }
      return [];
    };

    let baseImages = existingProduct && Array.isArray(existingProduct.images) ? existingProduct.images.slice() : [];

    // handle deleteImages: remove from baseImages and delete files
    const delImages = parseArray(req.body && req.body.deleteImages);
    if (delImages.length) {
      const toFilename = (img) => img ? (img.startsWith('/uploads/') ? img.replace('/uploads/', '') : img) : '';
      const delFilenames = delImages.map(toFilename);
      for (const img of delImages) {
        try {
          // remove matching filenames from baseImages
          baseImages = baseImages.filter(i => {
            const f = toFilename(i);
            return !delFilenames.includes(f);
          });
          const filename = toFilename(img);
          const filePath = path.join(__dirname, '..', 'uploads', filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.debug('Deleted upload file:', filePath);
          }
        } catch (err) {
          console.warn('Failed to remove old upload file during deleteImages', err && err.message ? err.message : err);
        }
      }
      // ensure DB is updated if deletions happened and no other image changes
      if (!req.files?.length && !req.body.images) {
        update.images = baseImages;
        if (update.stock !== undefined && update.countInStock === undefined) {
          update.countInStock = Number(update.stock);
          delete update.stock;
        }
        const product = await adapter.Product.findByIdAndUpdate(id, update);
        return res.json(product);
      }
    }

    // handle new uploaded files
    if (req.files?.length) {
      const newImages = req.files.map(f => `/uploads/${f.filename}`);
      if (replaceFlag) {
        // remove any remaining baseImages files
        for (const img of baseImages) {
          try {
            if (!img) continue;
            const filename = img.startsWith('/uploads/') ? img.replace('/uploads/', '') : img;
            const filePath = path.join(__dirname, '..', 'uploads', filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (err) { console.warn('Failed to remove old upload file', err && err.message ? err.message : err); }
        }
        update.images = newImages;
      } else {
        update.images = [...baseImages, ...newImages];
      }
    } else if (req.body.images) {
      const bodyImages = parseArray(req.body.images);
      if (replaceFlag) {
        for (const img of baseImages) {
          try {
            if (!img) continue;
            const filename = img.startsWith('/uploads/') ? img.replace('/uploads/', '') : img;
            const filePath = path.join(__dirname, '..', 'uploads', filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (err) { console.warn('Failed to remove old upload file', err && err.message ? err.message : err); }
        }
        update.images = bodyImages;
      } else {
        update.images = [...baseImages, ...bodyImages];
      }
    }

    // If the frontend sent 'stock', map it to countInStock for DB
    if (update.stock !== undefined && update.countInStock === undefined) {
      update.countInStock = Number(update.stock);
      delete update.stock;
    }

    const product = await adapter.Product.findByIdAndUpdate(id, update);
    res.json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
  await adapter.Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { featured, category } = req.query;
    // Build query from params
    const query = {};
    if (featured === 'true' || featured === true) query.featured = true;
    if (category) query.category = category;

    // Try adapter-backed DB read first; if it fails (DB down/misconfigured),
    // fall back to the in-memory demo products for local/dev convenience.
    try {
      if (adapter.Product && typeof adapter.Product.find === 'function') {
        const products = await adapter.Product.find(query, { sort: { field: 'createdAt', dir: 'DESC' } });
        return res.json(products);
      }
    } catch (err) {
      try { console.warn('adapter.Product.find failed, falling back to in-memory products', err && err.message ? err.message : err); } catch (logErr) {}
      const products = listInMemoryProducts({ featured, category });
      return res.json(products);
    }

    // If adapter.Product.find not available, use in-memory list
    const products = listInMemoryProducts({ featured, category });
    res.json(products);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await adapter.Product.findById(req.params.id);
    // If not found in DB, fall back to in-memory products
    if (!product) {
      const inMemoryProduct = findInMemoryById(req.params.id);
      if (inMemoryProduct) return res.json(inMemoryProduct);
      return res.status(404).json({ message: 'Not found' });
    }
    res.json(product);
  } catch (e) {
    // On error, try fallback to in-memory products
    const inMemoryProduct = findInMemoryById(req.params.id);
    if (inMemoryProduct) return res.json(inMemoryProduct);
    res.status(500).json({ message: e.message });
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const product = await adapter.Product.findBySlug(req.params.slug);
    // If not found in DB, fall back to in-memory products
    if (!product) {
      const inMemoryProduct = findInMemoryBySlug(req.params.slug);
      if (inMemoryProduct) return res.json(inMemoryProduct);
      return res.status(404).json({ message: 'Not found' });
    }
    res.json(product);
  } catch (e) {
    // On error, try fallback to in-memory products
    const inMemoryProduct = findInMemoryBySlug(req.params.slug);
    if (inMemoryProduct) return res.json(inMemoryProduct);
    res.status(500).json({ message: e.message });
  }
};

// Add a user review/rating to a product.
// Expects authMiddleware to set req.user and body to contain { rating: number, comment?: string }
// Supports file uploads for review photos
exports.addReview = async (req, res) => {
  try {
    const id = req.params.id;
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    const { rating, comment } = req.body;
    const r = Number(rating);
    if (!r || r < 1 || r > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    // Handle uploaded photos
    let photos = [];
    if (req.files && req.files.length > 0) {
      photos = req.files.map(f => `/uploads/${f.filename}`);
    }

    // Load product
    const product = await adapter.Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // If PG models are available, attempt to persist a Review row and update product aggregates transactionally.
    // If the DB table is missing (relation does not exist) or any PG error occurs, log and fall back to adapter behavior.
    if (pgConfig && pgConfig.sequelize && pgConfig.Review && pgConfig.Product) {
      try {
        const { sequelize, Review: PgReview, Product: PgProduct } = pgConfig;
        // prevent duplicate by same user
        const existing = await PgReview.findOne({ where: { userId: user._id, productId: product._id || product.id } });
        if (existing) return res.status(400).json({ message: 'You have already reviewed this product' });

        return await sequelize.transaction(async (t) => {
          // create review with photos
          await PgReview.create({ 
            userId: user._id, 
            productId: product._id || product.id, 
            rating: r, 
            comment: comment || '',
            photos: photos
          }, { transaction: t });
          // recompute aggregates from DB
          const agg = await PgReview.findAll({ where: { productId: product._id || product.id }, transaction: t });
          const count = agg.length;
          const sum = agg.reduce((s, it) => s + Number(it.rating || 0), 0);
          const avg = count ? (sum / count) : 0;
          // update product row
          await PgProduct.update({ rating: avg, numReviews: count }, { where: { id: product._id || product.id }, transaction: t });
          // return updated product via adapter
          const updated = await adapter.Product.findById(product._id || product.id);
          return res.json(updated);
        });
      } catch (err) {
        // If the reviews table doesn't exist or another PG error occurred, log and continue to the fallback path
        try {
          console.warn('Postgres review operation failed, falling back to adapter. Error:', err && err.message ? err.message : err);
          if (err && err.message && /relation \"?reviews\"? does not exist/i.test(err.message)) {
            console.warn('Postgres table `reviews` is missing. To auto-create tables in development set PG_SYNC=true and restart the server.');
          }
        } catch (logErr) {
          console.warn('Failed to log Postgres review error', logErr);
        }
        // fall through to non-PG fallback below
      }
    }

    // Fallback: update numeric aggregates in adapter
    const prevNum = Number(product.numReviews || 0);
    const prevRating = Number(product.rating || 0);
    const newNum = prevNum + 1;
    const newRating = ((prevRating * prevNum) + r) / newNum;
    try {
      const updated = await adapter.Product.findByIdAndUpdate(id, { rating: newRating, numReviews: newNum });
      const reviewObj = { 
        userId: user._id, 
        rating: r, 
        comment: comment || '', 
        photos: photos,
        date: new Date().toISOString(), 
        userName: user.name || user.email || null 
      };
      updated.reviews = Array.isArray(product.reviews) ? [...product.reviews, reviewObj] : [reviewObj];
      return res.json(updated);
    } catch (e) {
      return res.status(500).json({ message: 'Failed to update product rating' });
    }
  } catch (e) {
    return res.status(500).json({ message: e && e.message ? e.message : 'Server error' });
  }
};

// List reviews for a product (persisted if PG available, otherwise use product.images as placeholders)
exports.listReviews = async (req, res) => {
  try {
    const id = req.params.id;
    if (pgConfig && pgConfig.Review) {
      try {
        const { Review: PgReview, User: PgUser } = pgConfig;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 8));
        const offset = (page - 1) * limit;
        const where = { productId: id };
        const total = await PgReview.count({ where });
        const rows = await PgReview.findAll({ where, order: [['createdAt', 'DESC']], limit, offset });
        // attach lightweight user info when possible
        const out = await Promise.all(rows.map(async r => {
          const obj = r.toJSON();
          try { const u = await PgUser.findByPk(obj.userId); if (u) { const uu = u.toJSON(); delete uu.passwordHash; obj.user = { _id: uu.id, name: uu.name || uu.email }; } } catch(e){}
          return obj;
        }));
        return res.json({ reviews: out, total, page, limit });
      } catch (err) {
        try {
          console.warn('Postgres listReviews failed, falling back to empty list or adapter. Error:', err && err.message ? err.message : err);
          if (err && err.message && /relation \"?reviews\"? does not exist/i.test(err.message)) {
            console.warn('Postgres table `reviews` is missing. To auto-create tables in development set PG_SYNC=true and restart the server.');
          }
        } catch (logErr) { console.warn('Failed to log Postgres listReviews error', logErr); }
        return res.json([]);
      }
    }
    // fallback: return empty or sample
    return res.json([]);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};