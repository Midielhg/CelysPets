import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/UserMySQL';
import { auth } from '../middleware/authMySQL';
import { Op } from 'sequelize';

interface AuthRequest extends Request {
  user?: any;
}

const router = express.Router();

// Middleware to check admin role
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Get all groomers (admin only)
router.get('/', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const groomers = await User.findAll({
      where: { 
        role: {
          [Op.in]: ['groomer', 'admin']
        }
      },
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt']
    });

    res.json(groomers);
  } catch (error) {
    console.error('Error fetching groomers:', error);
    res.status(500).json({ message: 'Failed to fetch groomers' });
  }
});

// Create new groomer (admin only)
router.post('/', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, canBeAdmin = false } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { email } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create groomer
    const groomer = await User.create({
      name,
      email,
      password: hashedPassword,
      role: canBeAdmin ? 'admin' : 'groomer'
    });

    res.status(201).json({
      message: 'Groomer created successfully',
      groomer: {
        id: groomer.id,
        name: groomer.name,
        email: groomer.email,
        role: groomer.role,
        createdAt: groomer.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating groomer:', error);
    res.status(500).json({ message: 'Failed to create groomer' });
  }
});

// Update groomer (admin only)
router.put('/:id', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, canBeAdmin } = req.body;

    const groomer = await User.findOne({
      where: { id, role: ['groomer', 'admin'] }
    });

    if (!groomer) {
      return res.status(404).json({ message: 'Groomer not found' });
    }

    // Update fields
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 12);
    if (canBeAdmin !== undefined) {
      updateData.role = canBeAdmin ? 'admin' : 'groomer';
    }

    await groomer.update(updateData);

    res.json({
      message: 'Groomer updated successfully',
      groomer: {
        id: groomer.id,
        name: groomer.name,
        email: groomer.email,
        role: groomer.role,
        updatedAt: groomer.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating groomer:', error);
    res.status(500).json({ message: 'Failed to update groomer' });
  }
});

// Delete groomer (admin only)
router.delete('/:id', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const groomer = await User.findOne({
      where: { id, role: ['groomer', 'admin'] }
    });

    if (!groomer) {
      return res.status(404).json({ message: 'Groomer not found' });
    }

    // Check if groomer has assigned appointments
    const { Appointment } = require('../models');
    const hasAppointments = await Appointment.findOne({
      where: { groomerId: id }
    });

    if (hasAppointments) {
      return res.status(400).json({ 
        message: 'Cannot delete groomer with assigned appointments. Please reassign appointments first.' 
      });
    }

    await groomer.destroy();

    res.json({ message: 'Groomer deleted successfully' });
  } catch (error) {
    console.error('Error deleting groomer:', error);
    res.status(500).json({ message: 'Failed to delete groomer' });
  }
});

// Get groomer profile (for groomers to view their own profile)
router.get('/profile', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });

    if (!user || (user.role !== 'groomer' && user.role !== 'admin')) {
      return res.status(404).json({ message: 'Groomer profile not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching groomer profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

export default router;
