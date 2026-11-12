const mongoose = require('mongoose');

// Foto de una oferta guardada dentro de MongoDB. El disco de Render es
// efímero (se borra en cada deploy), la base de datos no.
const ImageSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Image', ImageSchema);
