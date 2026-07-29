const mongoose = require('mongoose');

const commerceSchema = new mongoose.Schema(
  {
    // Referencia al usuario con role:'commerce'
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    category: {
      type: String,
      enum: ['Panadería', 'Frutas', 'Comida', 'Bebidas', 'Lácteos', 'Verduras', 'Otro'],
      default: 'Otro',
    },

    address: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Commerce', commerceSchema);
