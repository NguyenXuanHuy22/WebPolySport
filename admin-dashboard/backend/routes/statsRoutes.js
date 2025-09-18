const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// API: /api/stats/revenue?from=2025-08-01&to=2025-08-31&granularity=day&paymentMethod=cod
router.get('/revenue', async (req, res) => {
  try {
    const { from, to, granularity = 'day', paymentMethod } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: 'Cần truyền from và to (YYYY-MM-DD)' });
    }

    const unitMap = { day: 'day', month: 'month', year: 'year' };
    const unit = unitMap[granularity] || 'day';

    // base condition
    const matchCondition = {
      status: 'Đã giao', // chỉ tính đơn đã giao
      createdAt: {
        $gte: new Date(from),
        $lte: new Date(to)
      }
    };

    // nếu có filter paymentMethod thì chuẩn hóa rồi thêm vào
    if (paymentMethod && paymentMethod !== '') {
      if (paymentMethod === 'zalopay') {
        matchCondition.paymentMethod = 'zalopay';
      } else if (paymentMethod === 'cod') {
        matchCondition.paymentMethod = 'thanh toán khi nhận hàng';
      }
    }

    const pipeline = [
      { $match: matchCondition },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: '$createdAt',
              unit: unit,
              timezone: 'Asia/Bangkok'
            }
          },
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ];

    const result = await Order.aggregate(pipeline);
    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
