const redis = require('../../integrations/redis');
const { logger } = require('../../common/logger');

const SOLVER_QUEUE = 'solver:jobs';

const dispatchSolverJob = async (payload) => {
  await redis.lpush(SOLVER_QUEUE, JSON.stringify(payload));
  logger.info(`Solver job dispatched for schedule ${payload.schedule_id}`);
};

module.exports = { dispatchSolverJob };
