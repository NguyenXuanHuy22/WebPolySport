import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { getAdminUser, removeAdminUser } from "../utils/auth";
import { fetchBanners, addBanner, deleteBanner } from "../features/banner/bannerSlice";

export default function BannerManagement() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const adminUser = getAdminUser();
    const { banners, status } = useSelector((state) => state.banner);


    const [previewImage, setPreviewImage] = useState("");
    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {
        dispatch(fetchBanners());
    }, [dispatch]);

    const handleLogout = () => {
        removeAdminUser();
        navigate("/login");
    };

    // Chọn file -> convert sang base64
    const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result); // base64 string
    };
    reader.readAsDataURL(file);
  }
};

const handleUpload = async () => {
  if (!previewImage) {
    alert("Vui lòng chọn ảnh!");
    return;
  }
  try {
    await dispatch(addBanner({ image: previewImage })).unwrap();
    setShowDialog(false);
    setPreviewImage(""); // reset lại
  } catch (err) {
    console.error("Lỗi khi thêm banner:", err);
    alert("Thêm banner thất bại!");
  }
};

    const handleDelete = async (id) => {
        if (window.confirm("Xóa banner này?")) {
            try {
                await dispatch(deleteBanner(id)).unwrap();
                dispatch(fetchBanners());
            } catch (err) {
                console.error("Lỗi khi xóa banner:", err);
            }
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
                            📦 Quản lý Sản phẩm
                        </Link>
                        <Link to="/orders" style={styles.navItem}>
                            🛒 Quản lý Đơn hàng
                        </Link>
                        <Link to="/users" style={styles.navItem}>
                            👥 Quản lý tài khoản
                        </Link>
                        <Link to="/revenue" style={styles.navItem}>
                            📈 Quản lý Thống kê
                        </Link>
                        <Link to="/banners" style={styles.navItem}>
                            ⚙️ Quản lý banner
                        </Link>
                    </nav>
                </aside>

                {/* Main content */}
                <main style={styles.content}>
                    <div style={styles.contentHeader}>
                        <h2 style={styles.contentTitle}>Quản lý Banner</h2>
                    </div>

                    {/* Nút thêm banner */}
                    <button
                        style={{
                            backgroundColor: "#3b82f6",
                            color: "white",
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            marginBottom: 20,
                        }}
                        onClick={() => setShowDialog(true)}
                    >
                        Thêm Banner
                    </button>

                    {/* Banner list */}
                    <h3>Danh sách Banner</h3>
                    {status === "loading" && <p>Đang tải...</p>}
                    {status === "failed" && <p style={{ color: "red" }}>Lỗi khi tải banner</p>}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                            gap: 20,
                        }}
                    >
                        {banners.map((banner) => (
                            <div
                                key={banner._id}
                                style={{
                                    position: "relative",
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                                    transition: "transform 0.2s, box-shadow 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "scale(1.03)";
                                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                                }}
                            >
                                <img
                                    src={banner.image} // lấy trực tiếp base64
                                    alt="banner"
                                    style={{
                                        width: "100%",
                                        height: 180,
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                                <button
                                    onClick={() => handleDelete(banner._id)}
                                    style={{
                                        position: "absolute",
                                        top: 10,
                                        right: 10,
                                        backgroundColor: "rgba(239,68,68,0.9)",
                                        color: "white",
                                        border: "none",
                                        padding: "6px 12px",
                                        borderRadius: 6,
                                        cursor: "pointer",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Xóa
                                </button>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* Dialog Thêm Banner */}
            {showDialog && (
                <div
                    style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                    }}
                >
                    <div style={{ backgroundColor: "white", padding: 20, borderRadius: 8, width: 400 }}>
                        <h2>Thêm Banner Mới</h2>
                        <input type="file" onChange={handleFileChange} />
                        {previewImage && (
                            <img src={previewImage} alt="Preview" style={{ width: "100%", marginTop: 10, borderRadius: 8 }} />
                        )}
                        <div style={{ marginTop: 15, display: "flex", gap: 10 }}>
                            <button onClick={handleUpload} style={{ backgroundColor: "green", color: "white", padding: "6px 12px", border: "none", borderRadius: 4 }}>
                                Lưu
                            </button>
                            <button onClick={() => setShowDialog(false)} style={{ backgroundColor: "gray", color: "white", padding: "6px 12px", border: "none", borderRadius: 4 }}>
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles ---

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
    headerButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s',
    },
    buttonIcon: {
        fontSize: '16px',
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
        className: 'logout-button',
    },
    layout: {
        display: 'flex',
        flex: 1,
        minHeight: 'calc(100vh - 70px)', // full height trừ header
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
    navItemHover: {
        backgroundColor: '#e2e8f0',
        color: '#1a202c',
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
    tableContainer: {
        overflowX: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
    },
    table: {
        width: '100%',
        minWidth: 800, // Đảm bảo bảng không quá nhỏ, có scroll ngang
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
    trHover: {
        backgroundColor: '#f9fafb',
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

    overlay: {
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999
    },
    dialog: {
        background: "#fff",
        padding: 20,
        borderRadius: 8,
        width: "400px",
        maxWidth: "90%",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        animation: "fadeIn 0.3s ease-in-out"
    },
    saveButton: {
        backgroundColor: "#3b82f6",
        color: "white",
        border: "none",
        padding: "8px 16px",
        borderRadius: 4,
        cursor: "pointer"
    },
    cancelButton: {
        backgroundColor: "#6b7280",
        color: "white",
        border: "none",
        padding: "8px 16px",
        borderRadius: 4,
        cursor: "pointer"
    }

};
