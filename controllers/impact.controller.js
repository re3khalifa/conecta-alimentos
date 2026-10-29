const mongoose = require('mongoose');
const Offer = require('../models/Offer');
const Reservation = require('../models/Reservation');

const TZ = 'America/Monterrey';
const DAY = 24 * 60 * 60 * 1000;

// GET /api/impacto  (requiere sesión de comercio o admin)
//  - admin    -> cifras de TODA la plataforma  (alcance: "global")
//  - comercio -> cifras de SUS propias ofertas  (alcance: "propio")
// Los usuarios normales no tienen acceso (lo bloquea requireRole en la ruta).
exports.getImpact = async (req, res, next) => {
  try {
    const now = new Date();
    const since = new Date(now.getTime() - 13 * DAY);
    const isAdmin = req.user.role === 'admin';

    const offerFilter = isAdmin ? {} : { commerce: new mongoose.Types.ObjectId(req.user.sub) };
    const offerIds = isAdmin ? null : await Offer.find(offerFilter).distinct('_id');
    const resMatch = isAdmin ? {} : { offer: { $in: offerIds } };

    const qtyExpr = { $ifNull: ['$quantity', 1] };

    const [offerAgg, comercios, resByStatus, porCategoria, porDia] = await Promise.all([
      Offer.aggregate([
        { $match: offerFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            activas: {
              $sum: { $cond: [{ $and: [{ $gte: ['$expirationDate', now] }, { $gt: ['$quantity', 0] }] }, 1, 0] },
            },
          },
        },
      ]),
      Offer.distinct('commerce', offerFilter),
      Reservation.aggregate([
        { $match: resMatch },
        { $group: { _id: '$status', reservas: { $sum: 1 }, unidades: { $sum: qtyExpr } } },
      ]),
      Reservation.aggregate([
        { $match: { ...resMatch, status: 'activa' } },
        { $lookup: { from: 'offers', localField: 'offer', foreignField: '_id', as: 'o' } },
        { $unwind: '$o' },
        {
          $group: {
            _id: { $ifNull: ['$o.category', 'Otro'] },
            reservas: { $sum: 1 },
            unidades: { $sum: qtyExpr },
            valor: { $sum: { $multiply: [qtyExpr, { $ifNull: ['$o.price', 0] }] } },
          },
        },
        { $sort: { unidades: -1 } },
      ]),
      Reservation.aggregate([
        { $match: { ...resMatch, status: 'activa', createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } },
            reservas: { $sum: 1 },
            unidades: { $sum: qtyExpr },
          },
        },
      ]),
    ]);

    const ofertas = offerAgg[0] || { total: 0, activas: 0 };
    const activa = resByStatus.find((r) => r._id === 'activa') || { reservas: 0, unidades: 0 };
    const cancelada = resByStatus.find((r) => r._id === 'cancelada') || { reservas: 0 };

    // Rellenar los 14 días (también los sin reservas) para que la gráfica no tenga huecos
    const map = new Map(porDia.map((d) => [d._id, d]));
    const ultimos14dias = [];
    for (let i = 13; i >= 0; i--) {
      const fecha = new Date(now.getTime() - i * DAY).toLocaleDateString('en-CA', { timeZone: TZ });
      const d = map.get(fecha);
      ultimos14dias.push({ fecha, reservas: d ? d.reservas : 0, unidades: d ? d.unidades : 0 });
    }

    res.json({
      alcance: isAdmin ? 'global' : 'propio',
      ofertas: { total: ofertas.total, activas: ofertas.activas },
      comercios: comercios.filter(Boolean).length,
      reservas: { activas: activa.reservas, canceladas: cancelada.reservas },
      unidadesRescatadas: activa.unidades,
      valorReservado: Math.round(porCategoria.reduce((s, c) => s + c.valor, 0) * 100) / 100,
      porCategoria: porCategoria.map((c) => ({
        categoria: c._id,
        reservas: c.reservas,
        unidades: c.unidades,
        valor: Math.round(c.valor * 100) / 100,
      })),
      ultimos14dias,
    });
  } catch (err) {
    next(err);
  }
};
