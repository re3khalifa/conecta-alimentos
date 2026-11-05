const router = require("express").Router();
const requireAuth = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");
const reservationController = require("../controllers/reservation.controller");

// Crear reserva (solo users)
router.post(
  "/:offerId",
  requireAuth,
  requireRole("user"),
  reservationController.createReservation
);

// Mis reservas
router.get(
  "/mine",
  requireAuth,
  requireRole("user"),
  reservationController.getMyReservations
);

// Cancelar una reserva propia (devuelve el stock). POST y no PATCH para que
// también funcione desde la app móvil (HttpsURLConnection no soporta PATCH).
router.post(
  "/:id/cancel",
  requireAuth,
  requireRole("user"),
  reservationController.cancelReservation
);

module.exports = router;
