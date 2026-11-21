const ApiError = require('../errors/ApiError');

// eslint-disable-next-line no-unused-vars
module.exports = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } });
  }
  if (err.code === 'P2002') {
    const field = (err.meta && err.meta.target && String(err.meta.target)) || 'value';
    const what = field.includes('title') ? 'A movie with this title' : field.includes('name') ? 'A cinema with this name' : 'This value';
    return res.status(409).json({ error: { code: 'DUPLICATE', message: `${what} already exists` } });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Record not found' } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
};
