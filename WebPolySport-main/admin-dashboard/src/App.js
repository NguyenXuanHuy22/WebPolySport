import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import ProductDetail from './pages/ProductDetail';
import OrderManagement from './pages/ordermanagement'; // ✅ sửa tên file
import ProtectedRoute from './components/ProtectedRoute';
import RevenueChart from './pages/RevenueChart'; // ✅ đảm bảo file tồn tại
import BannerManagement from './pages/BannerManagement'; // ✅ import trang quản lý banner

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/orders" element={<OrderManagement />} />
        <Route path="/revenue" element={<RevenueChart />} />
        <Route
          path="/banners"
          element={
            <ProtectedRoute>
              <BannerManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
