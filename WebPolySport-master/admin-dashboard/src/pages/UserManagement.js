import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, toggleLockUser } from '../features/users/userSlice';
import { useNavigate, Link } from 'react-router-dom';
import { getAdminUser, removeAdminUser } from '../utils/auth';

function UserManagement() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { users, loading, error, successMessage } = useSelector(state => state.users);
  const [adminUser, setAdminUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const adminData = getAdminUser();
    if (adminData) setAdminUser(adminData);
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      alert(successMessage);
    }
  }, [successMessage]);

  const handleLogout = () => {
    removeAdminUser();
    navigate('/login');
  };

  const handleToggleLock = (user) => {
    if (user.role === 'admin') {
      alert('Không thể khóa tài khoản admin!');
      return;
    }
    if (adminUser?._id === user._id) {
      alert('Bạn không thể khóa chính tài khoản của mình!');
      return;
    }

    const lock = user.role !== 'locked';
    dispatch(toggleLockUser({ userId: user._id, lock }))
      .unwrap()
      .catch(err => {
        alert('Lỗi: ' + err);
      });
  };

  const filteredUsers = users.filter(user => {
    if (user.role === 'admin') return false;
    const term = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(term) ||
      user.phone.toLowerCase().includes(term)
    );
  });

  // 🔢 Tính toán số liệu thống kê
  const totalUsers = filteredUsers.length;
  const totalLocked = filteredUsers.filter(u => u.role === 'locked').length;
  const totalActive = totalUsers - totalLocked;

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div style={{ color: 'red' }}>Lỗi: {error}</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle}>Poly Sport</h1>
          <div style={styles.headerActions}>
            <div style={styles.adminInfo}>
              <img
                src={adminUser?.avatar || 'https://via.placeholder.com/32'}
                alt="Admin"
                style={styles.adminAvatar}
              />
              <span style={styles.adminName}>{adminUser?.name || 'Admin'}</span>
            </div>
            <button style={styles.logoutButton} onClick={handleLogout}>Đăng xuất</button>
          </div>
        </div>
      </header>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.logo}>🏪</div>
            <h2 style={styles.sidebarTitle}>Quản lý</h2>
          </div>
          <nav style={styles.nav}>
            <Link to="/Dashboard" style={styles.navItem}>
              <span style={styles.navIcon}>📦</span>
              Quản lý Sản phẩm
            </Link>
            <Link to="/orders" style={styles.navItem}>
              <span style={styles.navIcon}>🛒</span>
              Quản lý Đơn hàng
            </Link>
            <Link to="/users" style={styles.navItem}>
              <span style={styles.navIcon}>👥</span>
              Quản lý tài khoản
            </Link>
            <Link to="/revenue" style={styles.navItem}>
              <span style={styles.navIcon}>📈</span>
              Quản lý Thống kê
            </Link>
            <Link to="/banners" style={styles.navItem}>
              <span style={styles.navIcon}>⚙️</span>
              Quản lý banner
            </Link>
          </nav>
        </aside>

        <main style={styles.content}>
          <div style={styles.contentHeader}>
            <h2 style={styles.contentTitle}>Quản lý tài khoản</h2>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* 🔥 Thêm thống kê ở đây */}
          <div style={styles.statsRow}>
            <div style={{ ...styles.statCard, backgroundColor: '#e3f2fd' }}>
              <span style={styles.statIcon}>👥</span>
              <div>
                <div style={styles.statLabel}>Tổng tài khoản</div>
                <div style={styles.statValue}>{totalUsers}</div>
              </div>
            </div>
            <div style={{ ...styles.statCard, backgroundColor: '#e8f5e9' }}>
              <span style={styles.statIcon}>✅</span>
              <div>
                <div style={styles.statLabel}>Đang hoạt động</div>
                <div style={styles.statValue}>{totalActive}</div>
              </div>
            </div>
            <div style={{ ...styles.statCard, backgroundColor: '#ffebee' }}>
              <span style={styles.statIcon}>🔒</span>
              <div>
                <div style={styles.statLabel}>Bị khóa</div>
                <div style={styles.statValue}>{totalLocked}</div>
              </div>
            </div>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Avatar</th>
                  <th style={styles.th}>Tên</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Số điện thoại</th>
                  <th style={styles.th}>Địa chỉ</th>
                  <th style={styles.th}>Vai trò</th>
                  <th style={styles.th}>Trạng thái</th>
                  <th style={styles.th}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id} style={styles.tr}>
                    <td style={styles.td}>
                      <img
                        src={
                          user.avatar
                            ? user.avatar.startsWith('http')
                              ? user.avatar
                              : `data:image/jpeg;base64,${user.avatar}`
                            : 'https://via.placeholder.com/32'
                        }
                        alt={user.name}
                        style={styles.avatar}
                      />
                    </td>
                    <td style={styles.td}>{user.name}</td>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>{user.phone}</td>
                    <td style={styles.td}>{user.address}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.roleBadge,
                          backgroundColor: user.role === 'locked' ? '#6c757d' : '#28a745',
                        }}
                      >
                        {user.role === 'locked' ? 'Đã khóa' : 'User'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {user.role === 'locked' ? (
                        <span style={{ color: 'red', fontWeight: 'bold' }}>Đã khóa</span>
                      ) : (
                        <span style={{ color: 'green', fontWeight: 'bold' }}>Đang hoạt động</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <button
                        style={{
                          ...styles.lockButton,
                          backgroundColor: user.role === 'locked' ? '#28a745' : '#dc3545',
                        }}
                        onClick={() => handleToggleLock(user)}
                      >
                        {user.role === 'locked' ? 'Mở khóa' : 'Khóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

export default UserManagement;

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 24px',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    flexShrink: 0,
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a202c',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  adminInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
  },
  adminAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  adminName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a202c',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    backgroundColor: '#ef4444',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  layout: {
    display: 'flex',
    flex: 1,
    minHeight: 'calc(100vh - 70px)',
    backgroundColor: '#f9fafb',
  },
  sidebar: {
    width: '280px',
    backgroundColor: 'white',
    borderRight: '1px solid #e2e8f0',
    padding: '24px 0',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: '0 24px 24px',
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '24px',
  },
  logo: {
    fontSize: '32px',
    marginBottom: '8px',
    lineHeight: 1,
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a202c',
    margin: 0,
    lineHeight: 1.2,
  },
  nav: {
    padding: '0 16px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    textDecoration: 'none',
    color: '#64748b',
    borderRadius: '8px',
    marginBottom: '8px',
    transition: 'all 0.2s',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1.3,
    boxSizing: 'border-box',
  },
  navIcon: {
    fontSize: '18px',
    lineHeight: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    overflowX: 'auto',
  },
  contentHeader: {
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '600',
    color: '#1a202c',
  },
  searchInput: {
    width: '300px',
    padding: '6px 12px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  tableContainer: {
    overflowX: 'auto',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
  },
  table: {
    width: '100%',
    minWidth: 800,
    borderCollapse: 'collapse',
  },
  th: {
    borderBottom: '2px solid #ddd',
    padding: '12px 16px',
    textAlign: 'left',
    backgroundColor: '#f0f0f0',
    fontWeight: '600',
    fontSize: '14px',
    color: '#1a202c',
  },
  tr: {
    borderBottom: '1px solid #ddd',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '12px 16px',
    verticalAlign: 'middle',
    fontSize: '14px',
    color: '#334155',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    objectFit: 'cover',
  },
  roleBadge: {
    padding: '4px 12px',
    borderRadius: 12,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    display: 'inline-block',
  },
  lockButton: {
    border: 'none',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    userSelect: 'none',
    transition: 'background-color 0.2s',
  },
   statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px',
    borderRadius: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
  },
  statIcon: {
    fontSize: '28px',
    marginRight: '12px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#555',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#111',
  },
};
