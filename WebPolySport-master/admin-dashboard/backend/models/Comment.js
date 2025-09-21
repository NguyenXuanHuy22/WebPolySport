const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },

    avatar: { type: String },
    username: { type: String, required: true },
    ratingStar: { type: Number, min: 1, max: 5, required: true },
    commentDes: { type: String, required: true },
  },
  { timestamps: true }
);

// Mỗi user chỉ có thể đánh giá 1 sản phẩm trong 1 đơn duy nhất
commentSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model("Comment", commentSchema);
