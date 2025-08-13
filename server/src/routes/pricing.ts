import express from 'express';
import { Op } from 'sequelize';
import { Breed } from '../models/BreedMySQL';
import { AdditionalService } from '../models/AdditionalServiceMySQL';
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

export default router;
