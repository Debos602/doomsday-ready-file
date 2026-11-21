const prisma = require('../../config/db');

// Data access only: no business rules here. `db` can be a transaction client.
const include = { prerequisites: { select: { id: true } } };

module.exports = {
  transaction: (fn) => prisma.$transaction(fn),

  findAll: (db = prisma) => db.movie.findMany({ include, orderBy: { id: 'asc' } }),

  findById: (id, db = prisma) => db.movie.findUnique({ where: { id }, include }),

  countByIds: (ids, db = prisma) => db.movie.count({ where: { id: { in: ids } } }),

  create: (data, prerequisiteIds, db = prisma) =>
    db.movie.create({
      data: { ...data, prerequisites: { connect: prerequisiteIds.map((id) => ({ id })) } },
      include,
    }),

  update: (id, data, prerequisiteIds, db = prisma) =>
    db.movie.update({
      where: { id },
      data: {
        ...data,
        ...(prerequisiteIds !== undefined && { prerequisites: { set: prerequisiteIds.map((pid) => ({ id: pid })) } }),
      },
      include,
    }),
};
