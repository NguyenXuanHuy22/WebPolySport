import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOrders,
  updateOrderStatus,
  cancelOrder,
} from "../features/product/orderSlice";

const Ordermanagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: orders = [] } = useSelector((state) => state.order || {});

  const [filteredOrders, setFilteredOrders] = useState([]);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatedStatuses, setUpdatedStatuses] = useState({});
  const [adminUser, setAdminUser] = useState(null);

  // --- Dialog huỷ đơn ---
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelOrderId, setCancelOrderId] = useState(null);

  // --- Dialog xem chi tiết ---
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("adminUser");
    if (storedUser) setAdminUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  useEffect(() => {
    let result = [...orders];

    if (fromDate && toDate) {
      result = result.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    if (statusFilter !== "Tất cả") {
      result = result.filter((order) => order.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o._id.toLowerCase().includes(lower) ||
          o.customerName.toLowerCase().includes(lower) ||
          o.customerPhone.includes(lower)
      );
    }

    setFilteredOrders(result);
  }, [orders, fromDate, toDate, statusFilter, searchTerm]);

  // --- Thống kê ---
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const totalDelivered = orders.filter((o) => o.status === "Đã giao").length;
  const totalPending = orders.filter((o) => o.status === "Chờ xác nhận").length;
  const totalRevenue = filteredOrders
    .filter(o => o.status === "Đã giao") // ✅ chỉ lấy đơn đã giao
    .reduce((sum, o) => sum + o.total, 0); const totalOrders = filteredOrders.length;
  const totalShipping = filteredOrders.filter((o) => o.status === "Đang giao hàng").length;
  const totalCancelled = filteredOrders.filter((o) => o.status === "Đã huỷ").length;

  const handleStatusChange = (orderId, newStatus) => {
    setUpdatedStatuses((prev) => ({ ...prev, [orderId]: newStatus }));
  };

  const updateStatusHandler = async (orderId) => {
    const newStatus = updatedStatuses[orderId];
    if (!newStatus) return;

    if (newStatus === "Đã huỷ") {
      setCancelOrderId(orderId);
      setShowCancelDialog(true);
      return;
    }

    try {
      await dispatch(updateOrderStatus({ orderId, newStatus })).unwrap();
      alert("Cập nhật đơn hàng thành công");
      dispatch(fetchOrders());
    } catch (error) {
      alert("Có lỗi xảy ra khi cập nhật đơn hàng");
      console.error(error);
    }
  };

  const confirmCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert("Vui lòng nhập lý do huỷ");
      return;
    }

    try {
      await dispatch(cancelOrder({ orderId: cancelOrderId, cancelNote: cancelReason })).unwrap();
      alert("Huỷ đơn hàng thành công");
      setShowCancelDialog(false);
      setCancelReason("");
      setCancelOrderId(null);
      dispatch(fetchOrders());
    } catch (error) {
      alert("Có lỗi xảy ra khi huỷ đơn hàng");
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    navigate("/login");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Chờ xác nhận":
        return "#fbc02d";
      case "Đang giao hàng":
        return "#1976d2";
      case "Đã giao":
        return "#388e3c";
      case "Đã huỷ":
        return "#d32f2f";
      default:
        return "#616161";
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle}>Poly Sport</h1>
          <div style={styles.headerActions}>
            <div style={styles.adminInfo}>
              <img
                src={adminUser?.avatar || "https://via.placeholder.com/32"}
                alt="Admin"
                style={styles.adminAvatar}
              />
              <span style={styles.adminName}>{adminUser?.name || "Admin"}</span>
            </div>
            <button style={styles.logoutButton} onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div style={styles.mainLayout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.logo}>🏪</div>
            <h2 style={styles.sidebarTitle}>Quản lý</h2>
          </div>
          <nav style={styles.nav}>
            <Link to="/Dashboard" style={styles.navItem}>
              📦 Quản lý Sản phẩm
            </Link>
            <Link to="/orders" style={styles.navItem}>
              🛒 Quản lý Đơn hàng
            </Link>
            <Link to="/users" style={styles.navItem}>
              👥 Quản lý Tài khoản
            </Link>
            <Link to="/revenue" style={styles.navItem}>
              📈 Quản lý Thống kê
            </Link>
            <Link to="/banners" style={styles.navItem}>
              ⚙️ Quản lý Banner
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <div style={styles.mainContent}>
          {/* Filter & Stats */}
          <div style={styles.filterBox}>
            <div style={styles.filterRow}>
              <input
                type="text"
                placeholder="🔍 Tìm theo mã đơn / KH / SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <DatePicker
                selected={fromDate}
                onChange={(date) => setFromDate(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Từ ngày"
                isClearable
                className="border px-3 py-2 rounded-lg"
              />
              <DatePicker
                selected={toDate}
                onChange={(date) => setToDate(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Đến ngày"
                isClearable
                className="border px-3 py-2 rounded-lg"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.selectBox}
              >
                <option value="Tất cả">Tất cả ({orders.length})</option>
                <option value="Chờ xác nhận">
                  Chờ xác nhận ({statusCounts["Chờ xác nhận"] || 0})
                </option>
                <option value="Đã xác nhận">
                  Đã xác nhận ({statusCounts["Đã xác nhận"] || 0})
                </option>
                <option value="Đang giao hàng">
                  Đang giao hàng ({statusCounts["Đang giao hàng"] || 0})
                </option>
                <option value="Đã giao">Đã giao ({statusCounts["Đã giao"] || 0})</option>
                <option value="Đã huỷ">Đã huỷ ({statusCounts["Đã huỷ"] || 0})</option>
              </select>
            </div>

            {/* Quick Stats */}
            <div style={styles.statsRow}>
              <div style={{ ...styles.statCard, backgroundColor: "#e0f7fa" }}>
                <span style={styles.statIcon}>📦</span>
                <div>
                  <div style={styles.statLabel}>Tổng đơn</div>
                  <div style={styles.statValue}>{totalOrders}</div>
                </div>
              </div>

              <div style={{ ...styles.statCard, backgroundColor: "#fff3e0" }}>
                <span style={styles.statIcon}>💰</span>
                <div>
                  <div style={styles.statLabel}>Doanh thu</div>
                  <div style={styles.statValue}>{totalRevenue.toLocaleString()} VND</div>
                </div>
              </div>

              <div style={{ ...styles.statCard, backgroundColor: "#e8f5e9" }}>
                <span style={styles.statIcon}>🚚</span>
                <div>
                  <div style={styles.statLabel}>Đang giao</div>
                  <div style={styles.statValue}>{totalShipping}</div>
                </div>
              </div>

              <div style={{ ...styles.statCard, backgroundColor: "#f3e5f5" }}>
                <span style={styles.statIcon}>⏳</span>
                <div>
                  <div style={styles.statLabel}>Chờ xác nhận</div>
                  <div style={styles.statValue}>{totalPending}</div>
                </div>
              </div>

              <div style={{ ...styles.statCard, backgroundColor: "#e8f5e9" }}>
                <span style={styles.statIcon}>✅</span>
                <div>
                  <div style={styles.statLabel}>Đã giao</div>
                  <div style={styles.statValue}>{totalDelivered}</div>
                </div>
              </div>

              <div style={{ ...styles.statCard, backgroundColor: "#ffebee" }}>
                <span style={styles.statIcon}>❌</span>
                <div>
                  <div style={styles.statLabel}>Huỷ</div>
                  <div style={styles.statValue}>{totalCancelled}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>SĐT</th>
                  <th>Địa chỉ</th>
                  <th>Ngày</th>
                  <th>Thanh toán</th>
                  <th>Tổng</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    style={styles.tableRow}
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowDetailDialog(true);
                    }}
                  >
                    <td>{order._id}</td>
                    <td>{order.customerName}</td>
                    <td>{order.customerPhone}</td>
                    <td>{order.customerAddress}</td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                    <td>{order.paymentMethod}</td>
                    <td style={{ fontWeight: "bold", color: "#1976d2" }}>
                      {order.total.toLocaleString()} VND
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        value={updatedStatuses[order._id] || order.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(order._id, e.target.value);
                        }}
                        style={{
                          ...styles.selectBox,
                          color: getStatusColor(order.status),
                          fontWeight: "bold",
                        }}
                      >
                        <option value="Chờ xác nhận">Chờ xác nhận</option>
                        <option value="Đã xác nhận">Đã xác nhận</option>
                        <option value="Đang giao hàng">Đang giao hàng</option>
                        <option value="Đã giao">Đã giao</option>
                        <option value="Đã huỷ">Đã huỷ</option>
                      </select>
                      {order.status === "Đã huỷ" && order.cancelNote && (
                        <div style={{ color: "#d32f2f", fontSize: 12 }}>
                          Lý do: {order.cancelNote}
                        </div>
                      )}
                    </td>
                    <td>
                      {order.status !== "Đã giao" &&
                        order.status !== "Đã huỷ" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatusHandler(order._id);
                            }}
                            style={styles.btnPrimary}
                          >
                            ✔ Cập nhật
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- Modal Xem chi tiết --- */}
      {showDetailDialog && selectedOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            overflowY: "auto",
            padding: "20px",
          }}
          onClick={() => setShowDetailDialog(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "16px",
              width: "90%",
              maxWidth: "1000px",
              padding: "24px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "16px", color: "#1976d2" }}>
              Chi tiết đơn hàng: {selectedOrder._id}
            </h2>

            {/* Thông tin khách hàng */}
            <div
              style={{
                backgroundColor: "#f3f4f6",
                borderRadius: "10px",
                padding: "16px",
              }}
            >
              <h3 style={{ marginBottom: "12px", color: "#444" }}>Thông tin đơn hàng</h3>
              <p><strong>Khách hàng:</strong> {selectedOrder.customerName}</p>
              <p><strong>SĐT:</strong> {selectedOrder.customerPhone}</p>
              <p><strong>Địa chỉ:</strong> {selectedOrder.customerAddress}</p>
              <p><strong>Ngày đặt:</strong> {new Date(selectedOrder.date).toLocaleString()}</p>
              <p><strong>Thanh toán:</strong> {selectedOrder.paymentMethod}</p>
              <p>
                <strong>Trạng thái:</strong>{" "}
                <span style={{ color: getStatusColor(selectedOrder.status), fontWeight: "bold" }}>
                  {selectedOrder.status}
                </span>
              </p>
              {selectedOrder.status === "Đã huỷ" && selectedOrder.cancelNote && (
                <p style={{ color: "#d32f2f" }}>Lý do huỷ: {selectedOrder.cancelNote}</p>
              )}
              <p>
                <strong>Lời nhắn:</strong>
                {selectedOrder.notes && selectedOrder.notes.length > 0 ? (
                  <ul style={{ paddingLeft: "16px", margin: "4px 0" }}>
                    {selectedOrder.notes.map((note) => (
                      <li key={note._id}>
                        [{new Date(note.date).toLocaleString()} - {note.type}] {note.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "Không có"
                )}
              </p>
            </div>

            {/* Danh sách sản phẩm */}
            <div
              style={{
                maxHeight: "350px",
                overflowY: "auto",
                border: "1px solid #ddd",
                borderRadius: "10px",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#e0f7fa" }}>
                  <tr>
                    <th>Ảnh</th>
                    <th>Sản phẩm</th>
                    <th>Màu sắc</th>
                    <th>Size</th>
                    <th>Số lượng</th>
                    <th>Giá</th>
                    <th>Thành tiền</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                      <td>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: 50, height: 50, objectFit: "cover", borderRadius: "4px" }}
                        />
                      </td>
                      <td>{item.name}</td>
                      <td>{item.color}</td>
                      <td>{item.size}</td>
                      <td>{item.quantity}</td>
                      <td>{item.price.toLocaleString()} VND</td>
                      <td>{item.subtotal.toLocaleString()} VND</td>
                      <td>{new Date(item.date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tổng tiền */}
            <div style={{ textAlign: "right", fontWeight: "bold", fontSize: "18px", marginTop: "8px" }}>
              Tổng: {selectedOrder.total.toLocaleString()} VND
            </div>

            <button
              style={{
                padding: "10px 20px",
                backgroundColor: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                alignSelf: "flex-end",
                marginTop: "12px",
              }}
              onClick={() => setShowDetailDialog(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* --- Modal Huỷ đơn --- */}
      {showCancelDialog && (
        <div style={styles.modalOverlay} onClick={() => setShowCancelDialog(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Huỷ đơn hàng {cancelOrderId}</h3>
            <textarea
              placeholder="Nhập lý do huỷ..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ width: "100%", padding: "8px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #ddd" }}
            />
            <div style={{ textAlign: "right" }}>
              <button
                style={{ ...styles.btnPrimary, marginRight: "8px", backgroundColor: "#616161" }}
                onClick={() => setShowCancelDialog(false)}
              >
                Hủy
              </button>
              <button
                style={styles.btnPrimary}
                onClick={confirmCancelOrder}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { fontFamily: "Arial, sans-serif", boxSizing: "border-box", minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f3f4f6" },
  header: { backgroundColor: "white", borderBottom: "1px solid #e2e8f0", padding: "0 24px", height: "70px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  headerContent: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" },
  headerTitle: { fontSize: "20px", fontWeight: "600", color: "#1a202c", margin: 0 },
  headerActions: { display: "flex", alignItems: "center", gap: "12px" },
  adminAvatar: { width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" },
  adminInfo: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", backgroundColor: "#f1f5f9", borderRadius: "8px" },
  adminName: { fontSize: "14px", fontWeight: "500", color: "#1a202c" },
  logoutButton: { padding: "8px 14px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" },
  mainLayout: { display: "flex", minHeight: "calc(100vh - 70px)" },
  sidebar: { width: "240px", backgroundColor: "white", borderRight: "1px solid #e2e8f0", padding: "24px 0" },
  sidebarHeader: { padding: "0 24px 24px", borderBottom: "1px solid #e2e8f0", marginBottom: "24px" },
  logo: { fontSize: "32px", marginBottom: "8px", lineHeight: 1 },
  sidebarTitle: { fontSize: "18px", fontWeight: 600, color: "#1a202c", margin: 0 },
  nav: { padding: "0 16px" },
  navItem: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", textDecoration: "none", color: "#64748b", borderRadius: "8px", marginBottom: "4px", transition: "all 0.2s", fontSize: "14px", fontWeight: 500 },
  mainContent: { flex: 1, backgroundColor: "#f9fafb", padding: "24px", overflowY: "auto" },
  filterBox: { backgroundColor: "#fff", padding: "16px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "16px" },
  filterRow: { display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" },
  searchInput: { flex: 1, border: "1px solid #ddd", padding: "8px 12px", borderRadius: "8px" },
  selectBox: { border: "1px solid #ddd", padding: "8px 12px", borderRadius: "8px" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "20px" },
  statCard: { display: "flex", alignItems: "center", padding: "16px", borderRadius: "12px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", fontSize: "14px", fontWeight: "500" },
  statIcon: { fontSize: "28px", marginRight: "12px" },
  statLabel: { fontSize: "14px", color: "#555" },
  statValue: { fontSize: "18px", fontWeight: "bold", color: "#111" },
  tableContainer: { backgroundColor: "#fff", borderRadius: "10px", overflow: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { backgroundColor: "#f3f4f6" },
  tableRow: { borderBottom: "1px solid #eee", cursor: "pointer" },
  btnPrimary: { padding: "6px 12px", background: "#1976d2", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", width: "90%", maxWidth: "600px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", maxHeight: "80vh", overflowY: "auto" },
};

export default Ordermanagement;
