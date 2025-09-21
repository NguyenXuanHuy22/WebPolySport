const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");
const Address = require('../models/Address');
const multer = require("multer");

// Cấu hình lưu file ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    const { name, email, phone, address, avatar } = req.body;

    if (name) existingUser.name = name;
    if (email) existingUser.email = email;
    if (phone) existingUser.phone = phone;
    if (address) existingUser.address = address;

    if (avatar) {
      existingUser.avatar = avatar;
    }

    const updatedUser = await existingUser.save();
    res.json(updatedUser);
  } catch (err) {
    console.error("❌ Lỗi update user:", err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật user' });
  }
});

// đổi mật khẩu 
router.post('/:id/change-password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.params.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu cũ và mới" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    // Kiểm tra mật khẩu cũ có đúng không
    if (user.password !== oldPassword) {
      return res.status(400).json({ message: "Mật khẩu cũ không đúng" });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword; // TODO: hash nếu cần
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error("❌ Lỗi đổi mật khẩu:", err);
    res.status(500).json({ message: "Lỗi server khi đổi mật khẩu" });
  }
});

// Lấy tất cả người dùng, loại trừ admin
router.get("/", async (req, res) => {
  try {
    // Lọc role khác "admin"
    const users = await User.find({ role: { $ne: "admin" } });
    res.json(users);
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách người dùng:", err);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách người dùng" });
  }
});

// Lấy người dùng theo ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json(user);
  } catch (err) {
    console.error("❌ Lỗi lấy người dùng:", err);
    res.status(500).json({ message: "Lỗi server khi lấy người dùng" });
  }
});

// Đăng nhập (thêm check nếu role === 'locked' thì không cho đăng nhập)
router.post("/login", async (req, res) => {
  console.log("🔥 Yêu cầu login nhận được:", req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng cung cấp email và mật khẩu" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.warn("⚠️ Đăng nhập thất bại: không tìm thấy email", email);
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Kiểm tra tài khoản có bị khóa không
    if (user.role === "locked") {
      return res.status(403).json({ message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên." });
    }

    if (user.password !== password) {
      console.warn("⚠️ Đăng nhập thất bại cho email:", email);
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      role: user.role,
    });
  } catch (err) {
    console.error("❌ Lỗi đăng nhập:", err);
    res.status(500).json({ message: "Lỗi server khi đăng nhập" });
  }
});

// Đăng ký tài khoản
router.post("/register", async (req, res) => {
  console.log("🔥 Yêu cầu register nhận được:", req.body);
  try {
    const { name, email, phone, password, avatar, address } = req.body; 

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // 1. Tạo user
    const newUser = new User({
      name,
      email,
      phone,
      password,
      avatar,
      address,
      role: "user",
    });
    const savedUser = await newUser.save();

    // 2. Tạo Cart riêng cho user
    const newCart = new Cart({ userId: savedUser._id.toString(), items: [] });
    await newCart.save();

    // 3. Tạo Wishlist riêng cho user
    const newWishlist = new Wishlist({ userId: savedUser._id.toString(), items: [] });
    await newWishlist.save();

    // 4. Tạo địa chỉ mặc định
    const newAddress = new Address({
      userId: savedUser._id,
      name: savedUser.name,
      address: savedUser.address || "Chưa có địa chỉ",
      phone: savedUser.phone || "Chưa có số điện thoại",
    });
    await newAddress.save();

    // 5. Trả về thông tin user
    res.status(201).json({
      message: "Đăng ký thành công",
      user: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        address: savedUser.address,
        avatar: savedUser.avatar,
        role: savedUser.role,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi đăng ký:", err);
    res.status(500).json({ message: "Lỗi server khi đăng ký" });
  }
});

// Cập nhật role cho user theo id (ví dụ chuyển sang 'locked' để khóa tài khoản)
router.patch("/:id/role", async (req, res) => {
  try {
    const { role } = req.body;

    const validRoles = ["user", "admin", "locked"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Role không hợp lệ" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json({
      message: "Cập nhật trạng thái thành công",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi cập nhật role:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật role" });
  }
});


module.exports = router;

