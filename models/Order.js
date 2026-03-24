const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  payment_id: String,
  date: {type: Date, default: Date.now}
});

module.exports = mongoose.model("Order", schema);