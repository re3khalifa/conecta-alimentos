const Offer = require('../models/Offer');

exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const comercioId = req.user.sub;

    // Una sola query, ya ordenada
    const offers = await Offer.find({ commerce: comercioId }).sort({ createdAt: -1 });

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

    res.json({ total, activas, vencidas, porVencer, recientes });
  } catch (err) {
    next(err);
  }
};