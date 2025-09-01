import express from 'express';
import { Op } from 'sequelize';
import { Breed } from '../models/BreedMySQL';
import { AdditionalService } from '../models/AdditionalServiceMySQL';
import { PromoCode } from '../models/PromoCodeMySQL';
import { PromoCodeUsage } from '../models/PromoCodeUsageMySQL';
import { auth } from '../middleware/authMySQL';

const router = express.Router();

// Public endpoints to list breeds and additional services (for booking UI)
router.get('/breeds', async (_req, res) => {
  try {
    const breeds = await Breed.findAll({ where: { active: true }, order: [['species','ASC'], ['sizeCategory','ASC'], ['name','ASC']] });
    res.json(breeds);
  } catch (e) {
    console.error('Error fetching breeds', e);
    res.status(500).json({ message: 'Failed to fetch breeds' });
  }
});

router.get('/additional-services', async (_req, res) => {
  try {
    const services = await AdditionalService.findAll({ where: { active: true }, order: [['name','ASC']] });
    res.json(services);
  } catch (e) {
    console.error('Error fetching additional services', e);
    res.status(500).json({ message: 'Failed to fetch additional services' });
  }
});

// Admin CRUD for breeds
router.post('/breeds', auth, async (req, res) => {
  try {
    const { species, name, sizeCategory, fullGroomPrice, active } = req.body;
    const breed = await Breed.create({ species, name, sizeCategory, fullGroomPrice, active: active ?? true });
    res.status(201).json(breed);
  } catch (e) {
    console.error('Error creating breed', e);
    res.status(500).json({ message: 'Failed to create breed' });
  }
});

router.put('/breeds/:id', auth, async (req, res) => {
  try {
    const breed = await Breed.findByPk(req.params.id);
    if (!breed) return res.status(404).json({ message: 'Breed not found' });
    await breed.update(req.body);
    res.json(breed);
  } catch (e) {
    console.error('Error updating breed', e);
    res.status(500).json({ message: 'Failed to update breed' });
  }
});

router.delete('/breeds/:id', auth, async (req, res) => {
  try {
    const breed = await Breed.findByPk(req.params.id);
    if (!breed) return res.status(404).json({ message: 'Breed not found' });
    await breed.destroy();
    res.json({ message: 'Breed deleted' });
  } catch (e) {
    console.error('Error deleting breed', e);
    res.status(500).json({ message: 'Failed to delete breed' });
  }
});

// Admin CRUD for additional services
router.post('/additional-services', auth, async (req, res) => {
  try {
    const { code, name, price, description, active } = req.body;
    const service = await AdditionalService.create({ code, name, price, description, active: active ?? true });
    res.status(201).json(service);
  } catch (e) {
    console.error('Error creating additional service', e);
    res.status(500).json({ message: 'Failed to create additional service' });
  }
});

router.put('/additional-services/:id', auth, async (req, res) => {
  try {
    const service = await AdditionalService.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: 'Additional service not found' });
    await service.update(req.body);
    res.json(service);
  } catch (e) {
    console.error('Error updating additional service', e);
    res.status(500).json({ message: 'Failed to update additional service' });
  }
});

router.delete('/additional-services/:id', auth, async (req, res) => {
  try {
    const service = await AdditionalService.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: 'Additional service not found' });
    await service.destroy();
    res.json({ message: 'Additional service deleted' });
  } catch (e) {
    console.error('Error deleting additional service', e);
    res.status(500).json({ message: 'Failed to delete additional service' });
  }
});

// Utility endpoint to estimate price for a pet/breed
router.get('/estimate', async (req, res) => {
  try {
    const { species, breedName } = req.query as { species?: string; breedName?: string };
    if (!species || !breedName) return res.status(400).json({ message: 'species and breedName are required' });
    const breed = await Breed.findOne({ where: { species, name: breedName } });
    if (!breed) return res.status(404).json({ message: 'Breed not found' });
    res.json({ fullGroomPrice: Number(breed.fullGroomPrice) });
  } catch (e) {
    console.error('Error estimating price', e);
    res.status(500).json({ message: 'Failed to estimate price' });
  }
});

// Get breed info by name (for booking flow)
router.get('/breed-lookup/:breedName', async (req, res) => {
  try {
    const { breedName } = req.params;
    
    const breed = await Breed.findOne({
      where: { 
        name: { [Op.iLike]: `%${breedName}%` } // Case-insensitive search
      }
    });
    
    if (!breed) {
      return res.status(404).json({ message: 'Breed not found' });
    }
    
    res.json({
      id: breed.id,
      breedName: breed.name,
      species: breed.species,
      sizeCategory: breed.sizeCategory,
      fullGroomPrice: breed.fullGroomPrice
    });
    
  } catch (error) {
    console.error('Error looking up breed:', error);
    res.status(500).json({ message: 'Failed to lookup breed' });
  }
});

// ==== PROMO CODE ROUTES ====

