const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache helper functions
const getCacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// API: /api/stats/revenue?from=2025-08-01&to=2025-08-31&granularity=day&paymentMethod=cod
router.get('/revenue', async (req, res) => {
  try {
    const { from, to, granularity = 'day', paymentMethod } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: 'Cần truyền from và to (YYYY-MM-DD)' });
    }

    // Check cache first
    const cacheKey = getCacheKey('revenue', { from, to, granularity, paymentMethod });
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const unitMap = { day: 'day', month: 'month', year: 'year' };
    const unit = unitMap[granularity] || 'day';

    // Validate date range
    if (new Date(from) > new Date(to)) {
      return res.status(400).json({ message: 'Ngày bắt đầu không được lớn hơn ngày kết thúc' });
    }

    // base condition - mở rộng để tính cả đơn đang giao, đã xác nhận và chờ xác nhận
    const matchCondition = {
      status: { $in: ['Đã giao', 'Đang giao hàng', 'Đã xác nhận', 'Chờ xác nhận'] },
      createdAt: {
        $gte: new Date(from),
        $lte: new Date(to)
      }
    };

    // nếu có filter paymentMethod thì chuẩn hóa rồi thêm vào
    if (paymentMethod && paymentMethod !== '') {
      if (paymentMethod === 'zalopay') {
        matchCondition.paymentMethod = 'ZaloPay'; // ✅ Sửa từ 'zalopay' thành 'ZaloPay'
      } else if (paymentMethod === 'cod') {
        matchCondition.paymentMethod = 'Thanh toán khi nhận hàng'; // ✅ Sửa từ 'thanh toán khi nhận hàng' thành 'Thanh toán khi nhận hàng'
      }
    }
    
    // Debug log
    console.log('Revenue API Debug:', {
      from, to, granularity, paymentMethod,
      matchCondition
    });

    const pipeline = [
      { $match: matchCondition },
      {
        $addFields: {
          dateKey: {
            $dateTrunc: {
              date: '$createdAt',
              unit: unit,
              timezone: 'Asia/Bangkok'
            }
          }
            }
          },
      {
        $group: {
          _id: '$dateKey',
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ];

    const result = await Order.aggregate(pipeline);
    
    // Cache the result
    setCache(cacheKey, result);
    
    res.json(result);

  } catch (error) {
    console.error('Revenue stats error:', error);
    res.status(500).json({ message: 'Lỗi server khi tải thống kê doanh thu' });
  }
});

// API: /api/stats/top-products?from=2025-08-01&to=2025-08-31&limit=10&paymentMethod=zalopay
router.get('/top-products', async (req, res) => {
  try {
    const { from, to, limit = 10, paymentMethod } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({ message: 'Cần truyền from và to (YYYY-MM-DD)' });
    }

    // Check cache first
    const cacheKey = getCacheKey('top-products', { from, to, limit, paymentMethod });
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Validate date range
    if (new Date(from) > new Date(to)) {
      return res.status(400).json({ message: 'Ngày bắt đầu không được lớn hơn ngày kết thúc' });
    }

    // Build match condition with payment method filter
    const matchCondition = {
      status: { $in: ['Đã giao', 'Đang giao hàng', 'Đã xác nhận', 'Chờ xác nhận'] },
      createdAt: {
        $gte: new Date(from),
        $lte: new Date(to)
      }
    };

    // Add payment method filter if specified
    if (paymentMethod && paymentMethod !== '') {
      if (paymentMethod === 'zalopay') {
        matchCondition.paymentMethod = 'ZaloPay';
      } else if (paymentMethod === 'cod') {
        matchCondition.paymentMethod = 'Thanh toán khi nhận hàng';
      }
    }

    const pipeline = [
      { $match: matchCondition },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.name' },
          productImage: { $first: '$items.image' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ];

    const result = await Order.aggregate(pipeline);
    
    // Cache the result
    setCache(cacheKey, result);
    
    res.json(result);

  } catch (error) {
    console.error('Top products stats error:', error);
    res.status(500).json({ message: 'Lỗi server khi tải thống kê sản phẩm bán chạy' });
  }
});

// API: /api/stats/top-users?from=2025-08-01&to=2025-08-31&limit=10&paymentMethod=zalopay
router.get('/top-users', async (req, res) => {
  try {
    const { from, to, limit = 10, paymentMethod } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({ message: 'Cần truyền from và to (YYYY-MM-DD)' });
    }

    // Check cache first
    const cacheKey = getCacheKey('top-users', { from, to, limit, paymentMethod });
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Validate date range
    if (new Date(from) > new Date(to)) {
      return res.status(400).json({ message: 'Ngày bắt đầu không được lớn hơn ngày kết thúc' });
    }

    // Build match condition with payment method filter
    const matchCondition = {
      status: { $in: ['Đã giao', 'Đang giao hàng', 'Đã xác nhận', 'Chờ xác nhận'] },
      createdAt: {
        $gte: new Date(from),
        $lte: new Date(to)
      }
    };

    // Add payment method filter if specified
    if (paymentMethod && paymentMethod !== '') {
      if (paymentMethod === 'zalopay') {
        matchCondition.paymentMethod = 'ZaloPay';
      } else if (paymentMethod === 'cod') {
        matchCondition.paymentMethod = 'Thanh toán khi nhận hàng';
      }
    }

    const pipeline = [
      { $match: matchCondition },
      {
        $group: {
          _id: '$userId',
          customerName: { $first: '$customerName' },
          customerPhone: { $first: '$customerPhone' },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) }
    ];

    const result = await Order.aggregate(pipeline);
    
    // Cache the result
    setCache(cacheKey, result);
    
    res.json(result);

  } catch (error) {
    console.error('Top users stats error:', error);
    res.status(500).json({ message: 'Lỗi server khi tải thống kê khách hàng' });
  }
});

