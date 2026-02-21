const mongoose = require('mongoose');

// 房型模型
const roomSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  bedType: {
    type: String,
    default: '大床/双床'
  },
  capacity: {
    type: Number,
    default: 2
  },
  stock: {
    type: Number,
    default: 10
  },
  images: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

roomSchema.index({ hotelId: 1 });

module.exports = mongoose.model('Room', roomSchema);
