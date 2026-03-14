const success = (res, data, statusCode = 200, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
};

const paginated = (res, data, pagination) => {
  return res.status(200).json({
    success: true,
    data,
    pagination,
    meta: { timestamp: new Date().toISOString() },
  });
};

const error = (res, message, statusCode = 500, code = 'SERVER_ERROR', details = null) => {
  const body = {
    success: false,
    error: { code, message },
    meta: { timestamp: new Date().toISOString() },
  };
  if (details) body.error.details = details;
  return res.status(statusCode).json(body);
};

const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const perPage = Math.min(100, parseInt(query.perPage) || 20);
  const skip = (page - 1) * perPage;
  return { page, perPage, skip };
};

const buildPaginationMeta = (total, page, perPage) => ({
  page,
  perPage,
  total,
  totalPages: Math.ceil(total / perPage),
  hasNext: page < Math.ceil(total / perPage),
  hasPrev: page > 1,
});

module.exports = { success, paginated, error, getPagination, buildPaginationMeta };
