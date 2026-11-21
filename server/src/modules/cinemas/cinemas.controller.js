const service = require('./cinemas.service');
const { parseId } = require('../../common/utils/validators');

module.exports = {
  async list(_req, res) {
    res.json(await service.list());
  },

  async create(req, res) {
    const created = await service.create(req.body);
    res.status(201).json(Array.isArray(req.body) ? created : created[0]);
  },

  async booking(req, res) {
    res.json(await service.getBookingQuote(parseId(req.params.id), req.query.groupSize));
  },
};
