const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const plantsRoutes = require('./routes/plants');
const careActionsRoutes = require('./routes/careActions');
const aiRoutes = require('./routes/ai');
const profileRoutes = require('./routes/profile');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files in development
if (process.env.NODE_ENV !== 'production') {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  app.use('/uploads', express.static(path.resolve(uploadDir)));
}

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: 'Too many requests, please try again later.', code: 'RATE_LIMITED' },
  },
});

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: 'Too many authentication attempts, please try again later.', code: 'RATE_LIMITED' },
  },
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/v1/auth/', authLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/plants', plantsRoutes);
app.use('/api/v1/plants', careActionsRoutes);  // care-actions are nested under plants
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/profile', profileRoutes);

// 404 handler for unknown routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: { message: 'Route not found.', code: 'NOT_FOUND' },
  });
});

// Centralized error handler — must be last
app.use(errorHandler);

module.exports = app;
