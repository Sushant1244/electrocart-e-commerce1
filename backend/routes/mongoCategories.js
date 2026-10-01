const express = require('express');
const controller = require('../controllers/mongoCategoryController');
const { mongoAuth, mongoAdmin } = require('../middleware/mongoAuth');
const router = express.Router();
router.get('/', controller.list);
router.post('/', mongoAuth, mongoAdmin, controller.create);
router.patch('/:id', mongoAuth, mongoAdmin, controller.update);
router.delete('/:id', mongoAuth, mongoAdmin, controller.remove);
module.exports = router;
