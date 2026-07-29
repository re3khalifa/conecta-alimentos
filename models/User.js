const mongoose = require('mongoose');

const ALLOWED_ROLES = ['user', 'commerce', 'admin'];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },

    // Contraseña cifrada (hash)
    passwordHash: {
      type: String,
      required: true,
      minlength: 20, // hash bcrypt normalmente es largo
    },

    role: {
      type: String,
      enum: ALLOWED_ROLES,
      default: 'user',
    },

    privacyAccepted: {
    type: Boolean,
    default: false
    },

    privacyAcceptedAt: {
    type: Date
    },

    // Para control (opcional pero útil)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // createdAt y updatedAt
    versionKey: false,
  }
);

// (el índice único de email ya lo crea "unique: true" arriba; no hace
// falta declararlo otra vez con schema.index(), eso generaba un warning
// de Mongoose por índice duplicado)

module.exports = mongoose.model('User', userSchema);