/**
 * Centralized express error handler middleware.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || res.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Do not expose stack traces, secrets, or internal paths in production
  const response = {
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred',
  };

  if (!isProd && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json(response);
};

module.exports = errorHandler;
