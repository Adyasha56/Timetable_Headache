const mongoose = require('mongoose');
const { MONGODB_URI } = require('../../config/env');
const { logger } = require('../../common/logger');

const connectMongo = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = { connectMongo };
