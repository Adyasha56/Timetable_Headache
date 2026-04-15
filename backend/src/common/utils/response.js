const success = (res, data, statusCode = 200, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
    error: null,
  });
};

const error = (res, message, statusCode = 500, code = 'INTERNAL_ERROR', details = []) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: { code, message, details },
  });
};

module.exports = { success, error };
