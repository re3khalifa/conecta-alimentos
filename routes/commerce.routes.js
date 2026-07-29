const router = require('express').Router();
const commerceController = require('../controllers/commerce.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

// GET /api/commerce/stats — estadísticas del comercio autenticado
router.get('/stats',
  requireAuth,
  requireRole('commerce', 'admin'),
  commerceController.getStats
);

module.exports = router;
