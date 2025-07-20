"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserMySQL_1 = require("../models/UserMySQL");
const router = express_1.default.Router();
// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        // Check if user already exists
        const existingUser = await UserMySQL_1.User.findOne({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Create user
        const user = await UserMySQL_1.User.create({
            email,
            password: hashedPassword,
            name,
            role: 'client'
        });
        // Create JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Failed to create user' });
    }
});
// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);
        // Find user by email
        const user = await UserMySQL_1.User.findOne({
            where: { email }
        });
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        console.log('User found, checking password...');
        // Check password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('Invalid password for:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        console.log('Password valid, creating token...');
        // Create JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        console.log('Login successful for:', email);
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                businessSettings: user.businessSettings
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
});
// Get current user
router.get('/me', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await UserMySQL_1.User.findByPk(decoded.userId, {
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                businessSettings: user.businessSettings
            }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});
// Update user profile
router.put('/profile', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const { name, email, businessSettings } = req.body;
        const user = await UserMySQL_1.User.findByPk(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Update user fields
        if (name)
            user.name = name;
        if (email)
            user.email = email;
        if (businessSettings)
            user.businessSettings = businessSettings;
        await user.save();
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                businessSettings: user.businessSettings
            }
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Update failed' });
    }
});
exports.default = router;
//# sourceMappingURL=auth-mysql.js.map