// API: /api/stats/dashboard-summary
router.get('/dashboard-summary', async (req, res) => {
  try {
    // Check cache first
    const cacheKey = getCacheKey('dashboard-summary', {});
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Tổng doanh thu tháng này
    const currentMonthRevenue = await Order.aggregate([
      {
        $match: {
          status: { $in: ['Đã giao', 'Đang giao hàng', 'Đã xác nhận', 'Chờ xác nhận'] },
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    // Tổng doanh thu tháng trước
    const lastMonthRevenue = await Order.aggregate([
      {
        $match: {
          status: { $in: ['Đã giao', 'Đang giao hàng', 'Đã xác nhận', 'Chờ xác nhận'] },
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    // Tổng số sản phẩm
    const totalProducts = await Product.countDocuments();
    const inStockProducts = await Product.countDocuments({ status: 'còn hàng' });
    const outOfStockProducts = await Product.countDocuments({ status: 'hết hàng' });

    // Tổng số người dùng
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const activeUsers = await User.countDocuments({ role: { $ne: 'admin', $ne: 'locked' } });
    const lockedUsers = await User.countDocuments({ role: 'locked' });

    // Tổng số đơn hàng theo trạng thái
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      revenue: {
        currentMonth: currentMonthRevenue[0]?.total || 0,
        lastMonth: lastMonthRevenue[0]?.total || 0,
        growth: currentMonthRevenue[0]?.total - (lastMonthRevenue[0]?.total || 0)
      },
      orders: {
        currentMonth: currentMonthRevenue[0]?.count || 0,
        lastMonth: lastMonthRevenue[0]?.count || 0
      },
      products: {
        total: totalProducts,
        inStock: inStockProducts,
        outOfStock: outOfStockProducts
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        locked: lockedUsers
      },
      orderStatus: orderStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    // Cache the result
    setCache(cacheKey, summary);

    res.json(summary);

  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ message: 'Lỗi server khi tải tổng quan dashboard' });
  }
});

// API: /api/stats/clear-cache
router.post('/clear-cache', async (req, res) => {
  try {
    cache.clear();
    res.json({ message: 'Cache đã được xóa thành công' });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa cache' });
  }
});

// API: /api/stats/test-filter - Test filter đơn giản
router.get('/test-filter', async (req, res) => {
  try {
    const { paymentMethod } = req.query;
    
    let matchCondition = {
      status: { $in: ['Đã giao', 'Đang giao hàng', 'Đã xác nhận', 'Chờ xác nhận'] }
    };
    
    if (paymentMethod === 'cod') {
      matchCondition.paymentMethod = 'Thanh toán khi nhận hàng';
    } else if (paymentMethod === 'zalopay') {
      matchCondition.paymentMethod = 'ZaloPay';
    }
    
    const result = await Order.find(matchCondition).limit(10).select('paymentMethod status total createdAt');
    
    res.json({
      filter: paymentMethod,
      matchCondition,
      count: result.length,
      orders: result
    });
  } catch (error) {
    console.error('Test filter error:', error);
    res.status(500).json({ message: 'Lỗi server khi test filter' });
  }
});

// API: /api/stats/debug - Debug endpoint để kiểm tra dữ liệu
router.get('/debug', async (req, res) => {
  try {
    // Lấy tất cả paymentMethod unique
    const paymentMethods = await Order.distinct('paymentMethod');
    
    // Đếm số đơn theo từng paymentMethod
    const paymentCounts = await Order.aggregate([
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }
    ]);
    
    // Đếm số đơn theo status
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Lấy một vài đơn hàng mẫu
    const sampleOrders = await Order.find({}).limit(5).select('paymentMethod status total createdAt');
    
    // Kiểm tra đơn COD cụ thể
    const codOrders = await Order.find({ paymentMethod: 'Thanh toán khi nhận hàng' }).limit(10).select('paymentMethod status total createdAt');
    
    // Kiểm tra đơn COD trong date range 2025-08-01 đến 2025-08-31
    const codInDateRange = await Order.find({
      paymentMethod: 'Thanh toán khi nhận hàng',
      createdAt: {
        $gte: new Date('2025-08-01'),
        $lte: new Date('2025-08-31')
      }
    }).select('paymentMethod status total createdAt');
    
    // Kiểm tra đơn COD với status phù hợp
    const codWithValidStatus = await Order.find({
      paymentMethod: 'Thanh toán khi nhận hàng',
      status: { $in: ['Đã giao', 'Đang giao hàng', 'Đã xác nhận', 'Chờ xác nhận'] }
    }).select('paymentMethod status total createdAt');
    
    res.json({
      paymentMethods,
      paymentCounts,
      statusCounts,
      sampleOrders,
      totalOrders: await Order.countDocuments(),
      codOrders,
      codInDateRange,
      codWithValidStatus
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ message: 'Lỗi server khi debug' });
  }
});

module.exports = router;
