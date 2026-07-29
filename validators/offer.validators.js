const { body } = require('express-validator');

// Validación para crear/editar ofertas
const offerValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('El título es obligatorio'),

  body('category')
    .optional({ checkFalsy: true })
    .isIn(['Panadería', 'Frutas', 'Comida', 'Bebidas', 'Lácteos', 'Verduras', 'Otro'])
    .withMessage('Categoría inválida'),

  body('price')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0'),

  body('quantity')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('La cantidad debe ser un entero mayor o igual a 0'),

  body('expirationDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Fecha de caducidad inválida'),

  body('lat')
    .optional({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 }).withMessage('Latitud inválida'),

  body('lng')
    .optional({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 }).withMessage('Longitud inválida'),
];

module.exports = { offerValidation };
