const { Router } = require('express');

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/movies', require('./modules/movies/movies.routes'));
router.use('/cinemas', require('./modules/cinemas/cinemas.routes'));

module.exports = router;
