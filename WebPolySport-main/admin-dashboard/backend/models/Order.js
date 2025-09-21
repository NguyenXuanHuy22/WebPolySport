const mongoose = require('mongoose');
const { Schema } = mongoose;

// --- Schema cho từng sản phẩm trong đơn hàng ---
const orderItemSchema = new Schema({
  orderDetailId: { type: String, required: true, unique: true }, // Đảm bảo unique
  productId: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true, min: 0 }, // Đảm bảo giá không âm
  quantity: { type: Number, required: true, min: 1, default: 1 }, // Min 1 để tránh 0
  size: { type: String, required: true }, // Xóa default nếu bắt buộc chọn
  color: { type: String, required: true }, // Xóa default nếu bắt buộc chọn
  subtotal: { type: Number, required: true, min: 0 }, // Đảm bảo không âm
  // Xóa date khỏi orderItemSchema vì không cần thiết (dùng date của order tổng)
}, { _id: false });

// --- Schema cho order ---
const orderSchema = new Schema({
  userId: { type: String, required: true, index: true }, // Index để query nhanh

  items: {
    type: [orderItemSchema],
    validate: {
      validator: arr => Array.isArray(arr) && arr.length > 0,
      message: 'Items không được để trống'
    }
  },

  total: { type: Number, required: true, min: 0 }, // Đảm bảo tổng không âm

  // --- Thông tin khách hàng ---
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: true },

  paymentMethod: { type: String, required: true },

  status: {
    type: String,
    enum: ['Pending Payment', 'Chờ xác nhận', 'Đã xác nhận', 'Đang giao hàng', 'Đã giao', 'Đã huỷ'], // ✅ Thêm 'Pending Payment'
    default: 'Pending Payment' // Mặc định là pending khi tạo từ /create
  },

  date: { type: Date, default: Date.now }, // Ngày tạo order

  // --- Thông tin thanh toán ZaloPay ---
  appTransId: { type: String, unique: true, sparse: true }, // Unique nhưng cho phép null
  zpTransId: { type: String, sparse: true }, // Có thể null nếu chưa thanh toán
  paidAmount: { type: Number, min: 0, default: 0 }, // Số tiền đã thanh toán

  // --- Notes để track lịch sử đơn ---
  notes: [
    {
      type: {
        type: String,
        enum: ['system', 'update', 'cancel', 'user'],
        default: 'system'
      },
      message: { type: String, required: true },
      date: { type: Date, default: Date.now }
    }
  ],

  // --- Track thêm ngày xác nhận/hủy (tùy chọn) ---
  confirmedAt: { type: Date }, // Ngày xác nhận thanh toán
  cancelledAt: { type: Date }  // Ngày hủy (nếu có)

}, { timestamps: true }); // Giữ timestamps để track createdAt, updatedAt

// Index cho appTransId để query nhanh
orderSchema.index({ appTransId: 1 }, { unique: true, sparse: true });

// Model
module.exports = mongoose.model('Order', orderSchema);