const router = require('express').Router();
const imageController = require('../controllers/image.controller');

router.get('/:id', imageController.getImage);

module.exports = router;
