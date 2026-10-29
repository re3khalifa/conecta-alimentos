const router = require('express').Router();
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const impactController = require('../controllers/impact.controller');

// Admin: toda la plataforma. Comercio: solo lo suyo. Usuario: sin acceso (403).
router.get('/', requireAuth, requireRole('commerce', 'admin'), impactController.getImpact);

module.exports = router;
