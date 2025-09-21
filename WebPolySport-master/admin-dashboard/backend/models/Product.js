const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  originalPrice: { type: Number, required: true }, // giá gốc (bắt buộc)
  salePrice: { type: Number, default: null },      // giá giảm (null nếu không có)
  description: String,
  image: String,
  extraImages: [{ type: String }],
  status: String,
  variants: [
    {
      size: String,
      color: String,
      quantity: Number
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
