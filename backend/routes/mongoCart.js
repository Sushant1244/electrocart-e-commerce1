const express = require('express');
const controller = require('../controllers/mongoCartController');
const { mongoAuth } = require('../middleware/mongoAuth');
const router = express.Router();
router.use(mongoAuth);
router.get('/', controller.get);
router.put('/', controller.replace);
module.exports = router;
