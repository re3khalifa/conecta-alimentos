const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Offer = require('../models/Offer');
const Reservation = require('../models/Reservation');
const { toCsv } = require('../services/csv.service');

// GET /api/admin/audit-log
exports.getAuditLog = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json(logs);
  } catch (err) {
    next(err);
  }
};


// GET /api/admin/reportes — resumen para el administrador
exports.getReports = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const qty = { $ifNull: ['$quantity', 1] };

    const [usuarios, reservas, topOfertas, eventos, totalOfertas] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', total: { $sum: 1 } } }]),
      Reservation.aggregate([{ $group: { _id: '$status', reservas: { $sum: 1 }, unidades: { $sum: qty } } }]),
      Reservation.aggregate([
        { $match: { status: 'activa' } },
        { $group: { _id: '$offer', reservas: { $sum: 1 }, unidades: { $sum: qty } } },
        { $sort: { unidades: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'offers', localField: '_id', foreignField: '_id', as: 'o' } },
        { $unwind: { path: '$o', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, titulo: { $ifNull: ['$o.title', '(oferta eliminada)'] }, categoria: '$o.category', reservas: 1, unidades: 1 } },
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$event', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Offer.countDocuments(),
    ]);

    res.json({
      usuariosPorRol: usuarios.map((u) => ({ rol: u._id, total: u.total })),
      reservasPorEstado: reservas.map((r) => ({ estado: r._id, reservas: r.reservas, unidades: r.unidades })),
      topOfertas,
      eventosUltimos7dias: eventos.map((e) => ({ evento: e._id, total: e.total })),
      totalOfertas,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/reportes/reservas.csv — descarga de todas las reservas
exports.exportReservationsCsv = async (req, res, next) => {
  try {
    const rows = await Reservation.find()
      .sort({ createdAt: -1 })
      .populate('user', 'email')
      .populate('offer', 'title category price')
      .lean();

    const header = ['Fecha', 'Correo', 'Oferta', 'Categoría', 'Cantidad', 'Precio unitario', 'Total', 'Estado'];
    const data = rows.map((r) => {
      const q = r.quantity || 1;
      const price = r.offer?.price ?? 0;
      return [
        new Date(r.createdAt).toISOString(),
        r.user?.email || '',
        r.offer?.title || '(oferta eliminada)',
        r.offer?.category || '',
        q,
        price,
        (q * price).toFixed(2),
        r.status,
      ];
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reservas.csv"');
    res.send(toCsv(header, data));
  } catch (err) {
    next(err);
  }
};
