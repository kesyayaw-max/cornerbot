const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: Date, required: true }, // waktu event berlangsung
  location: { type: String, default: '' }, // nama channel / tempat (opsional)
  image: { type: String, default: '' }, // url banner (opsional)
  createdBy: { type: String, default: null }, // userId pembuat
  createdByName: { type: String, default: 'Admin' },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
