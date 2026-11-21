const { Router } = require('express');
const asyncHandler = require('../../common/middleware/asyncHandler');
const controller = require('./movies.controller');

const router = Router();

router.post('/', asyncHandler(controller.create));
router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getById));
router.patch('/:id', asyncHandler(controller.update));
router.get('/:id/rewatch-order', asyncHandler(controller.rewatchOrder));

module.exports = router;
