require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const qs = require('qs');

const router = express.Router();

// Model của bạn
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

// ---- ENV
const {
  ZLP_APP_ID,
  ZLP_KEY1,
  ZLP_KEY2,
  ZLP_CREATE_URL,
  ZLP_QUERY_URL,
  ZLP_CALLBACK_URL,
  ZLP_REDIRECT_URL
} = process.env;

// Helper: app_trans_id (format yymmdd-xxxxx)
const buildTransId = (prefix = '') => {
  const d = new Date();
  const yymmdd = d.toISOString().slice(2, 10).replace(/-/g, ''); // yymmdd
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `${yymmdd}_${prefix}${rand}`;
};

// Helper: HMAC SHA256 -> hex
const hmacSHA256 = (data, key) =>
  crypto.createHmac('sha256', key).update(String(data)).digest('hex');

// Helper: Cập nhật kho và clear cart (chỉ gọi khi success)
const updateInventoryAndCart = async (order) => {
  for (const it of order.items) {
    const product = await Product.findById(it.productId);
    if (!product) continue;
    const variant = product.variants.find(v => v.size === it.size && v.color === it.color);
    if (variant) {
      if (variant.quantity < it.quantity) {
        console.warn(`Kho thiếu cho ${product.name} ${it.size}/${it.color}`);
      } else {
        variant.quantity -= it.quantity;
        await product.save();
      }
    }
  }
  await Cart.findOneAndUpdate({ userId: order.userId }, { items: [] });
};

// =============================================================================
// 1) CREATE ORDER (tạo phiên thanh toán ZaloPay) - Chỉ lưu PENDING
// =============================================================================
router.post('/create', async (req, res) => {
  try {
    const { userId, items = [], customerName, customerPhone, customerAddress, description } = req.body;

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Thiếu userId hoặc items' });
    }

    // ✅ Validation items: Đảm bảo price/quantity >0
    const validItems = items.filter(it => Number(it.price || 0) > 0 && Number(it.quantity || 0) > 0);
    if (validItems.length === 0) {
      return res.status(400).json({ message: 'Items không hợp lệ (price/quantity phải >0)' });
    }

    // ✅ Tính tổng tiền
    let amount = validItems.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 0), 0);
    if (amount < 1000) amount = 1000; // minimum Sandbox requirement

    const app_user = String(userId);
    const app_trans_id = buildTransId();
    const app_time = Date.now();

    // ✅ Embed_data chỉ chứa dữ liệu phụ
    const embedObj = { note: "Thanh toán đơn hàng qua ZaloPay" };
    const embed_data = JSON.stringify(embedObj);

    // ✅ FIX: Item format đúng docs ZaloPay (name, quantity, price - KHÔNG có itemid)
    const item = JSON.stringify(validItems.map(it => ({
      name: String(it.name || 'Sản phẩm'),
      quantity: Number(it.quantity || 0),
      price: Number(it.price || 0)
    })));

    // ✅ MAC theo chuẩn tài liệu ZaloPay v2
    const dataMac = [ZLP_APP_ID, app_trans_id, app_user, amount, app_time, embed_data, item].join('|');
    const mac = hmacSHA256(dataMac, ZLP_KEY1);

    // ✅ Payload đầy đủ
    const payload = {
      app_id: Number(ZLP_APP_ID),
      app_user,
      app_time,
      amount,
      app_trans_id,
      embed_data,
      item,
      description: description || 'Thanh toán đơn hàng qua ZaloPay',
      callback_url: ZLP_CALLBACK_URL,
      redirect_url: ZLP_REDIRECT_URL,
      mac
    };

    console.log('[ZALOPAY CREATE] Payload gửi lên:', JSON.stringify(payload, null, 2));

    const zlpResp = await axios.post(ZLP_CREATE_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    const z = zlpResp.data;
    console.log('[ZALOPAY CREATE] Phản hồi từ ZaloPay (return_code:', z.return_code, '):', JSON.stringify(z, null, 2));

    if (z.return_code !== 1) {
      return res.status(500).json({ 
        message: 'ZaloPay từ chối tạo order', 
        error: z.return_message || 'Unknown error',
        return_code: z.return_code 
      });
    }

    if (!z.order_url && !z.zp_trans_token) {
      return res.status(500).json({ message: 'ZaloPay trả lỗi (no order_url/token)', error: z });
    }

    // ✅ Lấy link thanh toán
    let paymentUrl = z.order_url;
    if (!paymentUrl && z.zp_trans_token) {
      paymentUrl = `https://sandbox.zalopay.com/checkout?token=${z.zp_trans_token}`;
    }

    const zpTransToken = z.zp_trans_token || z.order_token || null;

    // ✅ FIX: Lưu PENDING order (KHÔNG trừ kho, status 'Pending Payment')
    const pendingOrder = await Order.create({
      userId,
      items: validItems.map(it => ({
        orderDetailId: crypto.randomUUID(),
        productId: it.productId,
        name: it.name,
        image: it.image,
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 0),
        size: it.size || '',
        color: it.color || '',
        subtotal: Number(it.price || 0) * Number(it.quantity || 0),
        paymentMethod: 'ZaloPay'
      })),
      total: amount,
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      customerAddress: customerAddress || '',
      paymentMethod: 'ZaloPay',
      status: 'Pending Payment', // ✅ PENDING - chưa thanh toán
      appTransId: app_trans_id,
      zpTransToken
    });

    console.log('[ZALOPAY CREATE] Lưu pending order:', pendingOrder._id);

    return res.json({
      message: 'Khởi tạo thanh toán ZaloPay thành công',
      orderId: pendingOrder._id, // Trả pending orderId để frontend theo dõi nếu cần
      app_trans_id,
      amount,
      paymentUrl,
      zpTransToken,
      rawZalo: z
    });

  } catch (err) {
    console.error('ZaloPay create error:', err?.response?.data || err.message);
    return res.status(500).json({ message: 'Lỗi khởi tạo thanh toán ZaloPay', error: err?.response?.data || err.message });
  }
});

