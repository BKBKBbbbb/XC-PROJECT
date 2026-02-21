const mongoose = require('mongoose');

// 酒店模型
const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameEn: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  star: {
    type: Number,
    enum: [1, 2, 3, 4, 5],
    default: 3
  },
  facilities: [{
    type: String
  }],
  images: [{
    type: String
  }],
  description: {
    type: String,
    default: ''
  },
  openDate: {
    type: Date
  },
  rating: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'published', 'offline'],
    default: 'draft'
  },
  reviewNote: {
    type: String,
    default: ''
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 索引
hotelSchema.index({ city: 1, star: 1 });
hotelSchema.index({ status: 1 });

module.exports = mongoose.model('Hotel', hotelSchema);
