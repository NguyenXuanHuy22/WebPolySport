const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Đồng bộ với Cart: String
      required: true,
    },
    items: [
      {
        productId: String,
        name: String,
        image: String,
        price: Number,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wishlist', wishlistSchema);