// Public: Validate and apply promo code
router.post('/promo-codes/validate', async (req, res) => {
  try {
    const { code, customerEmail, orderTotal } = req.body;
    
    if (!code || !customerEmail || orderTotal === undefined) {
      return res.status(400).json({ message: 'Code, customer email, and order total are required' });
    }

    // Find the promo code
    const promoCode = await PromoCode.findOne({
      where: { 
        code: code.toUpperCase(),
        active: true
      }
    });

    if (!promoCode) {
      return res.status(404).json({ message: 'Invalid promo code' });
    }

    // Check date validity
    const now = new Date();
    if (promoCode.validFrom && now < promoCode.validFrom) {
      return res.status(400).json({ message: 'Promo code is not yet valid' });
    }
    if (promoCode.validUntil && now > promoCode.validUntil) {
      return res.status(400).json({ message: 'Promo code has expired' });
    }

    // Check minimum amount
    if (promoCode.minimumAmount && orderTotal < promoCode.minimumAmount) {
      return res.status(400).json({ 
        message: `Minimum order amount of $${promoCode.minimumAmount} required` 
      });
    }

    // Check total usage limit
    if (promoCode.currentUsageTotal >= promoCode.maxUsageTotal) {
      return res.status(400).json({ message: 'Promo code usage limit reached' });
    }

    // Check customer usage limit
    const customerUsageCount = await PromoCodeUsage.count({
      where: {
        promoCodeId: promoCode.id,
        customerEmail: customerEmail.toLowerCase()
      }
    });

    if (customerUsageCount >= promoCode.maxUsagePerCustomer) {
      return res.status(400).json({ message: 'You have already used this promo code the maximum number of times' });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.discountType === 'percentage') {
      discountAmount = (orderTotal * promoCode.discountValue) / 100;
    } else {
      discountAmount = Math.min(promoCode.discountValue, orderTotal);
    }

    const finalTotal = Math.max(0, orderTotal - discountAmount);

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
      finalTotal,
      savings: discountAmount
    });

  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ message: 'Failed to validate promo code' });
  }
});

// Public: Get active promo codes for admin dropdown (only basic info)
router.get('/promo-codes/active', auth, async (req, res) => {
  try {
    const promoCodes = await PromoCode.findAll({
      where: { active: true },
      attributes: ['id', 'code', 'name', 'discountType', 'discountValue'],
      order: [['name', 'ASC']]
    });
    res.json(promoCodes);
  } catch (error) {
    console.error('Error fetching active promo codes:', error);
    res.status(500).json({ message: 'Failed to fetch promo codes' });
  }
});

// Admin: Get all promo codes
router.get('/promo-codes', auth, async (req, res) => {
  try {
    const promoCodes = await PromoCode.findAll({
      include: [{
        model: PromoCodeUsage,
        as: 'usages',
        attributes: ['id', 'customerEmail', 'usedAt', 'discountAmount']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(promoCodes);
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({ message: 'Failed to fetch promo codes' });
  }
});

// Admin: Create promo code
router.post('/promo-codes', auth, async (req, res) => {
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

    if (!code || !name || !discountType || discountValue === undefined || !maxUsageTotal || !maxUsagePerCustomer) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const promoCode = await PromoCode.create({
      code: code.toUpperCase(),
      name,
      discountType,
      discountValue,
      minimumAmount,
      maxUsageTotal,
      maxUsagePerCustomer,
      validFrom: validFrom || null,
      validUntil: validUntil || null,
      active: active ?? true
    });

    res.status(201).json(promoCode);
  } catch (error: any) {
    console.error('Error creating promo code:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Promo code already exists' });
    }
    res.status(500).json({ message: 'Failed to create promo code' });
  }
});

// Admin: Update promo code
router.put('/promo-codes/:id', auth, async (req, res) => {
  try {
    const promoCode = await PromoCode.findByPk(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    // Update code to uppercase if provided
    const updateData = { ...req.body };
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    await promoCode.update(updateData);
    res.json(promoCode);
  } catch (error: any) {
    console.error('Error updating promo code:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Promo code already exists' });
    }
    res.status(500).json({ message: 'Failed to update promo code' });
  }
});

// Admin: Delete promo code
router.delete('/promo-codes/:id', auth, async (req, res) => {
  try {
    const promoCode = await PromoCode.findByPk(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    await promoCode.destroy();
    res.json({ message: 'Promo code deleted' });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    res.status(500).json({ message: 'Failed to delete promo code' });
  }
});

// Admin: Record promo code usage (called when booking is confirmed)
router.post('/promo-codes/use', auth, async (req, res) => {
  try {
    const { promoCodeId, customerEmail, appointmentId, discountAmount } = req.body;

    if (!promoCodeId || !customerEmail || discountAmount === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Record the usage
    const usage = await PromoCodeUsage.create({
      promoCodeId,
      customerEmail: customerEmail.toLowerCase(),
      appointmentId,
      discountAmount,
      usedAt: new Date()
    });

    // Increment the total usage count
    await PromoCode.increment('currentUsageTotal', {
      where: { id: promoCodeId }
    });

    res.status(201).json(usage);
  } catch (error) {
    console.error('Error recording promo code usage:', error);
    res.status(500).json({ message: 'Failed to record promo code usage' });
  }
});

export default router;
