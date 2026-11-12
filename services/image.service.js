const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Image = require('../models/Image');

const IMAGE_URL_PREFIX = '/api/imagenes/';
const LEGACY_DIR = path.join(__dirname, '..', 'public', 'uploads', 'offers');

/** Guarda la foto (req.file) en MongoDB y regresa la URL pública para Offer.image. */
async function saveImage(file, ownerId) {
  const doc = await Image.create({
    data: file.buffer,
    contentType: file.mimetype,
    size: file.size,
    owner: ownerId,
  });
  return `${IMAGE_URL_PREFIX}${doc._id}`;
}

/** Borra la foto a la que apunta una URL: la nueva (MongoDB) o la vieja (archivo en disco). */
async function deleteImageByUrl(url) {
  if (!url) return;
  try {
    if (url.startsWith(IMAGE_URL_PREFIX)) {
      const id = url.slice(IMAGE_URL_PREFIX.length);
      if (mongoose.Types.ObjectId.isValid(id)) await Image.findByIdAndDelete(id);
      return;
    }
    // Ofertas anteriores a este cambio: la foto estaba en public/uploads/offers/
    const filePath = path.join(LEGACY_DIR, path.basename(url));
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') console.error('No se pudo borrar la imagen anterior:', err.message);
    });
  } catch (err) {
    console.error('No se pudo borrar la imagen:', err.message);
  }
}

module.exports = { saveImage, deleteImageByUrl, IMAGE_URL_PREFIX };
