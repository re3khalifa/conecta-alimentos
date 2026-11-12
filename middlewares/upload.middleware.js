const multer = require('multer');

const ALLOWED_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// La foto se queda en memoria y de ahí se guarda en MongoDB (ver image.service.js).
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME[file.mimetype]) {
    return cb(new Error('Formato de imagen no permitido. Usa JPG, PNG o WEBP.'));
  }
  cb(null, true);
}

const uploadOfferImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB, una sola foto
});

// El tipo MIME lo manda el cliente y se puede falsificar: se revisan los
// primeros bytes del archivo ("firma") para confirmar que de verdad es imagen.
function detectImageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

function validateImageContent(req, res, next) {
  if (!req.file) return next();
  const real = detectImageType(req.file.buffer);
  if (!real) {
    return res.status(400).json({ message: 'El archivo no es una imagen válida (JPG, PNG o WEBP).' });
  }
  req.file.mimetype = real;
  next();
}

module.exports = { uploadOfferImage, validateImageContent };
