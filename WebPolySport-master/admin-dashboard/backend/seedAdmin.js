// seedAdmin.js
const mongoose = require('mongoose');
const User = require('./models/User'); // đường dẫn tới model User

// ✅ Kết nối MongoDB Atlas hoặc local
mongoose.connect('mongodb+srv://huycoi1293:P6VpYHV2CWiOwlr0@cluster0.75cf1rv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Kết nối MongoDB thành công');
}).catch(err => {
  console.error('❌ Kết nối thất bại:', err);
});

const admin = {
  name: "Nguyễn Văn A",
  email: "admin1@gmail.com",
  phone: "0987654321",
  password: "123456", // ⚠️ Bạn có thể hash nếu muốn bảo mật
  address: "Hà Nội",
  avatar: "https://i.pinimg.com/736x/fd/bf/6f/fdbf6fa788ed6f1a0ff9432e61393489.jpg",
  role: "admin"
};

const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ email: admin.email });
    if (existingAdmin) {
      console.log('⚠️ Tài khoản admin đã tồn tại.');
    } else {
      await User.create(admin);
      console.log('✅ Tạo tài khoản admin thành công.');
    }
  } catch (err) {
    console.error('❌ Lỗi khi tạo admin:', err);
  } finally {
    mongoose.disconnect();
  }
};

seedAdmin();
