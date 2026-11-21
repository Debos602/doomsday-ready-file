require('dotenv').config();

// Build DATABASE_URL from DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME when it is not set directly.
// (dotenv does not expand ${VAR}, so a templated DATABASE_URL from .env is rebuilt here too.)
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('${')) {
  const { DB_HOST = 'localhost', DB_PORT = '5432', DB_USER = '', DB_PASSWORD = '', DB_NAME = '' } = process.env;
  const auth = DB_USER ? `${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@` : '';
  process.env.DATABASE_URL = `postgresql://${auth}${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;
}

// Neon shows `channel_binding=require` in its connection strings. The Node `pg` driver and Neon's
// pooled endpoint do not work with it (login fails), so drop that parameter.
process.env.DATABASE_URL = process.env.DATABASE_URL
  .replace(/([?&])channel_binding=[^&]*(&|$)/, (_m, lead, tail) => (tail ? lead : ''))
  .replace(/[?&]$/, '');

// FRONTEND_URL = the web app's origin(s) allowed to call this API (CORS). Comma-separate several.
// Trailing slashes are ignored. Leave it unset to allow any origin.
const frontendOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((u) => u.trim().replace(/\/+$/, ''))
  .filter(Boolean);

module.exports = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL,
  frontendOrigins,
};
