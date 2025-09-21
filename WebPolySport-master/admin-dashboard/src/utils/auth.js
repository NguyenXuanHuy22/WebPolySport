// src/utils/auth.js

// Lấy thông tin người dùng admin từ localStorage
export const getAdminUser = () => {
  try {
    const data = localStorage.getItem('adminUser');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[Auth] Lỗi khi phân tích adminUser:', error);
    removeAdminUser();
    return null;
  }
};

// Kiểm tra xem admin đã đăng nhập chưa
export const isAdminLoggedIn = () => {
  const user = getAdminUser();
  return !!(user && user.role === 'admin');
};

// Lưu thông tin người dùng admin vào localStorage
export const setAdminUser = (user) => {
  if (user && user.id && user.role === 'admin') {
    localStorage.setItem('adminUser', JSON.stringify(user));
  } else {
    console.warn('[Auth] Dữ liệu không hợp lệ để lưu admin');
  }
};

// Xóa thông tin người dùng admin khỏi localStorage
export const removeAdminUser = () => {
  localStorage.removeItem('adminUser');
};

// Xác thực truy cập admin
export const validateAdminAccess = () => {
  const user = getAdminUser();
  if (!user || user.role !== 'admin') {
    removeAdminUser();
    return false;
  }
  return true;
};
