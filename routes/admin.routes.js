const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

router.get('/audit-log', requireAuth, requireRole('admin'), adminController.getAuditLog);

module.exports = router;
