const Offer = require('../models/Offer');
const Reservation = require('../models/Reservation');
const { toCsv } = require('../services/csv.service');

exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();
    // Comercio: solo sus ofertas. Admin: todas (ve todo).
    const filter = req.user.role === 'admin' ? {} : { commerce: req.user.sub };

    // Una sola query, ya ordenada
    const offers = await Offer.find(filter).sort({ createdAt: -1 });

    const total    = offers.length;
    const activas  = offers.filter(o => o.expirationDate && new Date(o.expirationDate) >= now).length;
    const vencidas = offers.filter(o => o.expirationDate && new Date(o.expirationDate) < now).length;

    const en3dias = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const porVencer = offers.filter(o =>
      o.expirationDate &&
      new Date(o.expirationDate) >= now &&
      new Date(o.expirationDate) <= en3dias
    ).length;

    // Las 3 más recientes ya están en el array, sin segunda query
    const recientes = offers.slice(0, 3).map(o => ({
      _id: o._id,
      title: o.title,
      expirationDate: o.expirationDate,
      category: o.category,
      price: o.price,
      image: o.image,
      createdAt: o.createdAt,
    }));

    // Reservas activas recibidas en las ofertas de este comercio
    const ids = offers.map((o) => o._id);
    const resAgg = ids.length
      ? await Reservation.aggregate([
          { $match: { status: 'activa', offer: { $in: ids } } },
          { $lookup: { from: 'offers', localField: 'offer', foreignField: '_id', as: 'o' } },
          { $unwind: '$o' },
          {
            $group: {
              _id: null,
              reservas: { $sum: 1 },
              unidades: { $sum: { $ifNull: ['$quantity', 1] } },
              valor: { $sum: { $multiply: [{ $ifNull: ['$quantity', 1] }, { $ifNull: ['$o.price', 0] }] } },
            },
          },
        ])
      : [];
    const r = resAgg[0] || { reservas: 0, unidades: 0, valor: 0 };

    res.json({
      total, activas, vencidas, porVencer, recientes,
      reservasActivas: r.reservas,
      unidadesReservadas: r.unidades,
      valorReservado: Math.round(r.valor * 100) / 100,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/commerce/reportes/reservas.csv — reservas recibidas en MIS ofertas
// (sin correos ni datos personales de quien reservó; solo un folio corto).
exports.exportReservationsCsv = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { commerce: req.user.sub };
    const ids = await Offer.find(filter).distinct('_id');

    const rows = await Reservation.find({ offer: { $in: ids } })
      .sort({ createdAt: -1 })
      .populate('offer', 'title category price')
      .lean();

    const header = ['Fecha', 'Folio', 'Oferta', 'Categoría', 'Cantidad', 'Precio unitario', 'Total', 'Estado'];
    const data = rows.map((r) => {
      const q = r.quantity || 1;
      const price = r.offer?.price ?? 0;
      return [
        new Date(r.createdAt).toISOString(),
        String(r._id).slice(-6).toUpperCase(),
        r.offer?.title || '(oferta eliminada)',
        r.offer?.category || '',
        q,
        price,
        (q * price).toFixed(2),
        r.status,
      ];
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="mis-reservas.csv"');
    res.send(toCsv(header, data));
  } catch (err) {
    next(err);
  }
};
