const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { registerValidation, loginValidation } = require('../validators/auth.validators');
const validate = require('../middlewares/validate.middleware');

// POST /api/auth/register
router.post('/register', registerValidation, validate, authController.register);

// POST /api/auth/login
router.post('/login', loginValidation, validate, authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

module.exports = router;
