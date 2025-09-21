import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  try {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) throw new Error('No adminUser found');

    const adminData = JSON.parse(adminUser);
    if (adminData.role !== 'admin') throw new Error('Not an admin');

    return children;
  } catch (error) {
    localStorage.removeItem('adminUser');
    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;
