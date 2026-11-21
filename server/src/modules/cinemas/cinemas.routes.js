const { Router } = require('express');
const asyncHandler = require('../../common/middleware/asyncHandler');
const controller = require('./cinemas.controller');

const router = Router();

router.post('/', asyncHandler(controller.create));
router.get('/', asyncHandler(controller.list));
router.get('/:id/booking', asyncHandler(controller.booking));

module.exports = router;
