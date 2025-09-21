const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isValidObjectId } = mongoose;
const { v4: uuidv4 } = require('uuid');

const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Address = require('../models/Address');
const User = require('../models/User');

// ----------------- Helpers -----------------
const oid = (id) => isValidObjectId(id);

const buildItemsWithSubtotal = (items = []) =>
  items.map(it => ({
    orderDetailId: it.orderDetailId || uuidv4(),
    productId: it.productId,
    name: it.name,
    image: it.image,
    price: Number(it.price || 0),
    quantity: Number(it.quantity || 1),
    size: it.size || '',
    color: it.color || '',
    subtotal: Number(it.price || 0) * Number(it.quantity || 0),
    date: it.date ? new Date(it.date) : new Date(),
    paymentMethod: it.paymentMethod || ''
  }));

router.post('/', async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const {
      userId,
      items,
      paymentMethod,
      status,
      addressId,
      customerName,
      customerPhone,
      customerAddress,
      date,
      orderNote
    } = req.body;

    console.log("📥 Received body:", req.body);
    console.log("📝 Received orderNote:", orderNote);

    // Validate cơ bản
    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Thiếu userId hoặc items' });
    }
    if (!paymentMethod) return res.status(400).json({ message: 'Thiếu phương thức thanh toán' });

    // Lấy địa chỉ giao hàng
    let addr = { name: customerName, phone: customerPhone, address: customerAddress };
    if (!addr.name || !addr.phone || !addr.address) {
      const user = await User.findById(userId);
      if (!user) return res.status(400).json({ message: 'Không tìm thấy user' });
      addr = { name: user.name || 'Khách hàng', phone: user.phone || '', address: user.address || '' };
    }

    // Tính subtotal cho items
    const itemsWithSubtotal = buildItemsWithSubtotal(items);

    // Chuẩn bị ghi chú
    const notesArr = [];
    if (orderNote && orderNote.trim() !== '') {
      notesArr.push({
        type: 'user',
        message: orderNote.trim(),
        date: new Date()
      });
    }

    await session.withTransaction(async () => {
      const grandTotal = itemsWithSubtotal.reduce((sum, it) => sum + it.subtotal, 0);

      // ✅ TRỪ TỒN KHO TRƯỚC KHI TẠO ĐƠN HÀNG
      // 🔥 Trừ tồn kho theo variants
      for (const item of itemsWithSubtotal) {
        const product = await Product.findById(item.productId).session(session);
        if (!product) {
          throw new Error(`Không tìm thấy sản phẩm với id ${item.productId}`);
        }

        console.log(`🔄 Đang trừ sản phẩm ${item.productId} (${product.name})`);

        if (product.variants && product.variants.length > 0) {
          // ✅ Tìm đúng variant theo size & color
          const variantIndex = product.variants.findIndex(
            v => v.size === item.size && v.color === item.color
          );

          if (variantIndex === -1) {
            throw new Error(`Không tìm thấy biến thể (size: ${item.size}, color: ${item.color}) cho sản phẩm ${product.name}`);
          }

          const variant = product.variants[variantIndex];
          console.log(`🔍 Variant hiện có: ${variant.quantity}, SL đặt: ${item.quantity}`);

          if (variant.quantity < item.quantity) {
            throw new Error(`Sản phẩm ${product.name} (${variant.size}/${variant.color}) không đủ tồn kho (còn ${variant.quantity})`);
          }

          // ✅ Trừ số lượng biến thể
          product.variants[variantIndex].quantity -= item.quantity;
        } else {
          // ✅ Trường hợp không có variants => dùng quantity tổng
          if (product.quantity < item.quantity) {
            throw new Error(`Sản phẩm ${product.name} không đủ tồn kho (còn ${product.quantity})`);
          }
          product.quantity -= item.quantity;
        }

        await product.save({ session });
        console.log(`✅ Đã trừ tồn kho thành công cho ${product.name}`);
      }

      // ✅ Tạo đơn hàng
      const [newOrder] = await Order.create(
        [{
          userId,
          items: itemsWithSubtotal,
          total: grandTotal,
          customerName: addr.name,
          customerPhone: addr.phone,
          customerAddress: addr.address,
          paymentMethod,
          status: status || 'Chờ xác nhận',
          date: date ? new Date(date) : new Date(),
          notes: notesArr
        }],
        { session }
      );
      //  Xóa các sản phẩm đã mua khỏi giỏ hàng, giữ lại phần còn lại
      const cart = await Cart.findOne({ userId }).session(session);

      if (cart) {
        cart.items = cart.items.filter(cartItem => {
          // Giữ lại những item KHÔNG nằm trong danh sách mua
          return !itemsWithSubtotal.some(orderItem =>
            orderItem.productId.toString() === cartItem.productId.toString() &&
            orderItem.size === cartItem.size &&
            orderItem.color === cartItem.color
          );
        });

        await cart.save({ session });
      }
        console.log("🎉 Created order:", newOrder);
        res.status(201).json(newOrder);
      });

  } catch (err) {
    console.error('❌ Lỗi tạo đơn hàng:', err);
    res.status(500).json({ message: 'Lỗi tạo đơn hàng', error: err.message });
  } finally {
    session.endSession();
  }
});


