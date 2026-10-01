const adapter = require('../models/adapter');

// Promo code templates for quick creation
const promoTemplates = [
  {
    id: 'welcome',
    name: 'Welcome Offer',
    code: 'WELCOME',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 500,
    maxUses: 100,
    description: '10% off for new customers'
  },
  {
    id: 'summer',
    name: 'Summer Sale',
    code: 'SUMMER',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 1000,
    maxUses: 50,
    description: '20% off summer sale'
  },
  {
    id: 'flat500',
    name: 'Flat Rs. 500 Off',
    code: 'FLAT500',
    discountType: 'fixed',
    discountValue: 500,
    minOrderAmount: 3000,
    maxUses: 200,
    description: 'Rs. 500 off on orders above Rs. 3000'
  },
  {
    id: 'flash',
    name: 'Flash Sale',
    code: 'FLASH',
    discountType: 'percentage',
    discountValue: 30,
    minOrderAmount: 0,
    maxUses: 25,
    description: '30% off - limited time only!'
  },
  {
    id: 'vip',
    name: 'VIP Special',
    code: 'VIP15',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 2000,
    maxUses: 100,
    description: '15% off for VIP customers'
  },
  {
    id: 'free Shipping',
    name: 'Free Shipping',
    code: 'FREESHIP',
    discountType: 'percentage',
    discountValue: 100,
    minOrderAmount: 1500,
    maxUses: 500,
    description: 'Free shipping on orders above Rs. 1500'
  }
];

// Get promo code templates
exports.getPromoTemplates = async (req, res) => {
  try {
    res.json(promoTemplates);
  } catch (e) {
    res.status(500).json({ message: e?.message || 'Failed to get promo templates' });
  }
};

// Initialize with some sample promo codes
const promoCodes = new Map();

// Initialize with some sample promo codes
promoCodes.set('WELCOME10', {
  code: 'WELCOME10',
  discountType: 'percentage',
  discountValue: 10,
  minOrderAmount: 1000,
  maxUses: 100,
  usedCount: 0,
  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
  description: '10% off your first order',
  active: true
});

promoCodes.set('SAVE20', {
  code: 'SAVE20',
  discountType: 'percentage',
  discountValue: 20,
  minOrderAmount: 5000,
  maxUses: 50,
  usedCount: 0,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  description: '20% off orders above Rs. 5000',
  active: true
});

promoCodes.set('FLAT500', {
  code: 'FLAT500',
  discountType: 'fixed',
  discountValue: 500,
  minOrderAmount: 3000,
  maxUses: 200,
  usedCount: 0,
  expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
  description: 'Rs. 500 off on orders above Rs. 3000',
  active: true
});

// Validate promo code
exports.validatePromoCode = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Promo code is required' });
    }

    const promo = promoCodes.get(code.toUpperCase());
    
    if (!promo) {
      return res.status(404).json({ message: 'Invalid promo code' });
    }

    if (!promo.active) {
      return res.status(400).json({ message: 'This promo code is no longer active' });
    }

    if (new Date() > new Date(promo.expiresAt)) {
      return res.status(400).json({ message: 'This promo code has expired' });
    }

    if (promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ message: 'This promo code has reached its maximum usage limit' });
    }

    if (orderAmount && promo.minOrderAmount && orderAmount < promo.minOrderAmount) {
      return res.status(400).json({ 
        message: `Minimum order amount of Rs. ${promo.minOrderAmount} required`,
        minOrderAmount: promo.minOrderAmount
      });
    }

    // Calculate discount
    let discount = 0;
    if (promo.discountType === 'percentage') {
      discount = (orderAmount || 0) * (promo.discountValue / 100);
    } else {
      discount = promo.discountValue;
    }

    res.json({
      valid: true,
      code: promo.code,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discount: Math.round(discount),
      minOrderAmount: promo.minOrderAmount
    });
  } catch (e) {
    console.error('validatePromoCode error:', e?.message);
    res.status(500).json({ message: e?.message || 'Failed to validate promo code' });
  }
};

// Apply promo code (mark as used)
exports.applyPromoCode = async (req, res) => {
  try {
    const { code, orderId, userId } = req.body;
    
    const promo = promoCodes.get(code.toUpperCase());
    
    if (!promo) {
      return res.status(404).json({ message: 'Invalid promo code' });
    }

    // Increment usage count
    promo.usedCount += 1;
    promoCodes.set(code.toUpperCase(), promo);

    // Optionally store usage record
    console.log(`Promo code ${code} applied. Total uses: ${promo.usedCount}`);

    res.json({ success: true, message: 'Promo code applied successfully' });
  } catch (e) {
    console.error('applyPromoCode error:', e?.message);
    res.status(500).json({ message: e?.message || 'Failed to apply promo code' });
  }
};

// Get all promo codes (admin only)
exports.getAllPromoCodes = async (req, res) => {
  try {
    const codes = Array.from(promoCodes.values());
    res.json(codes);
  } catch (e) {
    res.status(500).json({ message: e?.message || 'Failed to get promo codes' });
  }
};

// Create new promo code (admin only)
exports.createPromoCode = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt, description } = req.body;
    
    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ message: 'Code, discount type and value are required' });
    }

    const upperCode = code.toUpperCase();
    
    if (promoCodes.has(upperCode)) {
      return res.status(400).json({ message: 'Promo code already exists' });
    }

    const promo = {
      code: upperCode,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxUses: Number(maxUses) || 1000,
      usedCount: 0,
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      description: description || '',
      active: true
    };

    promoCodes.set(upperCode, promo);
    res.json(promo);
  } catch (e) {
    res.status(500).json({ message: e?.message || 'Failed to create promo code' });
  }
};

// Update promo code (admin only)
exports.updatePromoCode = async (req, res) => {
  try {
    const { code } = req.params;
    const { discountType, discountValue, minOrderAmount, maxUses, expiresAt, description, active } = req.body;
    
    const upperCode = code.toUpperCase();
    const promo = promoCodes.get(upperCode);
    
    if (!promo) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    const updated = {
      ...promo,
      ...(discountType && { discountType }),
      ...(discountValue !== undefined && { discountValue: Number(discountValue) }),
      ...(minOrderAmount !== undefined && { minOrderAmount: Number(minOrderAmount) }),
      ...(maxUses !== undefined && { maxUses: Number(maxUses) }),
      ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      ...(description !== undefined && { description }),
      ...(active !== undefined && { active })
    };

    promoCodes.set(upperCode, updated);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e?.message || 'Failed to update promo code' });
  }
};

// Delete promo code (admin only)
exports.deletePromoCode = async (req, res) => {
  try {
    const { code } = req.params;
    const upperCode = code.toUpperCase();
    
    if (!promoCodes.has(upperCode)) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    promoCodes.delete(upperCode);
    res.json({ message: 'Promo code deleted' });
  } catch (e) {
    res.status(500).json({ message: e?.message || 'Failed to delete promo code' });
  }
};
