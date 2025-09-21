const express = require("express");
const mongoose = require("mongoose");
const Comment = require("../models/Comment.js");
const Order = require("../models/Order.js");
const User = require("../models/User.js");

const router = express.Router();

/**
 * POST /api/comments
 * Body: { userId, productId, orderId, ratingStar, commentDes }
 */
router.post("/", async (req, res) => {
  try {
    console.log("POST /api/comments - req.body:", req.body);
    const { userId, productId, orderId, ratingStar, commentDes } = req.body;

    // validation cơ bản
    const rating = parseInt(ratingStar, 10);
    if (!userId || !productId || !orderId || isNaN(rating) || rating < 1 || rating > 5 || !commentDes) {
      return res.status(400).json({
        message: "Thiếu hoặc sai dữ liệu (userId, productId, orderId, ratingStar[1..5], commentDes)!",
      });
    }

    // kiểm tra orderId & productId có phải ObjectId hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "orderId/userId/productId không hợp lệ (ObjectId sai)!" });
    }

    const deliveredStatuses = ["Đã giao", "Delivered", "delivered"];

    // tìm order và bắt buộc items.productId match ObjectId
    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: deliveredStatuses },
      "items.productId": new mongoose.Types.ObjectId(productId),
    });

    console.log("Found order for review check:", !!order, order ? order._id : null);

    if (!order) {
      return res.status(400).json({ message: "Không tìm thấy đơn hàng đã giao chứa sản phẩm này!" });
    }

    // chặn đánh giá trùng trong cùng 1 đơn
    const existed = await Comment.findOne({ userId: new mongoose.Types.ObjectId(userId), productId: new mongoose.Types.ObjectId(productId), orderId: new mongoose.Types.ObjectId(orderId) }).lean();
    if (existed) {
      return res.status(409).json({ message: "Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi!" });
    }

    // lấy user (để lưu avatar, username)
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "Không tìm thấy user!" });

    // tạo comment
    const newComment = await Comment.create({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
      orderId: new mongoose.Types.ObjectId(orderId),
      avatar: user.avatar ?? "",
      username: user.name ?? "Người dùng",
      ratingStar: rating,
      commentDes,
      createdAt: new Date(),
    });

    // cập nhật item.isReviewed trong order: xử lý an toàn với subdocs
    // tìm đúng item(s) và gán isReviewed = true
    let anyItemUpdated = false;
    for (let item of order.items) {
      // nếu productId là object
      if (item.productId && item.productId.toString() === productId.toString()) {
        item.isReviewed = true;
        anyItemUpdated = true;
      }
    }

    // nếu tất cả item đã reviewed => gắn order.isReviewed = true
    const allReviewed = order.items.every((it) => it.isReviewed === true);
    if (allReviewed) {
      order.isReviewed = true;
    }

    // save nếu có thay đổi trên order
    if (anyItemUpdated || order.isReviewed) {
      await order.save();
      console.log("Order updated with reviewed flags:", order._id);
    }

    console.log("Created comment:", newComment._id);
    return res.status(201).json(newComment);
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  }
});

/**
 * GET /api/comments/:productId
 * Lấy danh sách comment theo productId
 */
router.get("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const comments = await Comment.find({ productId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(comments);
  } catch (error) {
    console.error("GET /api/comments/:productId error:", error);
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  }
});

/**
 * PUT /api/orders/:id/review
 * Đánh dấu toàn bộ order là đã review
 */
router.put("/:id/review", async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.isReviewed = true;

    // cũng có thể đánh dấu tất cả item trong order là đã review luôn
    order.items = order.items.map((item) => ({
      ...item.toObject(),
      isReviewed: true,
    }));

    await order.save();
    res.json(order);
  } catch (err) {
    console.error("PUT /api/orders/:id/review error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/orders/:id/review/:productId
 * Đánh dấu 1 item trong order là đã review
 */
router.put("/:id/review/:productId", async (req, res) => {
  try {
    const { id, productId } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.items = order.items.map((item) =>
      item.productId.toString() === productId
        ? { ...item.toObject(), isReviewed: true }
        : item
    );

    // nếu tất cả item đều đã review thì set luôn order.isReviewed = true
    const allReviewed = order.items.every((item) => item.isReviewed === true);
    if (allReviewed) {
      order.isReviewed = true;
    }

    await order.save();
    res.json(order);
  } catch (err) {
    console.error("PUT /api/orders/:id/review/:productId error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
