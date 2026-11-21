const { port } = require('./config/env');
const app = require('./app');

// Log stray errors instead of letting the whole API die
// (for example a database connection that Neon closed while it was idle).
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));

app.listen(port, () => console.log(`Doomsday Ready API listening on http://localhost:${port}/api`));
