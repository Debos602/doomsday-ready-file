const prisma = require('../src/config/db');

// Sample data from the assessment (not an official watch guide).
const movies = [
  { title: 'Iron Man', releaseYear: 2008, runtime: 126, needs: [] },
  { title: 'Captain America: The First Avenger', releaseYear: 2011, runtime: 124, needs: [] },
  { title: 'The Avengers', releaseYear: 2012, runtime: 143, needs: ['Iron Man', 'Captain America: The First Avenger'] },
  { title: 'Captain America: Civil War', releaseYear: 2016, runtime: 147, needs: ['The Avengers'] },
  { title: 'Thor: Ragnarok', releaseYear: 2017, runtime: 130, needs: [] },
  { title: 'Avengers: Infinity War', releaseYear: 2018, runtime: 149, needs: ['Captain America: Civil War', 'Thor: Ragnarok'] },
  { title: 'Avengers: Endgame', releaseYear: 2019, runtime: 181, needs: ['Avengers: Infinity War'] },
  { title: 'Avengers: Doomsday', releaseYear: 2026, runtime: 150, needs: ['Avengers: Endgame'] },
];

const cinemas = [
  { name: 'Starlight Cinema', bundleSizes: [1, 3, 4] },
  { name: 'Galaxy Multiplex', bundleSizes: [2, 5] },
  { name: 'Wakanda Screens', bundleSizes: [6, 9, 20] },
  { name: 'Quantum Theatre', bundleSizes: [4, 6] },
];

async function main() {
  // Idempotent: safe to run many times.
  for (const m of movies) {
    await prisma.movie.upsert({
      where: { title: m.title },
      update: {},
      create: { title: m.title, releaseYear: m.releaseYear, runtime: m.runtime },
    });
  }
  for (const m of movies) {
    await prisma.movie.update({
      where: { title: m.title },
      data: { prerequisites: { set: m.needs.map((title) => ({ title })) } },
    });
  }
  for (const c of cinemas) {
    await prisma.cinema.upsert({ where: { name: c.name }, update: { bundleSizes: c.bundleSizes }, create: c });
  }
  console.log(`Seeded ${movies.length} movies and ${cinemas.length} cinemas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
