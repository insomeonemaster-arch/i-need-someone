const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const { defaultLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Trust the first proxy (DigitalOcean App Platform / load balancer)
app.set('trust proxy', 1);

// Security
app.use(helmet());
const allowedOrigins = (process.env.ALLOWED_ORIGINS || config.frontendUrl)
  .split(',')
  .map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.env !== 'test') app.use(morgan('dev'));

// Rate limiting
app.use(`/api/${config.apiVersion}`, defaultLimiter);

// Routes
app.use(`/api/${config.apiVersion}`, require('./routes'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', version: config.apiVersion }));

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
