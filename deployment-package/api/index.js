"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import MySQL database connection
const database_1 = require("./config/database");
// Import models to set up associations
require("./models/index");
// Load environment variables
dotenv_1.default.config();
// Import routes
const appointments_1 = __importDefault(require("./routes/appointments"));
const auth_1 = __importDefault(require("./routes/auth"));
const routeOptimization_1 = __importDefault(require("./routes/routeOptimization"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginEmbedderPolicy: false, // Required for some hosting platforms
}));
// CORS configuration for production
const allowedOrigins = [
    'http://localhost:5173', // Local development
    'http://localhost:5174', // Alternative local port  
    'http://localhost:5175', // Alternative local port
    'http://localhost:3000', // Alternative local port
    'https://your-domain.com', // Replace with your actual domain
    'https://www.your-domain.com', // Replace with your actual domain
    'https://your-vercel-app.vercel.app', // Replace with your actual Vercel URL
    'https://cely-pets-mobile-grooming.netlify.app', // Netlify deployment
    process.env.CORS_ORIGIN, // From environment variable
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Rate limiting for production
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// Apply rate limiting to all API routes
app.use('/api/', limiter);
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// API routes
app.use('/api/appointments', appointments_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/route-optimization', routeOptimization_1.default);
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Cely\'s Pets Mobile Grooming API',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/health'
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    // CORS error
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'CORS policy violation' });
    }
    // Rate limit error
    if (err.status === 429) {
        return res.status(429).json({ error: 'Too many requests' });
    }
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
// Connect to MySQL database and start server
const startServer = async () => {
    try {
        // Connect to MySQL database
        await (0, database_1.connectDatabase)();
        // Start the server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
            if (process.env.NODE_ENV === 'development') {
                console.log(`📋 API docs: http://localhost:${PORT}/api`);
            }
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
startServer();
//# sourceMappingURL=index.js.map