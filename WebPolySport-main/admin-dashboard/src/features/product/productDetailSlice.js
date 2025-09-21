import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axiosInstance";

// 📌 Fetch chi tiết sản phẩm
export const fetchProductById = createAsyncThunk(
  "productDetail/fetchProductById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/products/${id}`);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không tìm thấy sản phẩm"
      );
    }
  }
);

// 📌 Update sản phẩm
export const updateProductById = createAsyncThunk(
  "productDetail/updateProductById",
  async ({ id, updatedProduct }, { rejectWithValue }) => {
    try {
      let payload = updatedProduct;
      let headers = { "Content-Type": "application/json" };

      // Nếu có file ảnh mới
      if (updatedProduct.image instanceof File) {
        const formData = new FormData();
        for (let key in updatedProduct) {
          if (key === "variants") {
            formData.append(key, JSON.stringify(updatedProduct[key]));
          } else {
            formData.append(key, updatedProduct[key]);
          }
        }
        payload = formData;
        headers = { "Content-Type": "multipart/form-data" };
      }

      const res = await axios.put(`/products/${id}`, payload, { headers });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Cập nhật sản phẩm thất bại"
      );
    }
  }
);

const productDetailSlice = createSlice({
  name: "productDetail",
  initialState: {
    product: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearProductDetail(state) {
      state.product = null;
      state.error = null;
      state.success = false;
    },
    clearSuccess(state) {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.product = null;
        state.error = action.payload;
      })

      // Update
      .addCase(updateProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
        state.error = null;
        state.success = true;
      })
      .addCase(updateProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { clearProductDetail, clearSuccess } = productDetailSlice.actions;
export default productDetailSlice.reducer;
