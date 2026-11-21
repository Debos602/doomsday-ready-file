const express = require('express');
const cors = require('cors');
const { frontendOrigins } = require('./config/env');
const routes = require('./routes');
const notFound = require('./common/middleware/notFound');
const errorHandler = require('./common/middleware/errorHandler');

const app = express();

// Only the configured frontend may call the API from a browser; with no FRONTEND_URL, any origin is allowed.
app.use(
  cors({
    origin: frontendOrigins.length
      ? (origin, cb) => cb(null, !origin || frontendOrigins.includes(origin))
      : true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);
app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
