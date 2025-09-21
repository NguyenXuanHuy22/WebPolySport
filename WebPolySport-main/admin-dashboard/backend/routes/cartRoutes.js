const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Cart = require("../models/Cart");

// Tạo giỏ hàng mới
router.post("/", async (req, res) => {
  try {
    const { userId } = req.body;

    const existingCart = await Cart.findOne({ userId });
    if (existingCart) {
      return res.status(200).json(existingCart);
    }

    const newCart = new Cart({ userId, items: [] });
    await newCart.save();

    res.status(201).json(newCart);
  } catch (err) {
    console.error("❌ Lỗi tạo giỏ hàng:", err);
    res.status(500).json({ message: "Lỗi khi tạo giỏ hàng", error: err.message });
  }
});

// Lấy giỏ hàng
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
    }

    const itemsWithIds = cart.items.map((item) => ({
      itemId: String(item._id), // ✅ ID duy nhất của item
      productId: item.productId,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      userId: cart.userId,
    }));

    res.json({
      _id: String(cart._id),
      userId: cart.userId,
      items: itemsWithIds,
    });
  } catch (err) {
    console.error("❌ Lỗi lấy giỏ hàng:", err);
    res.status(500).json({ message: "Lỗi khi lấy giỏ hàng", error: err.message });
  }
});


// Cập nhật toàn bộ giỏ hàng
router.patch("/:cartId", async (req, res) => {
  try {
    const { cartId } = req.params;
    const updatedCart = await Cart.findByIdAndUpdate(cartId, req.body, { new: true });
    if (!updatedCart) {
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng để cập nhật" });
    }
    res.json(updatedCart);
  } catch (err) {
    console.error("❌ Lỗi cập nhật giỏ hàng:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật giỏ hàng", error: err.message });
  }
});

// Thêm sản phẩm vào giỏ
router.post("/:cartId/items", async (req, res) => {
  try {
    const { cartId } = req.params;
    const cart = await Cart.findById(cartId);
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const { productId, size, color, quantity, name, image, price } = req.body;

    const existingIndex = cart.items.findIndex(
      (item) =>
        item.productId === productId &&
        item.size === size &&
        item.color === color
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      const newItem = {
        _id: new mongoose.Types.ObjectId(), // ✅ BẮT BUỘC gán _id mới
        productId,
        name,
        image,
        price,
        quantity,
        size,
        color,
        userId: cart.userId,
      };
      console.log("✅ Thêm sản phẩm mới:", newItem);
      cart.items.push(newItem);
    }

    const updated = await cart.save();

    const itemsWithIds = updated.items.map((item) => ({
      itemId: String(item._id),
      productId: item.productId,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      userId: cart.userId,
    }));

    res.json({
      _id: String(cart._id),
      userId: cart.userId,
      items: itemsWithIds,
    });
  } catch (err) {
    console.error("❌ Lỗi thêm sản phẩm:", err);
    res.status(500).json({ message: "Lỗi khi thêm sản phẩm", error: err.message });
  }
});

// Xóa 1 sản phẩm khỏi giỏ hàng theo itemId
router.delete("/:cartId/items/:itemId", async (req, res) => {
  try {
    const { cartId, itemId } = req.params;

    const cart = await Cart.findById(cartId);
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // Lọc bỏ sản phẩm có _id trùng với itemId
    cart.items = cart.items.filter(
      (item) => String(item._id) !== String(itemId)
    );

    await cart.save();

    const itemsWithIds = cart.items.map((item) => ({
      itemId: String(item._id),
      productId: item.productId,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      userId: cart.userId,
    }));

    res.json({
      _id: String(cart._id),
      userId: cart.userId,
      items: itemsWithIds,
    });
  } catch (err) {
    console.error("❌ Lỗi xóa sản phẩm:", err);
    res.status(500).json({ message: "Lỗi khi xóa sản phẩm", error: err.message });
  }
});

// Cập nhật số lượng sản phẩm
router.patch("/:cartId/items/:productId", async (req, res) => {
  try {
    const { cartId, productId } = req.params;
    const { quantity } = req.body;
    const cart = await Cart.findById(cartId);
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((item) => item.productId === productId);
    if (!item) return res.status(404).json({ message: "Item not found in cart" });

    item.quantity = quantity;
    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error("❌ Lỗi cập nhật số lượng:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật số lượng", error: err.message });
  }
});

module.exports = router;
