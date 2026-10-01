const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const adapter = require('../models/adapter');

/**
 * Inventory Management Routes
 * Provides endpoints for stock management, low stock alerts, and bulk operations
 */

// Get inventory overview with statistics
router.get('/overview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const Product = adapter.Product;
    const products = await Product.findAll();
    
    const totalProducts = products.length;
    const inStock = products.filter(p => p.stock > 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 20).length;
    const criticalStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0), 0);
    
    // Get low stock products
    const lowStockProducts = products
      .filter(p => p.stock < 20)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10);
    
    // Get out of stock products
    const outOfStockProducts = products
      .filter(p => p.stock === 0)
      .slice(0, 10);
    
    // Category distribution
    const categoryStats = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, totalStock: 0, totalValue: 0 };
      }
      categoryStats[cat].count++;
      categoryStats[cat].totalStock += Number(p.stock) || 0;
      categoryStats[cat].totalValue += (Number(p.price) || 0) * (Number(p.stock) || 0);
    });
    
    res.json({
      success: true,
      stats: {
        totalProducts,
        inStock,
        lowStock,
        criticalStock,
        outOfStock,
        totalValue
      },
      lowStockProducts,
      outOfStockProducts,
      categoryStats: Object.entries(categoryStats).map(([name, data]) => ({
        name,
        ...data
      }))
    });
  } catch (error) {
    console.error('Inventory overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory overview' });
  }
});

// Bulk update stock for multiple products
router.post('/bulk-stock', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { products } = req.body; // Array of { productId, stock }
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid products array' });
    }
    
    const Product = adapter.Product;
    const results = [];
    
    for (const item of products) {
      const { productId, stock } = item;
      if (!productId || stock === undefined) {
        results.push({ productId, success: false, message: 'Missing productId or stock' });
        continue;
      }
      
      try {
        const product = await Product.findById(productId);
        if (!product) {
          results.push({ productId, success: false, message: 'Product not found' });
          continue;
        }
        
        product.stock = parseInt(stock);
        await product.save();
        
        results.push({ productId, success: true, newStock: product.stock });
      } catch (err) {
        results.push({ productId, success: false, message: err.message });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    res.json({
      success: true,
      message: `Updated ${successful} products, ${failed} failed`,
      results
    });
  } catch (error) {
    console.error('Bulk stock update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update stock' });
  }
});

// Get products with low stock
router.get('/low-stock', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 20;
    const Product = adapter.Product;
    const products = await Product.findAll();
    
    const lowStockProducts = products
      .filter(p => p.stock > 0 && p.stock < threshold)
      .sort((a, b) => a.stock - b.stock);
    
    res.json({
      success: true,
      threshold,
      count: lowStockProducts.length,
      products: lowStockProducts
    });
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch low stock products' });
  }
});

// Adjust stock (add or subtract)
router.patch('/adjust-stock/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment } = req.body; // positive or negative number
    
    if (adjustment === undefined || typeof adjustment !== 'number') {
      return res.status(400).json({ success: false, message: 'Invalid adjustment value' });
    }
    
    const Product = adapter.Product;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    const newStock = (Number(product.stock) || 0) + adjustment;
    
    if (newStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative' });
    }
    
    product.stock = newStock;
    await product.save();
    
    res.json({
      success: true,
      product: {
        _id: product._id,
        name: product.name,
        oldStock: Number(req.body.oldStock) || Number(product.stock) - adjustment,
        newStock: product.stock,
        adjustment
      }
    });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ success: false, message: 'Failed to adjust stock' });
  }
});

module.exports = router;
