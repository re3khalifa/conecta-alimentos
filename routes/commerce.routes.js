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

// GET /api/commerce/reportes/reservas.csv — reporte propio descargable
router.get('/reportes/reservas.csv',
  requireAuth,
  requireRole('commerce', 'admin'),
  commerceController.exportReservationsCsv
);

module.exports = router;
