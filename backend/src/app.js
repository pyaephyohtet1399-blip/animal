const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');


const requestId = require('./middleware/requestId');
const requestLogger = require('./middleware/requestLogger');
const uploadBody = require('./middleware/uploadBody');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const corsOptions = require('./config/cors');
const healthRoutes = require('./routes/health.routes');
const apiRoutes = require('./routes/index');

const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(requestId);
  app.use(
    helmet({
      contentSecurityPolicy: true,
      strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true }
    })
  );
  app.use(cors(corsOptions));
  app.use(compression({ level: 6, threshold: 1024 }));
  app.use(uploadBody);
  app.use(express.json({ limit: process.env.BODY_LIMIT || '1mb' }));

  app.use(requestLogger);

  app.use('/health', healthRoutes);
  app.use('/api/v1', apiRoutes);
  

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