// =============================================================================
// 2) CALLBACK (ZaloPay gọi backend sau thanh toán) - Cập nhật pending nếu success
// =============================================================================
router.post('/callback', async (req, res) => {
  try {
    const { data, mac, type } = req.body || {};
    if (!data || !mac) {
      console.log('[ZALOPAY CALLBACK] Thiếu data/mac');
      return res.status(400).json({ return_code: -1, return_message: 'Thiếu data/mac' });
    }

    const macCalc = hmacSHA256(data, ZLP_KEY2);
    if (mac !== macCalc) {
      console.log('[ZALOPAY CALLBACK] MAC sai:', { received: mac, calculated: macCalc });
      return res.status(200).json({ return_code: -1, return_message: 'MAC không hợp lệ' });
    }

    const payload = JSON.parse(data);
    const { app_trans_id, zp_trans_id, amount, status = 0 } = payload; // status từ ZaloPay (1: success)

    console.log('[ZALOPAY CALLBACK] Nhận callback cho trans_id:', app_trans_id, 'status:', status);

    const order = await Order.findOne({ appTransId: app_trans_id });
    if (!order) {
      console.log('[ZALOPAY CALLBACK] Pending order không tồn tại:', app_trans_id);
      return res.status(200).json({ return_code: 2, return_message: 'Order không tồn tại (duplicate or late)' });
    }

    if (order.status === 'Đã xác nhận' || order.status === 'Đang giao hàng' || order.status === 'Đã giao') {
      console.log('[ZALOPAY CALLBACK] Đã xử lý trước:', app_trans_id);
      return res.status(200).json({ return_code: 1, return_message: 'Đã cập nhật trước đó' });
    }

    if (status !== 1) { // Fail
      order.status = 'Hủy'; // ✅ Đánh dấu hủy pending
      await order.save();
      console.log('[ZALOPAY CALLBACK] Cập nhật fail:', app_trans_id);
      return res.status(200).json({ return_code: 1, return_message: 'OK (fail case)' });
    }

    // ✅ Success: Cập nhật thành chính thức, trừ kho, clear cart
    await updateInventoryAndCart(order);
    order.status = 'Đã xác nhận';
    order.zpTransId = zp_trans_id;
    order.paidAmount = amount;
    await order.save();

    console.log('[ZALOPAY CALLBACK] Cập nhật success:', app_trans_id);
    return res.status(200).json({ return_code: 1, return_message: 'OK' });

  } catch (err) {
    console.error('ZaloPay callback error:', err.message);
    return res.status(200).json({ return_code: 0, return_message: 'Server error' });
  }
});

