import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axiosInstance';

//  Lấy toàn bộ sản phẩm
export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async () => {
    const response = await axios.get('/products');
    return response.data;
  }
);

//  Thêm sản phẩm mới (Base64)
export const addProduct = createAsyncThunk(
  'product/addProduct',
  async (formData, thunkAPI) => {
    try {
      const response = await axios.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);


//  Cập nhật sản phẩm
export const updateProduct = createAsyncThunk(
  'product/updateProduct',
  async ({ id, updatedData }) => {
    const response = await axios.put(`/products/${id}`, updatedData, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  }
);

//  Xoá sản phẩm
export const deleteProduct = createAsyncThunk(
  'product/deleteProduct',
  async (id) => {
    await axios.delete(`/products/${id}`);
    return id;
  }
);

const productSlice = createSlice({
  name: 'product',
  initialState: {
    items: [],
    status: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state) => { state.status = 'failed'; })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item._id !== action.payload);
      });
  },
});

export default productSlice.reducer;
