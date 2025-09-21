const mongoose = require('mongoose');
const Order = require('./models/Order');

async function checkCod() {
  try {
    await mongoose.connect('mongodb://localhost:27017/polysport');
    
    console.log('=== CHECKING COD ORDERS ===');
    
    // Tất cả đơn COD
    const allCod = await Order.find({ paymentMethod: 'Thanh toán khi nhận hàng' });
    console.log('Total COD orders:', allCod.length);
    
    // Đơn COD với status
    const codWithStatus = await Order.find({ 
      paymentMethod: 'Thanh toán khi nhận hàng' 
    }).select('status createdAt total');
    
    console.log('COD orders with status:');
    codWithStatus.forEach((order, index) => {
      console.log(`${index + 1}. Status: ${order.status}, Date: ${order.createdAt}, Total: ${order.total}`);
    });
    
    // Đơn COD trong date range 2025-08-01 đến 2025-08-31
    const codInRange = await Order.find({
      paymentMethod: 'Thanh toán khi nhận hàng',
      createdAt: {
        $gte: new Date('2025-08-01'),
        $lte: new Date('2025-08-31')
      }
    });
    console.log('COD orders in date range 2025-08-01 to 2025-08-31:', codInRange.length);
    
    // Đơn COD với status hợp lệ
    const codValidStatus = await Order.find({
      paymentMethod: 'Thanh toán khi nhận hàng',
      status: { $in: ['Đã giao', 'Đang giao hàng', 'Đã xác nhận'] }
    });
    console.log('COD orders with valid status:', codValidStatus.length);
    
    // Đơn COD với status hợp lệ VÀ trong date range
    const codValidStatusInRange = await Order.find({
      paymentMethod: 'Thanh toán khi nhận hàng',
      status: { $in: ['Đã giao', 'Đang giao hàng', 'Đã xác nhận'] },
      createdAt: {
        $gte: new Date('2025-08-01'),
        $lte: new Date('2025-08-31')
      }
    });
    console.log('COD orders with valid status AND in date range:', codValidStatusInRange.length);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkCod();
