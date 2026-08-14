const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Configure CORS for both development and production
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://pillsync-3.onrender.com',
  'http://localhost:5173',
  'http://localhost:5000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Mount API Routing modules
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/medications', require('./routes/medicationRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/adherence', require('./routes/adherenceRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Production & Static Serving configuration
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const indexPath = path.join(frontendDistPath, 'index.html');
const hasDistFolder = fs.existsSync(frontendDistPath) && fs.existsSync(indexPath);

if (hasDistFolder) {
  // Serve static files from the React/Vite build folder
  app.use(express.static(frontendDistPath));

  // Catch-all route to return index.html for React Router client-side navigation
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(indexPath);
  });
} else {
  // Fallback endpoint if static build directory is missing
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'PillSync API Server is active and operational.'
    });
  });
}

// Fallback 404 Route for unmatched API requests
app.use('/api/*', (req, res, next) => {
  res.status(404);
  const error = new Error(`Not Found - API endpoint requested does not exist: ${req.originalUrl}`);
  next(error);
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