// =============================================================================
// 3) RETURN (ZaloPay redirect frontend sau thanh toán) - Giữ nguyên, nhưng check DB
// =============================================================================
router.get('/return', async (req, res) => {
  try {
    const { apptransid, status, return_code } = req.query;
    let isSuccess = status === '1' || return_code === '1';

    // ✅ Thêm check DB để chính xác hơn
    if (apptransid) {
      const order = await Order.findOne({ appTransId: apptransid });
      if (order && (order.status === 'Đã xác nhận' || order.status === 'Đang giao hàng')) {
        isSuccess = true;
      }
    }

    const resultStatus = isSuccess ? 'success' : 'failed';

    console.log('[ZALOPAY RETURN] Redirect với status:', resultStatus, 'trans_id:', apptransid);

    // Trả về HTML để mở deep link
    return res.send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head><meta charset="UTF-8"><title>Đang chuyển về ứng dụng...</title></head>
      <body>
        <p>Đang quay lại ứng dụng...</p>
        <script>
          window.location.href = "myapp://payment/result?status=${resultStatus}&apptransid=${apptransid}";
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('ZaloPay return error:', err.message);
    return res.send(`
      <html><body>
      <script>window.location.href="myapp://payment/result?status=failed";</script>
      </body></html>
    `);
  }
});

// =============================================================================
// 4) QUERY STATUS (query trạng thái từ ZaloPay và cập nhật pending nếu cần)
// =============================================================================
router.post('/query', async (req, res) => {
  try {
    const { app_trans_id } = req.body || {};
    if (!app_trans_id) return res.status(400).json({ message: 'Thiếu app_trans_id' });

    console.log('[ZALOPAY QUERY] Query cho trans_id:', app_trans_id);

    // ✅ Tìm pending order trước
    const order = await Order.findOne({ appTransId: app_trans_id });
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy pending order', return_code: 2 });
    }

    // Nếu đã chính thức, trả status ngay
    if (order.status === 'Đã xác nhận' || order.status === 'Đang giao hàng' || order.status === 'Đã giao') {
      return res.json({
        return_code: 1,
        return_message: 'Đã thanh toán thành công',
        order_status: order.status,
        app_trans_id,
        orderId: order._id
      });
    }

    if (order.status === 'Hủy') {
      return res.json({
        return_code: 0,
        return_message: 'Đã hủy',
        order_status: 'Hủy',
        app_trans_id
      });
    }

    // ✅ Query ZaloPay để check status
    const dataMac = [ZLP_APP_ID, app_trans_id, ZLP_KEY1].join('|');
    const mac = hmacSHA256(dataMac, ZLP_KEY1);

    const payload = {
      app_id: Number(ZLP_APP_ID),
      app_trans_id,
      mac
    };

    const qres = await axios.post(ZLP_QUERY_URL, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    const qData = qres.data;
    console.log('[ZALOPAY QUERY] Response từ ZaloPay:', JSON.stringify(qData, null, 2));

    if (qData.return_code !== 1) { // Fail
      order.status = 'Hủy';
      await order.save();
      return res.json({
        ...qData,
        order_status: 'Hủy'
      });
    }

    // ✅ Success: Cập nhật pending thành chính thức, trừ kho
    await updateInventoryAndCart(order);
    order.status = 'Đã xác nhận';
    order.zpTransId = qData.zp_trans_id || null;
    order.paidAmount = qData.amount || 0;
    await order.save();

    console.log('[ZALOPAY QUERY] Cập nhật success từ query:', app_trans_id);
    return res.json({
      ...qData,
      order_status: 'Đã xác nhận',
      orderId: order._id
    });

  } catch (err) {
    console.error('ZaloPay query error:', err?.response?.data || err.message);
    return res.status(500).json({ message: 'Lỗi query ZaloPay', error: err?.response?.data || err.message });
  }
});

module.exports = router;