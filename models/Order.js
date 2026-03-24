const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  order_id: String,
  payment_id: String,
  status: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", OrderSchema);
