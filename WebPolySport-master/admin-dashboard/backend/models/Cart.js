const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  productId: String,
  name: String,
  image: String,
  price: Number,
  quantity: Number,
  size: String,
  color: String,
  userId: String
}, { _id: true }); 

const CartSchema = new mongoose.Schema({
  userId: String,
  items: [CartItemSchema]
});

module.exports = mongoose.model("Cart", CartSchema);
