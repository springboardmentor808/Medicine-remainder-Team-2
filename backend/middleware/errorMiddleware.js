/**
 * Wraps async route handlers to automatically catch errors and forward them to the error handler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global Express error handling middleware.
 */
const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = {
  asyncHandler,
  errorHandler
};
