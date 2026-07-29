const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema(
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer",
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ["activa", "cancelada"],
    default: "activa"
  }
},
{
  timestamps: true
});

module.exports = mongoose.model("Reservation", ReservationSchema);