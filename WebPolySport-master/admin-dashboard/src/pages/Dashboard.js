import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { fetchProducts, addProduct } from '../features/product/productSlice';
import { getAdminUser, removeAdminUser } from '../utils/auth';
import { LOADING_MESSAGES, ERROR_MESSAGES } from '../utils/constants';

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, status } = useSelector(state => state.product);

  const [adminUser, setAdminUser] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState('');
  const [extraImagesFiles, setExtraImagesFiles] = useState([]);
  const [previewExtraImages, setPreviewExtraImages] = useState([]);

  const totalProducts = items.length;
  const inStockProducts = items.filter(p => p.status === 'còn hàng').length;
  const outOfStockProducts = items.filter(p => p.status === 'hết hàng').length;


  useEffect(() => {
    dispatch(fetchProducts());
    const adminData = getAdminUser();
    if (adminData) {
      setAdminUser(adminData);
    }
  }, [dispatch]);

  const handleLogout = () => {
    removeAdminUser();
    navigate('/login');
  };

  const handleVariantChange = (index, key, value) => {
    const newVariants = [...editData.variants];
    newVariants[index][key] = value;
    setEditData({ ...editData, variants: newVariants });
  };

  const handleOpenAdd = () => {
    setEditData({
      name: '',
      originalPrice: '',
      salePrice: 0,
      description: '',
      category: '',
      image: '',
      variants: [{ size: '', color: '', quantity: 0 }],
      status: 'còn hàng',
    });
    setPreviewImage('');
    setExtraImagesFiles([]);
    setPreviewExtraImages([]);
    setErrors({});
    setIsEditOpen(true);
  };

  const handleAddNewProduct = () => {
    if (!editData) return;

    const newErrors = {};
    if (!editData.category?.trim()) newErrors.category = "Vui lòng nhập loại sản phẩm";
    if (!editData.name?.trim()) newErrors.name = "Vui lòng nhập tên sản phẩm";
    if (!editData.originalPrice || Number(editData.originalPrice) <= 0) {
      newErrors.originalPrice = "Vui lòng nhập giá hợp lệ";
    }
    if (!editData.description?.trim()) newErrors.description = "Vui lòng nhập mô tả sản phẩm";
    if (!editData.imageFile) newErrors.image = "Vui lòng chọn hình ảnh";

    if (!editData.variants || editData.variants.length === 0 || editData.variants.some(v => !v.size?.trim() || !v.color?.trim() || v.quantity <= 0)) {
      newErrors.variants = "Vui lòng nhập đầy đủ thông tin (size, màu, số lượng)";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const formData = new FormData();
    formData.append("name", editData.name);
    formData.append("category", editData.category);
    formData.append("originalPrice", String(Number(editData.originalPrice)));
    formData.append("salePrice", String(Number(editData.salePrice ?? 0)));
    formData.append("description", editData.description);
    formData.append("status", editData.status);
    formData.append("image", editData.imageFile);
    formData.append("variants", JSON.stringify(editData.variants));

    // nhiều ảnh phụ
    if (extraImagesFiles.length > 0) {
      extraImagesFiles.forEach(file => {
        formData.append("extraImages", file);
      });
    }

    dispatch(addProduct(formData))
      .unwrap()
      .then(res => {
        console.log("Thêm sản phẩm thành công:", res);
        setIsEditOpen(false);
        setEditData(null);
        setPreviewImage(null);
        setExtraImagesFiles([]);
        setPreviewExtraImages([]);
        setErrors({});
      })
      .catch(err => {
        console.error("Thêm sản phẩm thất bại:", err);
        alert("Thêm sản phẩm thất bại: " + err);
      });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditData(prev => ({ ...prev, imageFile: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleExtraImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    // Nối thêm vào danh sách cũ thay vì ghi đè
    setExtraImagesFiles(prev => [...prev, ...files]);

    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewExtraImages(prev => [...prev, ...previews]);
  };


  const renderPrice = (product) => {
    if (product.salePrice && product.salePrice > 0) {
      return (
        <>
          <span style={{ textDecoration: 'line-through', color: '#888', marginRight: 8 }}>
            {Number(product.originalPrice).toLocaleString()} VNĐ
          </span>
          <span style={{ color: 'red', fontWeight: 'bold' }}>
            {Number(product.salePrice).toLocaleString()} VNĐ
          </span>
        </>
      );
    }
    return (
      <span style={{ fontWeight: 'bold' }}>
        {Number(product.originalPrice).toLocaleString()} VNĐ
      </span>
    );
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
                src={adminUser?.avatar || 'https://via.placeholder.com/32'}
                alt="Admin"
                style={styles.adminAvatar}
              />
              <span style={styles.adminName}>{adminUser?.name || 'Admin'}</span>
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
            <Link to="/Dashboard" style={styles.navItem}>📦 Quản lý Sản phẩm</Link>
            <Link to="/orders" style={styles.navItem}>🛒 Quản lý Đơn hàng</Link>
            <Link to="/users" style={styles.navItem}>👥 Quản lý tài khoản</Link>
            <Link to="/revenue" style={styles.navItem}>📈 Quản lý Thống kê</Link>
            <Link to="/banners" style={styles.navItem}>⚙️ Quản lý banner</Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.content}>
          <div style={styles.contentHeader}>
            <h2 style={styles.contentTitle}>Danh sách sản phẩm</h2>

            <button style={styles.addButton} onClick={handleOpenAdd} >
              <span style={styles.addIcon}>+</span> Thêm sản phẩm
            </button>

            {isEditOpen && editData && (
              <div style={styles.modal}>
                <div style={styles.modalContent}>
                  <h3 style={{ marginBottom: 16 }}>Thêm sản phẩm mới</h3>

                  <label>Loại sản phẩm:</label>
                  <input type="text" value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value })} style={styles.input} />
                  {errors.category && <span style={{ color: "red", fontSize: 12 }}>{errors.category}</span>}

                  <label>Tên sản phẩm:</label>
                  <input type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} style={styles.input} />
                  {errors.name && <span style={{ color: "red", fontSize: 12 }}>{errors.name}</span>}

                  <label>Giá gốc:</label>
                  <input
                    type="number"
                    value={editData.originalPrice}
                    onChange={e =>
                      setEditData({ ...editData, originalPrice: e.target.value })
                    }
                    style={styles.input}
                  />
                  {errors.originalPrice && <span style={{ color: "red", fontSize: 12 }}>{errors.originalPrice}</span>}

                  <label>Mô tả:</label>
                  <textarea value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} style={styles.textarea} />
                  {errors.description && <span style={{ color: "red", fontSize: 12 }}>{errors.description}</span>}

                  <label>Trạng thái:</label>
                  <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })} style={styles.input}>
                    <option value="còn hàng">Còn hàng</option>
                    <option value="hết hàng">Hết hàng</option>
                  </select>

                  <label>Chọn hình ảnh chính:</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                  {previewImage && <img src={previewImage} alt="Preview" style={{ width: 150, height: 150, objectFit: 'cover', marginTop: 10, borderRadius: 8 }} />}
                  {errors.image && <span style={{ color: "red", fontSize: 12 }}>{errors.image}</span>}

                  <label>Chọn ảnh phụ (có thể chọn nhiều):</label>
                  <input type="file" accept="image/*" multiple onChange={handleExtraImagesUpload} />
                  {previewExtraImages.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                      {previewExtraImages.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt={`Extra ${idx}`}
                          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }}
                        />
                      ))}
                    </div>
                  )}

                  <h4 style={{ marginTop: 20 }}>Thông số:</h4>
                  <div style={styles.variantList}>
                    {editData.variants.map((v, i) => (
                      <div key={i} style={styles.variantCard}>
                        <input type="text" placeholder="Size" value={v.size} onChange={e => handleVariantChange(i, 'size', e.target.value)} style={styles.variantInput} />
                        <input type="text" placeholder="Màu" value={v.color} onChange={e => handleVariantChange(i, 'color', e.target.value)} style={styles.variantInput} />
                        <input type="number" placeholder="Số lượng" value={v.quantity} onChange={e => handleVariantChange(i, 'quantity', +e.target.value)} style={styles.variantInput} />
                        <button onClick={() => setEditData({ ...editData, variants: editData.variants.filter((_, idx) => idx !== i) })} style={{ backgroundColor: '#f44336', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}>Xoá</button>
                      </div>
                    ))}
                  </div>
                  {errors.variants && <span style={{ color: "red", fontSize: 12 }}>{errors.variants}</span>}
                  <button onClick={() => setEditData({ ...editData, variants: [...editData.variants, { size: '', color: '', quantity: 0 }] })} style={{ marginTop: 10, marginBottom: 20, padding: '8px 12px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>Thêm thông số</button>

                  <div style={styles.modalButtons}>
                    <button onClick={handleAddNewProduct} style={styles.saveButton}>Thêm</button>
                    <button onClick={() => setIsEditOpen(false)} style={styles.cancelButton}>Hủy</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Products */}
          <div style={styles.productsSection}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Sản phẩm nổi bật</h3>
            </div>

            {/* Thống kê sản phẩm */}
            <div style={{
              display: 'flex',
              gap: 20,
              marginBottom: 20,
              flexWrap: 'wrap'
            }}>
              <div style={{
                padding: 16,
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                minWidth: 150,
                textAlign: 'center'
              }}>
                <h4 style={{ margin: 0 }}>Tổng sản phẩm</h4>
                <p style={{ fontSize: 18, fontWeight: 'bold', margin: '6px 0' }}>{totalProducts}</p>
              </div>

              <div style={{
                padding: 16,
                backgroundColor: '#e8f5e9',
                borderRadius: 8,
                minWidth: 150,
                textAlign: 'center'
              }}>
                <h4 style={{ margin: 0 }}>Còn hàng</h4>
                <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4CAF50', margin: '6px 0' }}>{inStockProducts}</p>
              </div>

              <div style={{
                padding: 16,
                backgroundColor: '#ffebee',
                borderRadius: 8,
                minWidth: 150,
                textAlign: 'center'
              }}>
                <h4 style={{ margin: 0 }}>Hết hàng</h4>
                <p style={{ fontSize: 18, fontWeight: 'bold', color: '#f44336', margin: '6px 0' }}>{outOfStockProducts}</p>
              </div>
            </div>

            <div style={styles.productList}>
              {status === 'loading' && <p>{LOADING_MESSAGES.PRODUCTS}</p>}
              {status === 'failed' && <p>{ERROR_MESSAGES.PRODUCTS_LOAD_ERROR}</p>}

              {status === 'succeeded' && (
                <>
                  {/* còn hàng */}
                  <div style={styles.productsGrid}>
                    {items.filter(p => p.status === 'còn hàng').map(product => (
                      <div key={product._id} style={styles.productCard}>
                        <div style={styles.productImageContainer}>
                          <img src={product.image || '/placeholder.png'} alt={product.name} style={styles.productImage} />
                          {/* Hiển thị ảnh phụ */}
                          {product.extraImages && product.extraImages.length > 0 && (
                            <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                              {product.extraImages.map((img, idx) => (
                                <img key={idx} src={img} alt={`Extra ${idx}`} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={styles.productInfo}>
                          <h4 style={styles.productName}>{product.name}</h4>
                          <p style={{ ...styles.productDescription, ...styles.clampDescription }}>
                            {product.description || 'Mô tả sản phẩm...'}
                          </p>
                          <div style={styles.productMeta}>
                            {renderPrice(product)}
                            <p style={{ fontSize: 14, marginTop: 4, color: '#4CAF50' }}>Trạng thái: {product.status}</p>
                          </div>
                          <div style={styles.productActions}>
                            <button style={styles.actionButton} onClick={() => navigate(`/products/${product._id}`)}>
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* hết hàng */}
                  <h3 style={{ margin: '30px 0 10px', fontWeight: 'bold' }}>Sản phẩm hết hàng</h3>
                  <div style={styles.productsGrid}>
                    {items.filter(p => p.status === 'hết hàng').map(product => (
                      <div key={product._id} style={styles.productCard}>
                        <div style={styles.productImageContainer}>
                          <img src={product.image || '/placeholder.png'} alt={product.name} style={styles.productImage} />
                          {product.extraImages && product.extraImages.length > 0 && (
                            <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                              {product.extraImages.map((img, idx) => (
                                <img key={idx} src={img} alt={`Extra ${idx}`} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={styles.productInfo}>
                          <h4 style={styles.productName}>{product.name}</h4>
                          <p style={{ ...styles.productDescription, ...styles.clampDescription }}>
                            {product.description || 'Mô tả sản phẩm...'}
                          </p>
                          <div style={styles.productMeta}>
                            {renderPrice(product)}
                            <p style={{ fontSize: 14, marginTop: 4, color: '#f44336' }}>Trạng thái: {product.status}</p>
                          </div>
                          <div style={styles.productActions}>
                            <button style={styles.actionButton} onClick={() => navigate(`/products/${product._id}`)}>
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  variantList: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 },
  variantCard: { border: '1px solid #ccc', padding: 10, borderRadius: 8, backgroundColor: '#f4f6f8', minWidth: 140, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: 6 },

  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  variantRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
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
    className: 'header-button',
  },
  buttonIcon: {
    fontSize: '16px',
  },
  mainLayout: {
    display: 'flex',
    minHeight: 'calc(100vh - 70px)',
  },
  sidebar: {
    width: '280px',
    backgroundColor: 'white',
    borderRight: '1px solid #e2e8f0',
    padding: '24px 0',
    boxSizing: 'border-box',
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
    marginBottom: '4px',
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
    padding: '32px',
    overflowY: 'auto',
  },
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  contentTitle: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1a202c',
    margin: 0,
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    className: 'add-button',
  },
  addIcon: {
    fontSize: '18px',
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'all 0.2s',
    className: 'stat-card',
  },
  statIcon: {
    fontSize: '32px',
    padding: '12px',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a202c',
    margin: '0 0 4px 0',
  },
  statLabel: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  productsSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1a202c',
    margin: 0,
  },
  viewOptions: {
    display: 'flex',
    gap: '8px',
  },
  viewButton: {
    padding: '8px 16px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    className: 'view-button',
  },
  productList: {
    minHeight: '200px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: '#64748b',
    fontSize: '14px',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '16px',
    marginBottom: '16px',
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  productCard: {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'all 0.2s',
    cursor: 'pointer',
    className: 'product-card',
  },
  productImageContainer: {
    position: 'relative',
    height: '200px',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.2s',
    className: 'product-image',
  },
  productOverlay: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    display: 'flex',
    gap: '8px',
    opacity: 0,
    transition: 'opacity 0.2s',
    className: 'product-overlay',
  },
  quickAction: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.9)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    className: 'quick-action',
  },
  productInfo: {
    padding: '16px',
  },
  productName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a202c',
    margin: '0 0 8px 0',
  },
  productDescription: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 12px 0',
    lineHeight: '1.5',
  },
  productMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  productPrice: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#059669',
  },
  productStock: {
    fontSize: '12px',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  productActions: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
    className: 'action-button',
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
  clampDescription: {
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minHeight: '60px',
    maxHeight: '60px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: 'white',
    borderRadius: 12,
    padding: 32,
    minWidth: 320,
    maxWidth: 500,
    boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: 8,
    right: 12,
    fontSize: 24,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // overlay mờ
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    maxWidth: '650px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    animation: 'fadeIn 0.3s ease',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    marginBottom: '12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '16px',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    height: '80px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '16px',
    resize: 'vertical',
    marginBottom: '12px',
  },
  variantRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 10,
  },
  variantInput: { flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc', marginBottom: 4 },

  modalButtons: {
    marginTop: 20,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
  },
  saveButton: {
    padding: '10px 16px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: '10px 16px',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};

export default Dashboard; 