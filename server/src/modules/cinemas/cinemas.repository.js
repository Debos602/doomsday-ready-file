const prisma = require('../../config/db');

module.exports = {
  createMany: (items) => prisma.$transaction(items.map((data) => prisma.cinema.create({ data }))),
  findAll: () => prisma.cinema.findMany({ orderBy: { id: 'asc' } }),
  findById: (id) => prisma.cinema.findUnique({ where: { id } }),
};
