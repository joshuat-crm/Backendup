// models/PlotResell.js

const mongoose = require('mongoose');

const plotResellSchema = new mongoose.Schema({
  plot_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plot',
    required: true
  },
  previous_customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  new_customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  resell_fee: {
    type: Number,
    default: 0
  },
  resell_date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: 'Plot resold to a new owner'
  }
});

module.exports = mongoose.model('PlotResell', plotResellSchema);
