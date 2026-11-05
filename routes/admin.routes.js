const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

router.get('/audit-log', requireAuth, requireRole('admin'), adminController.getAuditLog);

router.get('/reportes', requireAuth, requireRole('admin'), adminController.getReports);
router.get('/reportes/reservas.csv', requireAuth, requireRole('admin'), adminController.exportReservationsCsv);

module.exports = router;
