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

    // 4. Evitar duplicados
    const existing = await Reservation.findOne({
      user: userId,
      offer: offerId,
      status: "activa",
    });
    if (existing) {
      return res.status(400).json({ message: "Ya reservaste esta oferta" });
    }

    // 5. Validar stock
    if (!offer.quantity || offer.quantity <= 0) {
      return res.status(400).json({ message: "No hay stock disponible" });
    }

    // 6. Crear reserva
    const reservation = await Reservation.create({ user: userId, offer: offerId });

    // 7. Reducir stock
    offer.quantity -= 1;
    await offer.save();

    await logEvent('reservation.create', req, { detail: { offerId, reservationId: reservation._id } });

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