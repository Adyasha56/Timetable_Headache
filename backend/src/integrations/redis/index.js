const Redis = require('ioredis');
const { REDIS_URL } = require('../../config/env');
const { logger } = require('../../common/logger');

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error:', err.message));

module.exports = redis;
