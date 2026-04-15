const app = require('./app');
const { PORT } = require('./config/env');
const { connectMongo } = require('./integrations/mongo');
const { logger } = require('./common/logger');

// Redis connection is initialized on import (side-effect)
require('./integrations/redis');

const start = async () => {
  await connectMongo();
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
};

start();
