const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Offer = require("../models/Offer");
const { logEvent } = require('../services/audit.service');

exports.createReservation = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const userId = req.user.sub;

    // 1. Validar formato de ID
    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(400).json({ message: "ID de oferta inválido" });
    }

    // 2. Verificar que existe la oferta
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: "Oferta no encontrada" });
    }

    // 3. Verificar que la oferta no esté vencida
    if (offer.expirationDate && new Date(offer.expirationDate) < new Date()) {
      return res.status(400).json({ message: "Esta oferta ya venció" });
    }

    // 4. Cantidad pedida (entero >= 1; por defecto 1 para clientes viejos)
    const rawQty = req.body && req.body.quantity !== undefined ? req.body.quantity : 1;
    const qty = Number(rawQty);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: "La cantidad debe ser un número entero mayor o igual a 1" });
    }

    // 5. Evitar duplicados
    const existing = await Reservation.findOne({
      user: userId,
      offer: offerId,
      status: "activa",
    });
    if (existing) {
      return res.status(400).json({ message: "Ya reservaste esta oferta" });
    }

    // 6. Validar stock
    if (!offer.quantity || offer.quantity <= 0) {
      return res.status(400).json({ message: "No hay stock disponible" });
    }
    if (qty > offer.quantity) {
      return res.status(400).json({ message: `Solo quedan ${offer.quantity} disponibles` });
    }

    // 7. Descontar stock de forma atómica: si otra persona reservó al mismo
    //    tiempo y ya no alcanza, el filtro quantity >= qty no coincide.
    const updated = await Offer.findOneAndUpdate(
      { _id: offerId, quantity: { $gte: qty } },
      { $inc: { quantity: -qty } },
      { new: true }
    );
    if (!updated) {
      return res.status(400).json({ message: "Ya no hay suficientes unidades disponibles" });
    }

    // 8. Crear reserva
    const reservation = await Reservation.create({ user: userId, offer: offerId, quantity: qty });

    await logEvent('reservation.create', req, { detail: { offerId, reservationId: reservation._id, quantity: qty } });

    res.status(201).json(reservation);
  } catch (err) {
    next(err);
  }
};

exports.getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ user: req.user.sub })
      .populate("offer")
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (err) {
    next(err);
  }
};

exports.cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de reserva inválido" });
    }

    // Solo la persona dueña de la reserva puede cancelarla, y solo si sigue activa.
    // El filtro por status evita devolver el stock dos veces si llegan dos peticiones.
    const reservation = await Reservation.findOneAndUpdate(
      { _id: id, user: userId, status: "activa" },
      { status: "cancelada" },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ message: "Reserva no encontrada o ya cancelada" });
    }

    // Devolver las unidades a la oferta (si la oferta ya no existe, no pasa nada)
    await Offer.findByIdAndUpdate(reservation.offer, { $inc: { quantity: reservation.quantity || 1 } });

    await logEvent('reservation.cancel', req, {
      detail: { reservationId: reservation._id, offerId: reservation.offer, quantity: reservation.quantity || 1 },
    });

    res.json(reservation);
  } catch (err) {
    next(err);
  }
};
