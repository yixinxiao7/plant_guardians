const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const { authLimiter, statsLimiter, globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const plantsRoutes = require('./routes/plants');
const careActionsRoutes = require('./routes/careActions');
const aiRoutes = require('./routes/ai');
const profileRoutes = require('./routes/profile');
const careHistoryRoutes = require('./routes/careHistory');
const careActionsStatsRoutes = require('./routes/careActionsStats');
const careActionsStreakRoutes = require('./routes/careActionsStreak');
const careDueRoutes = require('./routes/careDue');
const accountRoutes = require('./routes/account');
const notificationPreferencesRoutes = require('./routes/notificationPreferences');
const unsubscribeRoutes = require('./routes/unsubscribe');

const app = express();

// Trust first proxy (Render's reverse proxy) — required for express-rate-limit
// to correctly read client IP from X-Forwarded-For header
if (process.env.RENDER === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security headers
app.use(helmet());

// CORS — supports comma-separated list of origins for staging (e.g., :5173 dev + :4173 preview)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, health checks, same-origin)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Cookie parsing — must be before auth routes so req.cookies is populated
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static assets (T-059).
// In production, a reverse proxy (nginx) would typically handle this,
// but the Express fallback ensures photo_url is always browser-accessible.
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
// Ensure the uploads directory exists at startup
const fs = require('fs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Rate limiting (T-111) — tiered: auth (strict), stats (moderate), global (permissive)
// All limiters skip in NODE_ENV=test. See middleware/rateLimiter.js for config.
app.use('/api/', globalLimiter);
app.use('/api/v1/auth/', authLimiter);
app.use('/api/v1/care-actions/stats', statsLimiter);
app.use('/api/v1/care-actions/streak', statsLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/plants', plantsRoutes);
app.use('/api/v1/plants', careActionsRoutes);  // care-actions are nested under plants
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/care-actions/stats', careActionsStatsRoutes);
app.use('/api/v1/care-actions/streak', careActionsStreakRoutes);
app.use('/api/v1/care-actions', careHistoryRoutes);
app.use('/api/v1/care-due', careDueRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/profile/notification-preferences', notificationPreferencesRoutes);
app.use('/api/v1/account', accountRoutes);
app.use('/api/v1/unsubscribe', unsubscribeRoutes);

// Dev/test only: admin trigger-reminders endpoint (T-101)
if (process.env.NODE_ENV !== 'production') {
  const adminRemindersRoutes = require('./routes/adminReminders');
  app.use('/api/v1/admin/trigger-reminders', adminRemindersRoutes);
}

// 404 handler for unknown routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: { message: 'Route not found.', code: 'NOT_FOUND' },
  });
});

// Centralized error handler — must be last
app.use(errorHandler);

module.exports = app;
