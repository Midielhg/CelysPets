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

// Get all users (admin only)
router.get('/', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    
    let whereClause: any = {};
    
    // Filter by role if specified
    if (role && role !== 'all') {
      whereClause.role = role;
    }
    
    // Search by name or email
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
      offset,
      limit: Number(limit),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(count / Number(limit)),
        totalUsers: count,
        hasNext: offset + Number(limit) < count,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get user by ID (admin only)
router.get('/:id', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'role', 'businessSettings', 'createdAt', 'updatedAt']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Create new user (admin only)
router.post('/', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, businessSettings } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    // Validate role
    const validRoles = ['client', 'admin', 'groomer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be client, admin, or groomer' });
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

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      businessSettings: businessSettings || null
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessSettings: user.businessSettings,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Update user (admin only)
router.put('/:id', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, businessSettings } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from changing their own role to non-admin
    if (user.id === req.user.id && role && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot remove admin privileges from your own account' });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['client', 'admin', 'groomer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be client, admin, or groomer' });
      }
    }

    // Check if email is taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email,
          id: { [Op.ne]: id }
        } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already taken by another user' });
      }
    }

    // Update fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 12);
    if (role !== undefined) updateData.role = role;
    if (businessSettings !== undefined) updateData.businessSettings = businessSettings;

    await user.update(updateData);

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessSettings: user.businessSettings,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting their own account
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Check if user has assigned appointments (for groomers)
    if (user.role === 'groomer' || user.role === 'admin') {
      const { Appointment } = require('../models');
      const hasAppointments = await Appointment.findOne({
        where: { groomerId: id }
      });

      if (hasAppointments) {
        return res.status(400).json({ 
          message: 'Cannot delete user with assigned appointments. Please reassign appointments first.' 
        });
      }
    }

    // Check if user has created appointments (for clients)
    if (user.role === 'client') {
      const { Appointment } = require('../models');
      const hasAppointments = await Appointment.findOne({
        where: { clientId: id }
      });

      if (hasAppointments) {
        return res.status(400).json({ 
          message: 'Cannot delete client with existing appointments. Please handle appointments first.' 
        });
      }
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Bulk update user roles (admin only)
router.patch('/bulk-update-roles', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { userIds, role } = req.body;

    if (!userIds || !Array.isArray(userIds) || !role) {
      return res.status(400).json({ message: 'userIds array and role are required' });
    }

    // Validate role
    const validRoles = ['client', 'admin', 'groomer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be client, admin, or groomer' });
    }

    // Prevent admin from changing their own role to non-admin
    if (userIds.includes(req.user.id) && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot remove admin privileges from your own account' });
    }

    const result = await User.update(
      { role },
      { 
        where: { 
          [Op.and]: [
            { id: { [Op.in]: userIds } },
            { id: { [Op.ne]: req.user.id } }
          ]
        } 
      }
    );

    res.json({ 
      message: `Successfully updated ${result[0]} user(s) to ${role} role`,
      updatedCount: result[0]
    });
  } catch (error) {
    console.error('Error bulk updating user roles:', error);
    res.status(500).json({ message: 'Failed to update user roles' });
  }
});

// Get user statistics (admin only)
router.get('/stats/overview', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalClients,
      totalGroomers,
      totalAdmins,
      recentUsers
    ] = await Promise.all([
      User.count(),
      User.count({ where: { role: 'client' } }),
      User.count({ where: { role: 'groomer' } }),
      User.count({ where: { role: 'admin' } }),
      User.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'name', 'email', 'role', 'createdAt']
      })
    ]);

    res.json({
      totals: {
        users: totalUsers,
        clients: totalClients,
        groomers: totalGroomers,
        admins: totalAdmins
      },
      recentUsers
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
});

export default router;
