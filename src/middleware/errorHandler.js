const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  if (err.status === 503) {
    return res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: err.message },
      meta: { timestamp: new Date().toISOString() },
    });
  }
  console.error(err);

  if (err.name === 'ZodError') {
    return error(res, 'Validation error', 422, 'VALIDATION_ERROR',
      err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    );
  }

  if (err.code === 'P2002') {
    return error(res, 'Resource already exists', 409, 'CONFLICT');
  }

  if (err.code === 'P2025') {
    return error(res, 'Resource not found', 404, 'NOT_FOUND');
  }

  return error(res, 'Internal server error', 500, 'SERVER_ERROR');
};

const notFound = (req, res) => {
  return error(res, `Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND');
};

module.exports = { errorHandler, notFound };
