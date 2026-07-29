const mongoose = require('mongoose')

const OfferSchema = new mongoose.Schema(
{
    title: { type: String, required: true },
    description: String,
    category: String,
    price: Number,
    quantity: Number,
    expirationDate: Date,
    address: String,
    image: { type: String, default: null },
    location: {
        lat: Number,
        lng: Number
    },
    commerce: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: false
}
},
{
    timestamps: true
})

module.exports = mongoose.model('Offer', OfferSchema)