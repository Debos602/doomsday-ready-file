// Quick database connection check: npm run db:check
// Shows where DATABASE_URL comes from (never prints the password) and the real error from PostgreSQL.
const shellValue = process.env.DATABASE_URL; // set before .env is loaded => comes from the terminal / system
const { databaseUrl } = require('../src/config/env');
const { Client } = require('pg');

function describe(url) {
  try {
    const u = new URL(url);
    return {
      user: decodeURIComponent(u.username) || '(none)',
      passwordLength: decodeURIComponent(u.password).length,
      host: u.host,
      database: u.pathname.slice(1),
      options: [...u.searchParams.keys()].join(', ') || '(none)',
    };
  } catch {
    return { error: 'DATABASE_URL is not a valid URL' };
  }
}

async function main() {
  console.log(
    shellValue
      ? 'DATABASE_URL source: your terminal/system environment (this OVERRIDES .env)'
      : 'DATABASE_URL source: .env file (or DB_* values)'
  );
  console.log(describe(databaseUrl));

  const client = new Client({ connectionString: databaseUrl, connectionTimeoutMillis: 20000 });
  try {
    await client.connect();
    const who = await client.query('select current_user as "user", current_database() as db');
    console.log('Connected:', who.rows[0]);
    const t = await client.query(`select to_regclass('public."Movie"') as movie, to_regclass('public."Cinema"') as cinema`);
    console.log(t.rows[0].movie && t.rows[0].cinema ? 'Tables: found (Movie, Cinema)' : 'Tables: MISSING, run npm run db:migrate');
  } catch (e) {
    console.error('Connection failed:', e.code || '', e.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();
