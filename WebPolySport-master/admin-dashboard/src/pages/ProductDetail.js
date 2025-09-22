import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductById,
  updateProductById,
  clearProductDetail,
} from "../features/product/productDetailSlice";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { product, loading } = useSelector(
    (state) => state.productDetail || {}
  );

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    category: "",
    originalPrice: 0,
    salePrice: 0,
    description: "",
    status: "còn hàng",
    variants: [],
    image: "",
    extraImages: [],
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [previewExtraImages, setPreviewExtraImages] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchProductById(id));
    return () => dispatch(clearProductDetail());
  }, [dispatch, id]);

  useEffect(() => {
    if (product) {
      setEditData({
        ...product,
        salePrice: product.salePrice ?? 0,
        extraImages: product.extraImages || [],
      });
      setPreviewImage(product.image);
      setPreviewExtraImages(product.extraImages || []);
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;

    const images = [product.image, ...(product.extraImages || [])].filter(Boolean);
    if (!images.length) return;

    let index = 0;

  }, [product]);

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = editData.variants.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    setEditData({ ...editData, variants: updatedVariants });
  };

  // Upload ảnh chính
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setPreviewImage(base64String);
      setEditData({ ...editData, image: base64String });
    };
    reader.readAsDataURL(file);
  };

  // Upload nhiều ảnh phụ
  const handleExtraImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setEditData((prev) => ({
          ...prev,
          extraImages: [...prev.extraImages, base64String],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!editData.name.trim()) newErrors.name = "Vui lòng nhập tên sản phẩm";
    if (!editData.category.trim())
      newErrors.category = "Vui lòng nhập loại sản phẩm";

    if (!editData.originalPrice || editData.originalPrice <= 0)
      newErrors.originalPrice = "Giá gốc không hợp lệ";

    if (editData.salePrice && editData.salePrice >= editData.originalPrice)
      newErrors.salePrice = "Giá giảm phải nhỏ hơn giá gốc";

    if (!editData.description.trim())
      newErrors.description = "Vui lòng nhập mô tả";

    if (!editData.variants.length)
      newErrors.variants = "Phải có ít nhất một biến thể";

    editData.variants.forEach((v) => {
      if (!v.size.trim() || !v.color.trim() || v.quantity <= 0) {
        newErrors.variants =
          "Vui lòng nhập đầy đủ biến thể (size, màu, số lượng > 0)";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = () => {
    if (!validateForm()) {
      alert("⚠️ Kiểm tra lại thông tin!");
      return;
    }

    dispatch(updateProductById({ id, updatedProduct: editData }))
      .unwrap()
      .then(() => {
        setIsEditOpen(false);
        dispatch(fetchProductById(id));
      })
      .catch((err) => {
        console.error(err);
        alert("Lỗi khi cập nhật sản phẩm!");
      });
  };

  if (loading) return <p>Đang tải...</p>;
  if (!product) return <p>Không tìm thấy sản phẩm</p>;

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigate(-1)}>
        ← Quay lại
      </button>

      <div style={styles.card}>
        {/* Gallery ảnh */}
        <div style={styles.gallery}>
          {/* Ảnh chính (preview) */}
          <div style={styles.mainImageWrapper}>
            <img
              src={previewImage || product.image || "/placeholder.jpg"}
              alt="main"
              style={styles.mainImage}
            />
          </div>

          {/* Grid ảnh phụ + ảnh chính */}
          <div style={styles.thumbnailContainer}>
            {[product.image, ...(product.extraImages || [])]
              .filter(Boolean)
              .slice(0, 8)
              .map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`thumb-${idx}`}
                  style={{
                    ...styles.thumbnail,
                    border: img === previewImage ? "2px solid blue" : "1px solid #ddd",
                  }}
                  onClick={() => setPreviewImage(img)}
                />
              ))}

            {[product.image, ...(product.extraImages || [])].length > 8 && (
              <div style={styles.moreThumbs}>
                +{[product.image, ...(product.extraImages || [])].length - 8} ảnh
              </div>
            )}
          </div>
        </div>

        {/* Thông tin sản phẩm */}
        <div style={styles.info}>
          <h2 style={{ marginBottom: 10 }}>{product.name}</h2>
          <p><strong>Loại:</strong> {product.category}</p>
          <p>
            <strong>Giá:</strong>{" "}
            {product.salePrice > 0 ? (
              <>
                <span
                  style={{
                    textDecoration: "line-through",
                    color: "gray",
                    marginRight: 8,
                  }}
                >
                  {(product.originalPrice ?? 0).toLocaleString()} VNĐ
                </span>
                <span style={{ color: "red", fontWeight: "bold" }}>
                  {(product.salePrice ?? 0).toLocaleString()} VNĐ
                </span>
              </>
            ) : (
              <span>{(product.originalPrice ?? 0).toLocaleString()} VNĐ</span>
            )}
          </p>
          <p><strong>Mô tả:</strong> {product.description}</p>
          <p
            style={{
              color: product.status === "hết hàng" ? "red" : "green",
              fontWeight: "bold",
            }}
          >
            Trạng thái: {product.status}
          </p>

          <h4 style={styles.subheading}>Thông số:</h4>
          <div style={styles.variantList}>
            {product.variants?.length > 0 ? (
              product.variants.map((v, i) => (
                <div key={i} style={styles.variantCard}>
                  <p><strong>Size:</strong> {v.size}</p>
                  <p><strong>Màu:</strong> {v.color}</p>
                  <p><strong>Số lượng:</strong> {v.quantity}</p>
                </div>
              ))
            ) : (
              <p>Không có thông số</p>
            )}
          </div>

          <button
            style={styles.editButton}
            onClick={() => setIsEditOpen(true)}
          >
            Chỉnh sửa
          </button>
        </div>
      </div>


      {/* Modal edit */}
      {isEditOpen && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ marginBottom: 16 }}>Chỉnh sửa sản phẩm</h3>

            <label>Loại sản phẩm:</label>
            <input
              style={styles.input}
              value={editData.category}
              onChange={(e) =>
                setEditData({ ...editData, category: e.target.value })
              }
            />
            {errors.category && (
              <span style={{ color: "red", fontSize: 12 }}>
                {errors.category}
              </span>
            )}

            <label>Tên sản phẩm:</label>
            <input
              style={styles.input}
              value={editData.name}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
            />
            {errors.name && (
              <span style={{ color: "red", fontSize: 12 }}>
                {errors.name}
              </span>
            )}

            <label>Giá gốc:</label>
            <input
              style={styles.input}
              type="number"
              value={editData.originalPrice}
              onChange={(e) =>
                setEditData({ ...editData, originalPrice: +e.target.value })
              }
            />
            {errors.originalPrice && (
              <span style={{ color: "red", fontSize: 12 }}>
                {errors.originalPrice}
              </span>
            )}

            <label>Giá giảm (nếu có):</label>
            <input
              style={styles.input}
              type="number"
              value={editData.salePrice || ""}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  salePrice: e.target.value ? +e.target.value : 0,
                })
              }
            />
            {errors.salePrice && (
              <span style={{ color: "red", fontSize: 12 }}>
                {errors.salePrice}
              </span>
            )}

            <label>Mô tả:</label>
            <textarea
              style={styles.textarea}
              value={editData.description}
              onChange={(e) =>
                setEditData({ ...editData, description: e.target.value })
              }
            />
            {errors.description && (
              <span style={{ color: "red", fontSize: 12 }}>
                {errors.description}
              </span>
            )}

            <label>Trạng thái:</label>
            <select
              style={styles.input}
              value={editData.status}
              onChange={(e) =>
                setEditData({ ...editData, status: e.target.value })
              }
            >
              <option value="còn hàng">Còn hàng</option>
              <option value="hết hàng">Hết hàng</option>
            </select>

            <label>Ảnh chính:</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                style={{ width: 150, marginTop: 10, borderRadius: 6 }}
              />
            )}

            <label>Ảnh phụ:</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleExtraImagesUpload}
            />

            <div style={styles.extraImageList}>
              {editData.extraImages.map((img, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  <img
                    src={img}
                    alt={`extra-${idx}`}
                    style={{ width: 100, margin: 5, borderRadius: 6 }}
                  />
                  <button
                    style={styles.deleteVariantBtn}
                    onClick={() => {
                      const updated = editData.extraImages.filter((_, i) => i !== idx);
                      setEditData({ ...editData, extraImages: updated });
                    }}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>

            <h4 style={{ marginTop: 20 }}>Thông số:</h4>
            {errors.variants && (
              <span style={{ color: "red", fontSize: 12 }}>{errors.variants}</span>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap", // cho phép xuống dòng nếu quá nhiều
              }}
            >
              {editData.variants.map((v, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    padding: "12px",
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column", // input vẫn xếp dọc trong card
                    gap: "8px",
                    width: "150px", // điều chỉnh chiều rộng card
                  }}
                >
                  <input
                    style={{
                      padding: "6px 8px",
                      border: "1px solid #ccc",
                      borderRadius: 4,
                    }}
                    placeholder="Size"
                    value={v.size}
                    onChange={(e) => handleVariantChange(i, "size", e.target.value)}
                  />
                  <input
                    style={{
                      padding: "6px 8px",
                      border: "1px solid #ccc",
                      borderRadius: 4,
                    }}
                    placeholder="Màu"
                    value={v.color}
                    onChange={(e) => handleVariantChange(i, "color", e.target.value)}
                  />
                  <input
                    style={{
                      padding: "6px 8px",
                      border: "1px solid #ccc",
                      borderRadius: 4,
                    }}
                    type="number"
                    placeholder="Số lượng"
                    value={v.quantity}
                    onChange={(e) =>
                      handleVariantChange(i, "quantity", +e.target.value)
                    }
                  />
                  <button
                    style={{
                      background: "#e74c3c",
                      color: "#fff",
                      border: "none",
                      padding: "8px",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      const updated = editData.variants.filter((_, idx) => idx !== i);
                      setEditData({ ...editData, variants: updated });
                    }}
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>

            <button
              style={{
                marginTop: "10px",
                background: "#3498db",
                color: "#fff",
                border: "none",
                padding: "8px 12px",
                borderRadius: 4,
                cursor: "pointer",
              }}
              onClick={() =>
                setEditData({
                  ...editData,
                  variants: [...editData.variants, { size: "", color: "", quantity: 0 }],
                })
              }
            >
              Thêm thông số
            </button>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button
                style={{
                  background: "#2ecc71",
                  color: "#fff",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
                onClick={handleUpdate}
              >
                Lưu
              </button>
              <button
                style={{
                  background: "#bdc3c7",
                  color: "#333",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
                onClick={() => setIsEditOpen(false)}
              >
                Hủy
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};


const styles = {
  variantRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 10,
  },
  variantInput: { flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc', marginBottom: 4 },
  variantList: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 },
  variantCard: { border: '1px solid #ccc', padding: 10, borderRadius: 8, backgroundColor: '#f4f6f8', minWidth: 140, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: 6 },
  container: { padding: 24 },
  backButton: {
    marginBottom: 16,
    padding: "6px 12px",
    backgroundColor: "#f0f0f0",
    border: "1px solid #ccc",
    borderRadius: 6,
    cursor: "pointer",
  },

  // CARD + GALLERY
  card: {
    display: "flex",
    gap: 20,
    border: "1px solid #eee",
    padding: 16,
    borderRadius: 12,
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    backgroundColor: "#fff",
    alignItems: "flex-start", // 👈 canh trên
  },

   gallery: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "center",
  },
  mainImageWrapper: {
    width: "500px",       // CHỐT cố định luôn chiều ngang
    height: "500px",      // CHỐT cố định luôn chiều cao
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: "8px",
    overflow: "hidden",
  },
  mainImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain", // giữ nguyên tỉ lệ
    display: "block",
  },
  thumbnailContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "center",
  },
  thumbnail: {
    width: "70px",
    height: "70px",
    objectFit: "cover",
    cursor: "pointer",
    borderRadius: "4px",
  },
  moreThumbs: {
    width: "70px",
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "#f0f0f0",
    fontSize: "14px",
    cursor: "pointer",
  },

  // INFO
  info: { flex: "2 1 400px" },
  productTitle: {
    fontSize: "1.6rem",
    fontWeight: "bold",
    marginBottom: 10,
  },
  productText: { margin: "6px 0" },
  productPrice: { margin: "8px 0", fontSize: "1.1rem" },

  // VARIANTS
  subheading: { marginTop: 16, fontWeight: "bold", fontSize: "1rem" },
  variantList: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 8,
  },
  variantCard: {
    border: "1px solid #ddd",
    padding: "8px 12px",
    borderRadius: 6,
    backgroundColor: "#fafafa",
    minWidth: 120,
    textAlign: "center",
    fontSize: "0.9rem",
  },

  // BUTTONS
  editButton: {
    marginTop: 20,
    padding: "10px 18px",
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "500",
  },

  // MODAL
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 999,
    overflowY: "auto",
  },
  modalContent: {
    backgroundColor: "#fff",
    margin: "40px auto",
    padding: 20,
    borderRadius: 10,
    width: "95%",
    maxWidth: 700,
    maxHeight: "95vh",
    overflowY: "auto",
  },

  input: {
    width: "100%",
    padding: 8,
    margin: "6px 0",
    borderRadius: 4,
    border: "1px solid #ccc",
  },
  textarea: {
    width: "100%",
    padding: 10,
    minHeight: 100,
    margin: "6px 0",
    borderRadius: 4,
    border: "1px solid #ccc",
  },
  variantInput: {
    flex: 1,
    padding: 6,
    borderRadius: 4,
    border: "1px solid #ccc",
    marginBottom: 4,
    fontSize: "0.9rem",
  },

  deleteVariantBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    background: "red",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: 20,
    height: 20,
    cursor: "pointer",
  },
  extraImageList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "8px",
  },

  modalButtons: { marginTop: 16 },
  saveButton: {
    backgroundColor: "green",
    color: "white",
    padding: "8px 16px",
    border: "none",
    borderRadius: 6,
    marginRight: 10,
    cursor: "pointer",
  },
  cancelButton: {
    backgroundColor: "#888",
    color: "white",
    padding: "8px 16px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
};

export default ProductDetail;