// ----------------- Xem chi tiết (GET /api/orders/:id/detail) -----------------
router.get('/:id/detail', async (req, res) => {
  try {
    const { id } = req.params;
    if (!oid(id)) return res.status(400).json({ message: 'orderId không hợp lệ' });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy order' });

    res.json({
      _id: order._id,  
      userId: order.userId,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      date: order.date,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      items: order.items,
      notes: order.notes,          // 👈 thêm ghi chú
      cancelNote: order.cancelNote // 👈 thêm lý do huỷ
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xem chi tiết đơn hàng', error: err.message });
  }
});


// ----------------- Lấy tất cả / theo user -----------------
router.get('/', async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy đơn hàng', error: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!oid(userId)) return res.status(400).json({ message: 'userId không hợp lệ' });
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy đơn hàng', error: err.message });
  }
});

// ----------------- Cập nhật trạng thái -----------------
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    if (!oid(id)) return res.status(400).json({ message: 'orderId không hợp lệ' });
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    if (!updatedOrder) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật trạng thái', error: err.message });
  }
});

// ----------------- Huỷ đơn -----------------
router.patch('/:id/cancel', async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    const { cancelNote } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'orderId không hợp lệ' });
    }

    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);
      if (!order) throw new Error('Không tìm thấy đơn hàng');

      if (order.status === 'Đã giao') {
        throw new Error('Đơn hàng đã giao, không thể huỷ');
      }
      if (order.status === 'Đã huỷ') {
        throw new Error('Đơn hàng đã được huỷ trước đó');
      }

      // Hoàn kho
      for (const it of order.items) {
        const product = await Product.findById(it.productId).session(session);
        if (product) {
          const variant = product.variants.find(
            v => v.size === it.size && v.color === it.color
          );
          if (variant) {
            variant.quantity += it.quantity;
            await product.save({ session });
          }
        }
      }

      // Cập nhật trạng thái + note
      order.status = 'Đã huỷ';
      order.notes.push({
        type: 'cancel',
        message: cancelNote?.trim() || 'Đơn hàng bị huỷ',
        date: new Date()
      });
      await order.save({ session });

      res.json({ message: 'Huỷ đơn hàng thành công', order });
    });
  } catch (err) {
    console.error('Lỗi huỷ đơn:', err.message);
    const msg = String(err.message || '');
    if (msg.includes('không thể huỷ') || msg.includes('Đã huỷ') || msg.includes('Đã giao')) {
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: 'Lỗi huỷ đơn hàng', error: err.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;