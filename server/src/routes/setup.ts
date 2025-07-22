import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/UserMySQL';

const router = express.Router();

// Create first admin user (only if no users exist)
router.post('/create-first-admin', async (req: Request, res: Response) => {
  try {
    // Check if any users exist
    const userCount = await User.count();
    
    if (userCount > 0) {
      return res.status(400).json({ 
        message: 'Users already exist. Use the regular user management system.' 
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Name, email, and password are required' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create first admin user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    res.status(201).json({
      message: 'First admin user created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error creating first admin user:', error);
    res.status(500).json({ message: 'Failed to create first admin user' });
  }
});

// Make existing user an admin (temporary endpoint for setup)
router.post('/promote-to-admin', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user role to admin
    await user.update({ role: 'admin' });

    res.json({
      message: 'User promoted to admin successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    res.status(500).json({ message: 'Failed to promote user to admin' });
  }
});

export default router;
