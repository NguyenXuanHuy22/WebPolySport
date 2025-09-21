import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceDot,
} from "recharts";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { getAdminUser, removeAdminUser } from "../utils/auth";
import autoTable from "jspdf-autotable";



export default function RevenueManagement() {
  const navigate = useNavigate();
  const adminUser = getAdminUser();
  const [data, setData] = useState([]);
  const [compareData, setCompareData] = useState([]);
  const [from, setFrom] = useState("2025-08-01");
  const [to, setTo] = useState("2025-08-31");
  const [granularity, setGranularity] = useState("day");
  const [paymentFilter, setPaymentFilter] = useState("all"); // all, online, cod
  const [topProducts, setTopProducts] = useState([]);
  const [topUsers, setTopUsers] = useState([]);

  // 👉 Thêm state tổng
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  // 👉 Thêm state cho error handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.defaults.baseURL = "http://localhost:5000";
    
    // Debounce để tránh gọi API quá nhiều lần
    const timeoutId = setTimeout(() => {
      fetchRevenue();
      fetchTopProducts();
      fetchTopUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [from, to, granularity, paymentFilter]);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      setError(null);

      // dữ liệu hiện tại
      const res = await axios.get("/api/stats/revenue", {
        params: { 
          from, 
          to, 
          granularity,
          paymentMethod: paymentFilter === "all" ? "" : paymentFilter
        },
      });

      // dữ liệu năm trước
      const lastYearFrom = dayjs(from).subtract(1, "year").format("YYYY-MM-DD");
      const lastYearTo = dayjs(to).subtract(1, "year").format("YYYY-MM-DD");
      const resCompare = await axios.get("/api/stats/revenue", {
        params: { 
          from: lastYearFrom, 
          to: lastYearTo, 
          granularity,
          paymentMethod: paymentFilter === "all" ? "" : paymentFilter
        },
      });

      const filledData = fillData(res.data, from, to, granularity);
      const filledCompare = fillData(resCompare.data, lastYearFrom, lastYearTo, granularity);

      setData(filledData);
      setCompareData(filledCompare);

      // 👉 Tính tổng doanh thu và số đơn
      setTotalRevenue(filledData.reduce((sum, d) => sum + d.revenue, 0));
      setTotalOrders(filledData.reduce((sum, d) => sum + d.orders, 0));
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      setError(error.response?.data?.message || "Có lỗi xảy ra khi tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  };

  const fillData = (apiData, from, to, granularity) => {
    const apiDataMap = {};
    apiData.forEach((item) => {
      let dateKey;
      if (typeof item._id === "string") {
        dateKey = dayjs(item._id).format(
          granularity === "day" ? "YYYY-MM-DD" : granularity === "month" ? "YYYY-MM" : "YYYY"
        );
      } else {
        const { year, month, day } = item._id;
        dateKey = dayjs(`${year}-${month || 1}-${day || 1}`).format(
          granularity === "day" ? "YYYY-MM-DD" : granularity === "month" ? "YYYY-MM" : "YYYY"
        );
      }
      apiDataMap[dateKey] = { revenue: item.totalRevenue, orders: item.orderCount };
    });

    let current = dayjs(from);
    const end = dayjs(to);
    const filledData = [];

    while (current.isBefore(end) || current.isSame(end)) {
      const key = current.format(
        granularity === "day" ? "YYYY-MM-DD" : granularity === "month" ? "YYYY-MM" : "YYYY"
      );
      filledData.push({
        date:
          granularity === "day"
            ? current.format("DD/MM")
            : granularity === "month"
              ? current.format("MM/YYYY")
              : current.format("YYYY"),
        revenue: apiDataMap[key]?.revenue || 0,
        orders: apiDataMap[key]?.orders || 0,
      });
      current = current.add(1, granularity === "day" ? "day" : granularity === "month" ? "month" : "year");
    }
    return filledData;
  };

  const fetchTopProducts = async () => {
    try {
      const res = await axios.get("/api/stats/top-products", { 
        params: { 
          from, 
          to,
          paymentMethod: paymentFilter === "all" ? "" : paymentFilter
        } 
      });
      setTopProducts(res.data);
    } catch (err) {
      console.error("Lỗi tải top sản phẩm:", err);
      // Không set error cho top products vì không critical
    }
  };

  const fetchTopUsers = async () => {
    try {
      const res = await axios.get("/api/stats/top-users", { 
        params: { 
          from, 
          to,
          paymentMethod: paymentFilter === "all" ? "" : paymentFilter
        } 
      });
      setTopUsers(res.data);
    } catch (err) {
      console.error("Lỗi tải top khách hàng:", err);
      // Không set error cho top users vì không critical
    }
  };

  // Export Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Doanh thu");
    XLSX.writeFile(wb, "revenue.xlsx");
  };

  // Export PDF
  const exportToPDF = () => {
  const doc = new jsPDF();

  // Tiêu đề báo cáo
  doc.setFontSize(16);
  doc.text("Báo cáo doanh thu", 14, 15);

  // Chuẩn bị dữ liệu
  const tableColumn = ["Thời gian", "Doanh thu (VND)", "Số đơn"];
  const tableRows = data.map((row) => [
    row.date,
    row.revenue.toLocaleString("vi-VN"), // format số
    row.orders,
  ]);

  // Vẽ bảng bằng autoTable
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 25, // cách tiêu đề 1 chút
    styles: { fontSize: 10 },
    headStyles: { fillColor: [211, 47, 47] }, // màu header đỏ nhạt
  });

  // Xuất file
  doc.save("revenue.pdf");
};

  const maxRevenue = Math.max(...data.map((d) => d.revenue));
  const minRevenue = Math.min(...data.map((d) => d.revenue));

  const handleLogout = () => {
    removeAdminUser();
    navigate("/login");
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

      {/* Layout */}
      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.logo}>🏪</div>
            <h2 style={styles.sidebarTitle}>Quản lý</h2>
          </div>
          <nav style={styles.nav}>
            <Link to="/Dashboard" style={styles.navItem}>
              <span style={styles.navIcon}>📦</span> Quản lý Sản phẩm
            </Link>
            <Link to="/orders" style={styles.navItem}>
              <span style={styles.navIcon}>🛒</span> Quản lý Đơn hàng
            </Link>
            <Link to="/users" style={styles.navItem}>
              <span style={styles.navIcon}>👥</span> Quản lý tài khoản
            </Link>
            <Link to="/revenue" style={styles.navItem}>
              <span style={styles.navIcon}>📈</span> Quản lý Thống kê
            </Link>
            <Link to="/banners" style={styles.navItem}>
              <span style={styles.navIcon}>⚙️</span> Quản lý banner
            </Link>
          </nav>
        </aside>

        {/* Content */}
        <main style={styles.content}>
          <div style={styles.contentHeader}>
            <h2 style={styles.contentTitle}>📊 Thống kê doanh thu</h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              <select value={granularity} onChange={(e) => setGranularity(e.target.value)}>
                <option value="day">Theo ngày</option>
                <option value="month">Theo tháng</option>
                <option value="year">Theo năm</option>
              </select>
              
              {/* 👉 MỚI - Menu chọn loại thanh toán */}
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <label style={{ fontSize: "14px", fontWeight: "500" }}>Loại thanh toán:</label>
                <select 
                  value={paymentFilter} 
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    backgroundColor: "white",
                    fontSize: "14px"
                  }}
                >
                  <option value="all">📊 Tổng hợp</option>
                  <option value="zalopay">💳 Thanh toán Online</option>
                  <option value="cod">💰 COD</option>
                </select>
              </div>

              <button onClick={exportToExcel}>Xuất Excel</button>
              <button onClick={exportToPDF}>Xuất PDF</button>
              <button onClick={() => window.print()}>In nhanh</button>
            </div>
          </div>

          {/* 👉 Hiển thị error message */}
          {error && (
            <div style={{
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "8px",
              padding: "12px",
              margin: "20px 0",
              color: "#c33"
            }}>
              <strong>Lỗi:</strong> {error}
              <button 
                onClick={() => {
                  setError(null);
                  fetchRevenue();
                }}
                style={{
                  marginLeft: "10px",
                  padding: "4px 8px",
                  backgroundColor: "#c33",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Thử lại
              </button>
            </div>
          )}

          {/* 👉 Loading indicator */}
          {loading && (
            <div style={{
              textAlign: "center",
              padding: "20px",
              color: "#666"
            }}>
              Đang tải dữ liệu thống kê...
            </div>
          )}

          {/* 👉 Hiển thị loại thống kê đang xem */}
          <div style={{
            backgroundColor: "#f0f8ff",
            border: "1px solid #b3d9ff",
            borderRadius: "8px",
            padding: "12px",
            margin: "20px 0",
            textAlign: "center"
          }}>
            <h3 style={{ margin: 0, color: "#0066cc" }}>
              {paymentFilter === "all" && "📊 Thống kê tổng hợp (Tất cả phương thức thanh toán)"}
              {paymentFilter === "zalopay" && "💳 Thống kê thanh toán Online (ZaloPay)"}
              {paymentFilter === "cod" && "💰 Thống kê thanh toán COD (Thanh toán khi nhận hàng)"}
            </h3>
          </div>

          {/* 👉 Hiển thị tổng doanh thu và số đơn */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              margin: "20px 0",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: "220px",
                backgroundColor: "#f8f9fa",
                padding: "15px",
                borderRadius: "10px",
                textAlign: "center",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                border: "1px solid #e0e0e0",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", color: "#007bff" }}>🧾 Tổng doanh thu</h3>
              <p style={{ margin: "8px 0 0", fontSize: "22px", fontWeight: "bold", color: "#28a745" }}>
                {new Intl.NumberFormat("vi-VN").format(totalRevenue)} VNĐ
              </p>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: "220px",
                backgroundColor: "#f8f9fa",
                padding: "15px",
                borderRadius: "10px",
                textAlign: "center",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                border: "1px solid #e0e0e0",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", color: "#17a2b8" }}>📦 Tổng số đơn</h3>
              <p style={{ margin: "8px 0 0", fontSize: "22px", fontWeight: "bold", color: "#007bff" }}>
                {totalOrders} đơn
              </p>
            </div>
          </div>

          {/* Biểu đồ */}
          <div style={{ width: "100%", height: 400, marginBottom: 30 }}>
            <ResponsiveContainer>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#82ca9d" name="Số đơn" />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Doanh thu" />
                {compareData.length > 0 && (
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    data={compareData}
                    stroke="#ff9800"
                    name="Doanh thu năm trước"
                  />
                )}
                {data.map((d, i) =>
                  d.revenue === maxRevenue ? (
                    <ReferenceDot key={i} x={d.date} y={d.revenue} r={6} fill="red" stroke="none" />
                  ) : d.revenue === minRevenue ? (
                    <ReferenceDot key={i} x={d.date} y={d.revenue} r={6} fill="blue" stroke="none" />
                  ) : null
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Bảng */}
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Thời gian</th>
                  <th style={styles.th}>Doanh thu</th>
                  <th style={styles.th}>Số đơn</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} style={styles.tr}>
                    <td style={styles.td}>{row.date}</td>
                    <td style={styles.td}>
                      {new Intl.NumberFormat("vi-VN").format(row.revenue)} VNĐ
                    </td>
                    <td style={styles.td}>{row.orders} đơn</td>
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

const styles = {
  container: { fontFamily: "Arial, sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" },
  header: { background: "white", borderBottom: "1px solid #e2e8f0", padding: "0 24px", height: "70px", display: "flex", alignItems: "center" },
  headerContent: { display: "flex", justifyContent: "space-between", width: "100%" },
  headerTitle: { fontSize: "24px", fontWeight: "600" },
  headerActions: { display: "flex", alignItems: "center", gap: "12px" },
  adminInfo: { display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#f1f5f9", padding: "8px 12px", borderRadius: "8px" },
  adminAvatar: { width: "32px", height: "32px", borderRadius: "50%" },
  adminName: { fontSize: "14px", fontWeight: "500" },
  logoutButton: { padding: "8px 16px", border: "1px solid #ef4444", backgroundColor: "#ef4444", color: "white", borderRadius: "8px" },
  layout: { display: "flex", flex: 1, backgroundColor: "#f9fafb" },
  sidebar: { width: "280px", background: "white", borderRight: "1px solid #e2e8f0", padding: "24px 0" },
  sidebarHeader: { padding: "0 24px 24px", borderBottom: "1px solid #e2e8f0" },
  logo: { fontSize: "32px" },
  sidebarTitle: { fontSize: "18px", fontWeight: 600 },
  nav: { padding: "0 16px" },
  navItem: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", textDecoration: "none", color: "#64748b" },
  navIcon: { fontSize: "18px" },
  content: { flex: 1, background: "white", padding: 24 },
  contentHeader: { marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" },
  contentTitle: { fontSize: "22px", fontWeight: "600" },
  tableContainer: { overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 8, marginTop: 20 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { borderBottom: "2px solid #ddd", padding: "12px 16px", backgroundColor: "#f0f0f0" },
  tr: { borderBottom: "1px solid #ddd" },
  td: { padding: "12px 16px", fontSize: "14px" },
};
