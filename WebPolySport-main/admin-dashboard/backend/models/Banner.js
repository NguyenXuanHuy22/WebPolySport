const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    image: { type: String, required: true } // Đường dẫn ảnh đã upload
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
