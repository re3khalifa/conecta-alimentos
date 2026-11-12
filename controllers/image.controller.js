const mongoose = require('mongoose');
const Image = require('../models/Image');

// GET /api/imagenes/:id — pública (las ofertas se ven sin iniciar sesión).
exports.getImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).end();

    const img = await Image.findById(id).select('data contentType');
    if (!img) return res.status(404).end();

    res.set({
      'Content-Type': img.contentType,
      // El id nunca cambia de contenido: una foto nueva trae un id nuevo.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': 'inline',
    });
    res.send(img.data);
  } catch (err) {
    next(err);
  }
};
