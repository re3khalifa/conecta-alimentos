const { body } = require('express-validator');

// Validación para registro
const registerValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),

  body('password')
  .notEmpty()
  .withMessage('La contraseña es obligatoria')
  .isLength({ min: 8 })
  .withMessage('La contraseña debe tener mínimo 8 caracteres')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
  .withMessage(
    'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
  ),

  body('role')
  .optional()
  .isIn(['user', 'commerce'])
  .withMessage('Rol inválido'),
];

// Validación para login
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),
];

module.exports = {
  registerValidation,
  loginValidation,
};