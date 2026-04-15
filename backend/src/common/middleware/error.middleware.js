const { logger } = require('../logger');

const errorHandler = (err, req, res, next) => {
  // MongoDB duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field];
    return res.status(409).json({
      success: false,
      data: null,
      error: {
        code: 'DUPLICATE',
        message: `${field} '${value}' already exists`,
        details: [],
      },
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details },
    });
  }

  if (!err.isOperational) {
    logger.error('Unexpected error:', err);
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.isOperational ? err.message : 'Something went wrong';
  const details = err.details || [];

  return res.status(statusCode).json({
    success: false,
    data: null,
    error: { code, message, details },
  });
};

const notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    data: null,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      details: [],
    },
  });
};

module.exports = { errorHandler, notFound };
