const express = require('express');
const controller = require('../controllers/mongoOrderController');
const { mongoAuth } = require('../middleware/mongoAuth');
const router = express.Router();
router.use(mongoAuth);
router.get('/', controller.list);
router.post('/', controller.create);
module.exports = router;
