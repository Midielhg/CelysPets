import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import MySQL database connection
import { connectDatabase } from './config/database';

// Import models to set up associations
import './models/index';

// Load environment variables - prioritize .env.development in development
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.development' });
} else {
  dotenv.config();
}

// Import routes
import appointmentsRouter from './routes/appointments';
import authRouter from './routes/auth';
import clientsRouter from './routes/clients';
import groomersRouter from './routes/groomers';
import usersRouter from './routes/users';
import setupRouter from './routes/setup';
import dashboardRouter from './routes/dashboard';
import pricingRouter from './routes/pricing';
import clientRouter from './routes/client';
import promoCodesRouter from './routes/promo-codes';

const app = express();
const PORT = Number(process.env.PORT) || 5002;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Required for some hosting platforms
}));

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'http://localhost:5174', // Alternative local port  
  'http://localhost:5175', // Alternative local port
  'http://localhost:5176', // Alternative local port
  'http://localhost:5177', // Alternative local port
  'http://localhost:3000', // Alternative local port
  'http://10.0.0.158:5174', // Network IP for mobile testing (current port)
  'http://10.0.0.158:5175', // Network IP for mobile testing
  'http://10.0.0.158:5176', // Network IP for mobile testing
  'https://your-domain.com', // Replace with your actual domain
  'https://www.your-domain.com', // Replace with your actual domain
  'https://your-vercel-app.vercel.app', // Replace with your actual Vercel URL
  'https://cely-pets-mobile-grooming.netlify.app', // Netlify deployment
  process.env.CORS_ORIGIN, // From environment variable
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.url} from ${req.ip}`);
  console.log('🔗 Origin:', req.headers.origin);
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Google Maps API proxy to avoid CORS issues
app.get('/api/maps/autocomplete', async (req, res) => {
  try {
    const { input, types = 'address' } = req.query;
    const API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAKlC3v4GgU1jRhFdungYa38hbDHm0qQx0';
    
    if (!input) {
      return res.status(400).json({ error: 'Input parameter is required' });
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input as string)}&types=${types}&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Google Maps API error:', error);
    res.status(500).json({ error: 'Failed to fetch autocomplete data' });
  }
});

// API routes
app.use('/api/appointments', appointmentsRouter);
app.use('/api/auth', authRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/groomers', groomersRouter);
app.use('/api/users', usersRouter);
app.use('/api/setup', setupRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/client', clientRouter);
app.use('/api/promo-codes', promoCodesRouter);

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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    await connectDatabase();
    
    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Network access: http://10.0.0.158:${PORT}/health`);
      if (process.env.NODE_ENV === 'development') {
        console.log(`📋 API docs: http://localhost:${PORT}/api`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: any) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

startServer();
// restart trigger
