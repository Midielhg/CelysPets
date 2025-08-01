import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/UserMySQL';

interface AuthRequest extends Request {
  user?: any;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Auth header received:', authHeader);
    
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Access token required' });
    }

    console.log('Token received:', token.substring(0, 20) + '...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    console.log('Token decoded successfully, userId:', decoded.userId);
    
    const user = await User.findByPk(decoded.userId); // MySQL/Sequelize method

    if (!user) {
      console.log('User not found with ID:', decoded.userId);
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log('User authenticated:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.log('Auth error:', error instanceof Error ? error.message : error);
    res.status(401).json({ message: 'Invalid token' });
  }
};
