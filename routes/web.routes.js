const router = require('express').Router();
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
// ── Rutas públicas ────────────────────────────────────────────────────────────
router.get('/', (req, res) =>
  res.render('home', { title: 'Inicio' })
);

router.get('/ofertas', (req, res) =>
  res.render('offers', { title: 'Ofertas' })
);

router.get("/ofertas/:id", requireAuth, (req, res) => {
  res.render("offer-detail", {
    title: "Detalle de oferta",
    id: req.params.id,
    user: req.user 
  });
});

router.get('/impacto-ods', (req, res) =>
  res.render('impact-ods', { title: 'Impacto ODS' })
);

router.get('/auth/login', (req, res) =>
  res.render('login', { title: 'Login' })
);

router.get('/auth/register', (req, res) =>
  res.render('register', { title: 'Registro' })
);

// ── Rutas de comercio — requieren sesión activa con rol commerce o admin ──────
router.get('/commerce',
  requireAuth, requireRole('commerce', 'admin'),
  (req, res) => res.render('commerce/dashboard', { title: 'Panel Comercio' })
);

// ── Panel de administración — solo rol admin ──────────────────────────────────
router.get('/admin',
  requireAuth, requireRole('admin'),
  (req, res) => res.render('admin/dashboard', { title: 'Panel Admin' })
);

router.get('/commerce/offers',
  requireAuth, requireRole('commerce', 'admin'),
  (req, res) => res.render('commerce/offers', { title: 'Mis Ofertas' })
);

router.get('/commerce/new-offer',
  requireAuth, requireRole('commerce', 'admin'),
  (req, res) => res.render('commerce/new-offer', {
    title: 'Nueva Oferta',
    editMode: false,
    offerId: null,
  })
);

router.get('/commerce/edit-offer/:id',
  requireAuth, requireRole('commerce', 'admin'),
  (req, res) => res.render('commerce/new-offer', {
    title: 'Editar Oferta',
    editMode: true,
    offerId: req.params.id,
  })
);

// 🔹 PANEL USUARIO
router.get('/user',
  requireAuth,
  requireRole('user'),
  (req, res) => res.render('user/dashboard', {
    title: 'Mi Panel'
  })
);

router.get('/auth/forgot-password', (req, res) => {
  res.render('forgot-password');
});

module.exports = router;

