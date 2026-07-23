const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const policyRoutes = require('./routes/policyRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const fraudRoutes = require('./routes/fraudRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading local receipt images in the frontend
}));

// CORS Configuration (Dynamically allow localhost origins and configured URL)
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy violation'), false);
  },
  credentials: true
}));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Request Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom Inline Cookie Parser (Avoids external dependency)
app.use((req, res, next) => {
  req.cookies = {};
  const rawCookieHeader = req.headers.cookie;
  if (rawCookieHeader) {
    const rawCookies = rawCookieHeader.split(';');
    for (const cookie of rawCookies) {
      const parts = cookie.split('=');
      const name = parts[0].trim();
      const value = parts.slice(1).join('=');
      req.cookies[name] = decodeURIComponent(value);
    }
  }
  next();
});

// Static files route for uploaded receipt PDFs and images
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// API Routes mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/policies', policyRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/receipts', receiptRoutes);
app.use('/api/v1/fraud', fraudRoutes);
app.use('/api/v1/dashboards', dashboardRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Express Error Handler] ${err.stack}`);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
