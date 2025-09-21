# Admin Dashboard

Hệ thống quản lý admin với chức năng đăng nhập bảo mật chỉ cho phép admin truy cập.

## 🚀 Tính năng

### 🔐 Hệ thống đăng nhập bảo mật
- **Chỉ admin mới có thể đăng nhập**: Hệ thống kiểm tra role và chỉ cho phép user có role "admin" truy cập
- **Bảo vệ route**: Tự động chuyển hướng về trang đăng nhập nếu chưa đăng nhập
- **Lưu trữ session**: Thông tin admin được lưu trong localStorage
- **Đăng xuất an toàn**: Xóa session và chuyển về trang đăng nhập

### 📊 Dashboard hiện đại
- **Thống kê tổng quan**: Hiển thị số liệu sản phẩm, đơn hàng, doanh thu
- **Danh sách sản phẩm**: Grid layout responsive với sản phẩm nằm ngang
- **Giao diện đẹp**: Thiết kế hiện đại với hiệu ứng hover và animation

## 🛠️ Cài đặt và chạy

1. **Cài đặt dependencies:**
```bash
npm install
```

2. **Chạy JSON Server (cần chạy trước):**
```bash
npx json-server --watch db.json --port 3001
```

3. **Chạy ứng dụng:**
```bash
npm start
```

## 👤 Tài khoản Admin

### Tài khoản mẫu có sẵn trong db.json:
- **Email:** admin1@gmail.com
- **Password:** 123456
- **Role:** admin

### Các tài khoản user thường (không thể đăng nhập):
- huynxph52088@gmail.com / 123456
- huycoi1293@gmail.com / 123456
- huy2005@gmail.com / 12345678
- huyy@gmail.com / 1234567

## 🔒 Bảo mật

- **Kiểm tra role**: Hệ thống kiểm tra role "admin" trước khi cho phép truy cập
- **Protected Routes**: Tất cả route đều được bảo vệ bởi ProtectedRoute component
- **Session Management**: Thông tin admin được lưu an toàn trong localStorage
- **Auto Redirect**: Tự động chuyển hướng về login nếu chưa đăng nhập

## 📁 Cấu trúc dự án

```
admin-dashboard/
├── src/
│   ├── components/           # Reusable components
│   │   ├── Login.js         # Login component
│   │   ├── ProtectedRoute.js # Route protection
│   │   └── index.js         # Component exports
│   ├── pages/               # Page components
│   │   ├── Dashboard.js     # Main dashboard
│   │   └── index.js         # Page exports
│   ├── utils/               # Utility functions
│   │   ├── auth.js          # Authentication utilities
│   │   └── constants.js     # Application constants
│   ├── features/            # Redux slices
│   │   └── product/
│   │       └── productSlice.js
│   ├── App.js               # Main app with routing
│   ├── App.css              # Global styles
│   └── index.js             # App entry point
├── db.json                  # JSON Server database
├── package.json             # Dependencies
└── README.md               # Documentation
```

## 🎨 Giao diện

- **Login Page**: Form đăng nhập với validation và thông báo lỗi
- **Dashboard**: Header với thông tin admin, sidebar navigation, stats cards
- **Product Grid**: Hiển thị sản phẩm với quick actions và hover effects
- **Responsive Design**: Tương thích với mọi kích thước màn hình

## 🔧 Công nghệ sử dụng

- **React 19**: Frontend framework
- **React Router DOM**: Client-side routing
- **Redux Toolkit**: State management
- **JSON Server**: Mock API server
- **CSS-in-JS**: Styling with inline styles

## 📋 Tính năng chính

### Authentication & Authorization
- ✅ Role-based access control
- ✅ Session management
- ✅ Protected routes
- ✅ Secure logout

### Dashboard Features
- ✅ Product management
- ✅ Statistics overview
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling

### Code Organization
- ✅ Modular component structure
- ✅ Utility functions
- ✅ Constants management
- ✅ Clean imports/exports

## ⚠️ Lưu ý

- Chỉ tài khoản có role "admin" mới có thể đăng nhập
- User thường sẽ nhận thông báo lỗi khi cố gắng đăng nhập
- Cần chạy JSON Server trước khi sử dụng ứng dụng
- Đảm bảo port 3001 không bị sử dụng bởi ứng dụng khác

## 🚀 Deployment

Để build ứng dụng cho production:

```bash
npm run build
```

Build files sẽ được tạo trong thư mục `build/`.
