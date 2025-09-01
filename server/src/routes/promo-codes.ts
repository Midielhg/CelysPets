import express from 'express';
import { PromoCode } from '../models/PromoCodeMySQL';
import { PromoCodeUsage } from '../models/PromoCodeUsageMySQL';
import { auth } from '../middleware/authMySQL';
import { Op } from 'sequelize';

const router = express.Router();

// Get all promo codes (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const promoCodes = await PromoCode.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(promoCodes);
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
});

// Create a new promo code (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const {
      code,
      name,
      discountType,
      discountValue,
      minimumAmount,
      maxUsageTotal,
      maxUsagePerCustomer,
      validFrom,
      validUntil,
      active
    } = req.body;

    // Check if code already exists
    const existingCode = await PromoCode.findOne({ where: { code } });
    if (existingCode) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }

    const promoCode = await PromoCode.create({
      code: code.toUpperCase(),
      name,
      discountType,
      discountValue,
      minimumAmount,
      maxUsageTotal: maxUsageTotal || 999999,
      maxUsagePerCustomer: maxUsagePerCustomer || 1,
      currentUsageTotal: 0,
      validFrom,
      validUntil,
      active: active ?? true
    });

    res.status(201).json(promoCode);
  } catch (error) {
    console.error('Error creating promo code:', error);
    res.status(500).json({ error: 'Failed to create promo code' });
  }
});

// Update a promo code (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      discountType,
      discountValue,
      minimumAmount,
      maxUsageTotal,
      maxUsagePerCustomer,
      validFrom,
      validUntil,
      active
    } = req.body;

    const promoCode = await PromoCode.findByPk(id);
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    // Check if new code already exists (if code is being changed)
    if (code && code !== promoCode.code) {
      const existingCode = await PromoCode.findOne({ where: { code: code.toUpperCase() } });
      if (existingCode) {
        return res.status(400).json({ error: 'Promo code already exists' });
      }
    }

    await promoCode.update({
      code: code ? code.toUpperCase() : promoCode.code,
      name: name ?? promoCode.name,
      discountType: discountType ?? promoCode.discountType,
      discountValue: discountValue ?? promoCode.discountValue,
      minimumAmount: minimumAmount ?? promoCode.minimumAmount,
      maxUsageTotal: maxUsageTotal ?? promoCode.maxUsageTotal,
      maxUsagePerCustomer: maxUsagePerCustomer ?? promoCode.maxUsagePerCustomer,
      validFrom: validFrom ?? promoCode.validFrom,
      validUntil: validUntil ?? promoCode.validUntil,
      active: active ?? promoCode.active
    });

    res.json(promoCode);
  } catch (error) {
    console.error('Error updating promo code:', error);
    res.status(500).json({ error: 'Failed to update promo code' });
  }
});

// Delete a promo code (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findByPk(id);
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    await promoCode.destroy();
    res.json({ message: 'Promo code deleted successfully' });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    res.status(500).json({ error: 'Failed to delete promo code' });
  }
});

// Validate a promo code (public endpoint for customers)
router.post('/validate', async (req, res) => {
  try {
    const { code, totalAmount } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Promo code is required' });
    }

    const promoCode = await PromoCode.findOne({
      where: { 
        code: code.toUpperCase(),
        active: true
      }
    });

    if (!promoCode) {
      return res.status(400).json({ error: 'Invalid promo code' });
    }

    const now = new Date();
    
    // Check if promo code is valid by date
    if (promoCode.validFrom && new Date(promoCode.validFrom) > now) {
      return res.status(400).json({ error: 'Promo code is not yet valid' });
    }

    if (promoCode.validUntil && new Date(promoCode.validUntil) < now) {
      return res.status(400).json({ error: 'Promo code has expired' });
    }

    // Check usage limit
    if (promoCode.maxUsageTotal) {
      if (promoCode.currentUsageTotal >= promoCode.maxUsageTotal) {
        return res.status(400).json({ error: 'Promo code usage limit reached' });
      }
    }

    // Check minimum purchase requirement
    if (promoCode.minimumAmount && totalAmount < promoCode.minimumAmount) {
      return res.status(400).json({ 
        error: `Minimum purchase of $${promoCode.minimumAmount} required` 
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.discountType === 'percentage') {
      discountAmount = (totalAmount * promoCode.discountValue) / 100;
    } else {
      discountAmount = promoCode.discountValue;
    }

    res.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        name: promoCode.name,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue
      },
      discountAmount,
      finalAmount: Math.max(0, totalAmount - discountAmount)
    });

  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ error: 'Failed to validate promo code' });
  }
});

export default router;
