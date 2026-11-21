const service = require('./movies.service');
const { parseId } = require('../../common/utils/validators');

// Thin HTTP layer: parse input, call the service, shape the response.
module.exports = {
  async list(_req, res) {
    res.json(await service.list());
  },

  async getById(req, res) {
    res.json(await service.getById(parseId(req.params.id)));
  },

  async create(req, res) {
    const created = await service.create(req.body);
    res.status(201).json(Array.isArray(req.body) ? created : created[0]);
  },

  async update(req, res) {
    res.json(await service.update(parseId(req.params.id), req.body));
  },

  async rewatchOrder(req, res) {
    res.json(await service.getRewatchOrder(parseId(req.params.id)));
  },
};
